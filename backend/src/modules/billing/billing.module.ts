import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvoiceStatus, Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

const TAX_RATE = 0.18; // GST 18%

@Injectable()
class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(data: { customerId: string; amount: number }) {
    const taxAmount = +(data.amount * TAX_RATE).toFixed(2);
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: await this.nextInvoiceNumber(),
        customerId: data.customerId,
        amount: data.amount,
        taxAmount,
        totalAmount: +(data.amount + taxAmount).toFixed(2),
        status: 'ISSUED',
        issueDate: new Date(),
      },
    });
  }

  list() {
    return this.prisma.invoice.findMany({
      include: { customer: { select: { name: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(invoiceId: string, amount: number, method?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    await this.prisma.payment.create({ data: { invoiceId, amount, method } });

    const paid =
      invoice.payments.reduce((s, p) => s + p.amount, 0) + amount;
    const status: InvoiceStatus =
      paid >= invoice.totalAmount
        ? 'PAID'
        : paid > 0
          ? 'PARTIALLY_PAID'
          : invoice.status;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: { payments: true },
    });
  }

  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV/${year}/`;
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('invoices')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTS)
  createInvoice(@Body() body: any) {
    return this.billing.createInvoice(body);
  }

  @Get('invoices')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTS, Role.LAB_DIRECTOR)
  list() {
    return this.billing.list();
  }

  @Post('invoices/:id/payments')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTS)
  pay(@Param('id') id: string, @Body() body: any) {
    return this.billing.recordPayment(id, body.amount, body.method);
  }
}

@Module({
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
