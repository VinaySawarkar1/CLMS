import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { InvoiceStatus, Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

type InvItem = {
  description: string; hsnCode?: string; quantity: number; unit?: string;
  unitPrice: number; discountPct?: number; gstRate?: number;
};

function calcTotals(items: InvItem[], placeOfSupply?: string, labState?: string) {
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
class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextInvoiceNumber(labId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const existing = await this.prisma.invoice.findMany({
      where: { invoiceNumber: { startsWith: prefix }, labId },
      select: { invoiceNumber: true },
    });
    let max = 0;
    for (const { invoiceNumber } of existing) {
      const n = parseInt(invoiceNumber.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }

  async createInvoice(labId: string, data: any) {
    const items: InvItem[] = data.lineItems ?? [];
    const { amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount } = calcTotals(items, data.placeOfSupply);
    return this.prisma.invoice.create({
      data: {
        labId, customerId: data.customerId,
        invoiceNumber: await this.nextInvoiceNumber(labId),
        lineItems: items as any, amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        placeOfSupply: data.placeOfSupply,
        customerPoNumber: data.customerPoNumber,
        paymentTerms: data.paymentTerms,
        termsConditions: data.termsConditions,
        notes: data.notes,
        linkedQuotationId: data.linkedQuotationId,
        linkedChallanId: data.linkedChallanId,
        status: 'ISSUED',
        issueDate: new Date(),
      },
      include: { customer: { select: { name: true, code: true, email: true, gstin: true } }, payments: true },
    });
  }

  async createDraft(labId: string, data: any) {
    const items: InvItem[] = data.lineItems ?? [];
    const { amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount } = calcTotals(items, data.placeOfSupply);
    return this.prisma.invoice.create({
      data: {
        labId, customerId: data.customerId,
        invoiceNumber: `DRAFT-${Date.now()}`,
        lineItems: items as any, amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        placeOfSupply: data.placeOfSupply, customerPoNumber: data.customerPoNumber,
        paymentTerms: data.paymentTerms, termsConditions: data.termsConditions, notes: data.notes,
        linkedQuotationId: data.linkedQuotationId, linkedChallanId: data.linkedChallanId,
        status: 'DRAFT',
      },
      include: { customer: { select: { name: true, code: true } }, payments: true },
    });
  }

  async finalise(id: string, labId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, labId } });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (inv.status !== 'DRAFT') throw new Error('Only DRAFT invoices can be finalised');
    return this.prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber: await this.nextInvoiceNumber(labId),
        status: 'ISSUED', issueDate: new Date(),
      },
      include: { customer: { select: { name: true, code: true } }, payments: true },
    });
  }

  list(labId: string, search?: string, status?: string) {
    return this.prisma.invoice.findMany({
      where: {
        labId,
        ...(status ? { status: status as InvoiceStatus } : {}),
        ...(search ? { OR: [
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
        ] } : {}),
      },
      include: { customer: { select: { name: true, code: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, labId },
      include: { customer: { select: { name: true, code: true, email: true, phone: true, gstin: true, billingAddress: true, billingCity: true, billingState: true } }, payments: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async update(id: string, labId: string, data: any) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, labId } });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (!['DRAFT'].includes(inv.status)) throw new Error('Only DRAFT invoices can be edited');
    const items: InvItem[] = data.lineItems ?? (inv.lineItems as InvItem[]);
    const { amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount } = calcTotals(items, data.placeOfSupply ?? inv.placeOfSupply ?? undefined);
    return this.prisma.invoice.update({
      where: { id },
      data: { ...data, lineItems: items as any, amount, discountTotal, taxAmount, cgst, sgst, igst, totalAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : inv.dueDate },
      include: { customer: { select: { name: true, code: true } }, payments: true },
    });
  }

  async recordPayment(invoiceId: string, labId: string, amount: number, method?: string, reference?: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, labId },
      include: { payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot record payment on a cancelled invoice');

    await this.prisma.payment.create({ data: { invoiceId, amount, method, ...(reference ? { method: `${method ?? ''} — ${reference}` } : {}) } });

    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0) + amount;
    const status: InvoiceStatus = paid >= invoice.totalAmount ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : invoice.status;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: { customer: { select: { name: true, code: true } }, payments: true },
    });
  }

  async cancel(id: string, labId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, labId } });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (!['DRAFT'].includes(inv.status)) throw new Error('Only DRAFT invoices can be cancelled. Use Credit Note for issued invoices.');
    return this.prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async remove(id: string, labId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, labId } });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (!['DRAFT', 'CANCELLED'].includes(inv.status)) throw new Error('Only DRAFT or CANCELLED invoices can be deleted');
    return this.prisma.invoice.delete({ where: { id } });
  }

  stats(labId: string) {
    return Promise.all([
      this.prisma.invoice.count({ where: { labId } }),
      this.prisma.invoice.aggregate({ where: { labId, status: 'ISSUED' }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { labId, status: 'PARTIALLY_PAID' }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { labId, status: 'PAID' }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { invoice: { labId } }, _sum: { amount: true } }),
    ]).then(([total, issued, partial, paid, payments]) => ({
      total,
      issued: { count: issued._count, value: issued._sum.totalAmount ?? 0 },
      partiallyPaid: { count: partial._count, value: partial._sum.totalAmount ?? 0 },
      paid: { count: paid._count, value: paid._sum.totalAmount ?? 0 },
      totalCollected: payments._sum.amount ?? 0,
      outstanding: ((issued._sum.totalAmount ?? 0) + (partial._sum.totalAmount ?? 0)),
    }));
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('invoices')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  createInvoice(@Request() req: any, @Body() body: any) {
    return this.billing.createInvoice(req.user.labId, body);
  }

  @Post('invoices/draft')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  createDraft(@Request() req: any, @Body() body: any) {
    return this.billing.createDraft(req.user.labId, body);
  }

  @Get('invoices')
  list(@Request() req: any, @Query('search') search?: string, @Query('status') status?: string) {
    return this.billing.list(req.user.labId, search, status);
  }

  @Get('invoices/stats')
  stats(@Request() req: any) {
    return this.billing.stats(req.user.labId);
  }

  @Get('invoices/:id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.billing.findOne(id, req.user.labId);
  }

  @Patch('invoices/:id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.billing.update(id, req.user.labId, body);
  }

  @Patch('invoices/:id/finalise')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  finalise(@Request() req: any, @Param('id') id: string) {
    return this.billing.finalise(id, req.user.labId);
  }

  @Post('invoices/:id/pay')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  pay(@Request() req: any, @Param('id') id: string,
    @Body('amount') amount: number, @Body('method') method?: string, @Body('reference') reference?: string) {
    return this.billing.recordPayment(id, req.user.labId, amount, method, reference);
  }

  @Patch('invoices/:id/cancel')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.billing.cancel(id, req.user.labId);
  }

  @Delete('invoices/:id')
  @Roles(Role.LAB_ADMIN)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.billing.remove(id, req.user.labId);
  }

  // Legacy endpoints for backward compatibility
  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  legacyCreate(@Request() req: any, @Body() body: any) {
    return this.billing.createInvoice(req.user.labId, { ...body, lineItems: body.lineItems ?? [] });
  }

  @Get()
  legacyList(@Request() req: any) {
    return this.billing.list(req.user.labId);
  }

  @Post(':id/pay')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  legacyPay(@Request() req: any, @Param('id') id: string, @Body('amount') amount: number) {
    return this.billing.recordPayment(id, req.user.labId, amount);
  }
}

@Module({
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
