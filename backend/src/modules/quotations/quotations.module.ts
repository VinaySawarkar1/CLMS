import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { QuotationStatus, Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

type QuoteItem = {
  description: string; hsnCode?: string; quantity: number; unit?: string;
  unitPrice: number; discountPct?: number; gstRate?: number;
};

function calcTotals(items: QuoteItem[], placeOfSupply?: string, labState?: string) {
  let subTotal = 0, discountTotal = 0, cgst = 0, sgst = 0, igst = 0;
  const interstate = placeOfSupply && labState ? placeOfSupply !== labState : false;
  for (const item of items) {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
    const discAmt = lineTotal * ((item.discountPct || 0) / 100);
    const taxable = lineTotal - discAmt;
    const gstRate = item.gstRate ?? 18;
    const gstAmt = (taxable * gstRate) / 100;
    subTotal += taxable;
    discountTotal += discAmt;
    if (interstate) { igst += gstAmt; } else { cgst += gstAmt / 2; sgst += gstAmt / 2; }
  }
  const taxAmount = cgst + sgst + igst;
  return { amount: subTotal, discountTotal, taxAmount, cgst, sgst, igst, totalAmount: subTotal + taxAmount };
}

@Injectable()
class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextNumber(labId: string) {
    const year = new Date().getFullYear();
    const prefix = `QTN-${year}-`;
    const existing = await this.prisma.quotation.findMany({
      where: { labId, quoteNumber: { startsWith: prefix } },
      select: { quoteNumber: true },
    });
    let max = 0;
    for (const { quoteNumber } of existing) {
      const n = parseInt(quoteNumber.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }

  async create(labId: string, data: any) {
    const items: QuoteItem[] = data.items ?? [];
    const { amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount } = calcTotals(items, data.placeOfSupply);
    return this.prisma.quotation.create({
      data: {
        labId, customerId: data.customerId,
        quoteNumber: await this.nextNumber(labId),
        subject: data.subject, reference: data.reference, contactPerson: data.contactPerson,
        items: items as any, amount, discountTotal, taxRate: data.taxRate ?? 18, taxAmount,
        cgst, sgst, igst, totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        deliveryTerms: data.deliveryTerms, deliveryPeriod: data.deliveryPeriod,
        termsConditions: data.termsConditions, placeOfSupply: data.placeOfSupply, notes: data.notes,
      },
      include: { customer: { select: { name: true, code: true, email: true, billingAddress: true, gstin: true } } },
    });
  }

  list(labId: string, search?: string, status?: string) {
    return this.prisma.quotation.findMany({
      where: {
        labId,
        ...(status ? { status: status as QuotationStatus } : {}),
        ...(search ? { OR: [
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { quoteNumber: { contains: search, mode: 'insensitive' } },
        ] } : {}),
      },
      include: { customer: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const q = await this.prisma.quotation.findFirst({
      where: { id, labId },
      include: { customer: { select: { name: true, code: true, email: true, phone: true, billingAddress: true, billingCity: true, billingState: true, billingPinCode: true, gstin: true } } },
    });
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  async update(id: string, labId: string, data: any) {
    const q = await this.prisma.quotation.findFirst({ where: { id, labId } });
    if (!q) throw new NotFoundException('Quotation not found');
    const items: QuoteItem[] = data.items ?? (q.items as QuoteItem[]);
    const { amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount } = calcTotals(items, data.placeOfSupply ?? q.placeOfSupply ?? undefined);
    return this.prisma.quotation.update({
      where: { id },
      data: { ...data, items: items as any, amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : q.validUntil },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  async setStatus(id: string, labId: string, status: QuotationStatus) {
    const q = await this.prisma.quotation.findFirst({ where: { id, labId } });
    if (!q) throw new NotFoundException('Quotation not found');
    return this.prisma.quotation.update({ where: { id }, data: { status } });
  }

  async duplicate(id: string, labId: string) {
    const q = await this.findOne(id, labId);
    const { amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount } = calcTotals(q.items as QuoteItem[]);
    return this.prisma.quotation.create({
      data: {
        labId, customerId: q.customerId,
        quoteNumber: await this.nextNumber(labId),
        subject: q.subject ? `Copy of ${q.subject}` : undefined,
        reference: q.reference, contactPerson: q.contactPerson,
        items: q.items as any, amount, discountTotal, taxRate: q.taxRate, taxAmount,
        cgst, sgst, igst, totalAmount,
        validUntil: q.validUntil,
        deliveryTerms: q.deliveryTerms, deliveryPeriod: q.deliveryPeriod,
        termsConditions: q.termsConditions, placeOfSupply: q.placeOfSupply, notes: q.notes,
      },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  async remove(id: string, labId: string) {
    const q = await this.prisma.quotation.findFirst({ where: { id, labId } });
    if (!q) throw new NotFoundException('Quotation not found');
    if (q.status !== 'DRAFT') throw new Error('Only DRAFT quotations can be deleted');
    return this.prisma.quotation.delete({ where: { id } });
  }

  stats(labId: string) {
    return Promise.all([
      this.prisma.quotation.count({ where: { labId } }),
      this.prisma.quotation.count({ where: { labId, status: 'DRAFT' } }),
      this.prisma.quotation.count({ where: { labId, status: 'SENT' } }),
      this.prisma.quotation.count({ where: { labId, status: 'ACCEPTED' } }),
      this.prisma.quotation.count({ where: { labId, status: 'REJECTED' } }),
      this.prisma.quotation.aggregate({ where: { labId }, _sum: { totalAmount: true } }),
    ]).then(([total, draft, sent, accepted, rejected, agg]) => ({
      total, draft, sent, accepted, rejected,
      winRate: (accepted + rejected) > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : 0,
      totalValue: agg._sum.totalAmount ?? 0,
    }));
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quotations')
class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() body: any) {
    return this.quotations.create(req.user.labId, body);
  }

  @Get()
  list(@Request() req: any, @Query('search') search?: string, @Query('status') status?: string) {
    return this.quotations.list(req.user.labId, search, status);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.quotations.stats(req.user.labId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.quotations.findOne(id, req.user.labId);
  }

  @Patch(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.quotations.update(id, req.user.labId, body);
  }

  @Patch(':id/status')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  setStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: QuotationStatus) {
    return this.quotations.setStatus(id, req.user.labId, status);
  }

  @Post(':id/duplicate')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  duplicate(@Request() req: any, @Param('id') id: string) {
    return this.quotations.duplicate(id, req.user.labId);
  }

  @Delete(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.quotations.remove(id, req.user.labId);
  }
}

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
