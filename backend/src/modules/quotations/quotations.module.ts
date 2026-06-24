import {
  Body, Controller, Get, Injectable, Module, Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { QuotationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type QuoteItem = { description: string; quantity: number; rate: number };
type QuoteInput = {
  customerId: string;
  items: QuoteItem[];
  taxRate?: number;
  validUntil?: string;
  notes?: string;
};

@Injectable()
class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  private totals(items: QuoteItem[], taxRate: number) {
    const amount = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.rate || 0), 0);
    const taxAmount = (amount * taxRate) / 100;
    return { amount, taxAmount, totalAmount: amount + taxAmount };
  }

  private async nextNumber(labId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.quotation.count({ where: { labId } });
    return `QT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  list(labId: string) {
    return this.prisma.quotation.findMany({
      where: { labId },
      include: { customer: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(labId: string, data: QuoteInput) {
    const taxRate = data.taxRate ?? 18;
    const items = data.items ?? [];
    const { amount, taxAmount, totalAmount } = this.totals(items, taxRate);
    return this.prisma.quotation.create({
      data: {
        labId,
        quoteNumber: await this.nextNumber(labId),
        customerId: data.customerId,
        items: items as any,
        taxRate,
        amount,
        taxAmount,
        totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes,
      },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  async setStatus(id: string, labId: string, status: QuotationStatus) {
    const existing = await this.prisma.quotation.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Quotation not found');
    return this.prisma.quotation.update({ where: { id }, data: { status } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('quotations')
class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  list(@Request() req: any) {
    return this.quotations.list(req.user.labId);
  }

  @Post()
  create(@Request() req: any, @Body() body: QuoteInput) {
    return this.quotations.create(req.user.labId, body);
  }

  @Patch(':id/status')
  setStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: QuotationStatus) {
    return this.quotations.setStatus(id, req.user.labId, status);
  }
}

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
