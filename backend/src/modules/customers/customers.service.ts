import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(labId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { ...dto, labId } });
  }

  findAll(labId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        labId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, labId },
      include: { contacts: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /**
   * Module 6 — CRM customer timeline. Aggregates the customer's complete
   * history (quotations, POs, calibrations, certificates, invoices, payments,
   * complaints, deliveries) into one chronological event stream.
   */
  async timeline(id: string, labId: string) {
    await this.findOne(id, labId);
    const events: { type: string; date: Date; title: string; ref?: string; meta?: any }[] = [];

    const [quotations, jobs, invoices, complaints] = await Promise.all([
      this.prisma.quotation.findMany({ where: { labId, customerId: id } }),
      this.prisma.job.findMany({
        where: { labId, customerId: id },
        include: { instrument: { select: { name: true } }, certificate: { select: { certificateNumber: true, issueDate: true } } },
      }),
      this.prisma.invoice.findMany({ where: { labId, customerId: id }, include: { payments: true } }),
      this.prisma.complaint.findMany({ where: { labId, customerId: id } }),
    ]);

    for (const q of quotations) {
      events.push({ type: 'QUOTATION', date: q.createdAt, title: `Quotation ${q.quoteNumber} (${q.status})`, ref: q.quoteNumber, meta: { total: q.totalAmount } });
    }
    for (const j of jobs) {
      events.push({ type: 'CALIBRATION', date: j.receivedAt, title: `Job ${j.jobNumber} — ${(j as any).instrument?.name ?? ''} (${j.status})`, ref: j.jobNumber });
      if (j.poNumber) {
        events.push({ type: 'PO', date: j.receivedAt, title: `PO ${j.poNumber}`, ref: j.poNumber });
      }
      const cert = (j as any).certificate;
      if (cert) {
        events.push({ type: 'CERTIFICATE', date: cert.issueDate, title: `Certificate ${cert.certificateNumber}`, ref: cert.certificateNumber });
      }
      if (j.status === 'DELIVERED' || j.status === 'CLOSED') {
        events.push({ type: 'DELIVERY', date: j.updatedAt, title: `Delivered — Job ${j.jobNumber}`, ref: j.jobNumber });
      }
    }
    for (const inv of invoices) {
      events.push({ type: 'INVOICE', date: inv.issueDate ?? inv.createdAt, title: `Invoice ${inv.invoiceNumber} (${inv.status})`, ref: inv.invoiceNumber, meta: { total: inv.totalAmount } });
      for (const p of inv.payments) {
        events.push({ type: 'PAYMENT', date: p.paidAt, title: `Payment ${p.amount}${p.method ? ` (${p.method})` : ''}`, ref: inv.invoiceNumber, meta: { amount: p.amount } });
      }
    }
    for (const c of complaints) {
      events.push({ type: 'COMPLAINT', date: c.createdAt, title: `Complaint ${c.complaintNo} (${c.status})`, ref: c.complaintNo });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }

  async update(id: string, labId: string, dto: UpdateCustomerDto) {
    await this.findOne(id, labId);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string, labId: string) {
    await this.findOne(id, labId);
    return this.prisma.customer.delete({ where: { id } });
  }

  async stats(id: string, labId: string) {
    await this.findOne(id, labId);
    const [quotations, invoices, purchaseOrders, deliveryChallans] = await Promise.all([
      this.prisma.quotation.aggregate({ where: { customerId: id, labId }, _count: true, _sum: { totalAmount: true } }),
      this.prisma.invoice.aggregate({ where: { customerId: id, labId }, _count: true, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.aggregate({ where: { supplierId: id, labId }, _count: true, _sum: { totalAmount: true } }),
      this.prisma.deliveryChallan.count({ where: { customerId: id, labId } }),
    ]);
    const payments = await this.prisma.payment.aggregate({
      where: { invoice: { customerId: id, labId } }, _sum: { amount: true },
    });
    const outstanding = (invoices._sum.totalAmount ?? 0) - (payments._sum.amount ?? 0);
    return {
      quotations: { count: quotations._count, total: quotations._sum.totalAmount ?? 0 },
      invoices: { count: invoices._count, total: invoices._sum.totalAmount ?? 0 },
      purchaseOrders: { count: purchaseOrders._count, total: purchaseOrders._sum.totalAmount ?? 0 },
      deliveryChallans,
      paymentsReceived: payments._sum.amount ?? 0,
      outstanding: Math.max(0, outstanding),
    };
  }

  async ledger(id: string, labId: string) {
    await this.findOne(id, labId);
    const [invoices, purchaseOrders] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { customerId: id, labId },
        include: { payments: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { supplierId: id, labId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    const entries: any[] = [];
    for (const inv of invoices) {
      entries.push({ date: inv.issueDate ?? inv.createdAt, type: 'INVOICE', ref: inv.invoiceNumber, debit: inv.totalAmount, credit: 0 });
      for (const p of inv.payments) {
        entries.push({ date: p.paidAt, type: 'PAYMENT', ref: inv.invoiceNumber, debit: 0, credit: p.amount });
      }
    }
    for (const po of purchaseOrders) {
      entries.push({ date: po.poDate, type: 'PURCHASE_ORDER', ref: po.poNumber, debit: 0, credit: po.totalAmount });
    }
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    return entries.map(e => { balance += (e.debit - e.credit); return { ...e, balance }; });
  }

  async bulkCreate(labId: string, records: CreateCustomerDto[]) {
    const results: any[] = [];
    for (const dto of records) {
      try {
        results.push(await this.create(labId, dto));
      } catch (e: any) {
        results.push({ error: e?.message, input: dto });
      }
    }
    return { imported: results.filter((r: any) => !r.error).length, errors: results.filter((r: any) => r.error) };
  }
}
