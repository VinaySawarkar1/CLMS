import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { PurchaseOrderStatus, Role } from '@prisma/client';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

export class LineItemDto {
  @IsString() description: string;
  @IsString() @IsOptional() hsnCode?: string;
  @IsNumber() quantity: number;
  @IsString() @IsOptional() unit?: string;
  @IsNumber() unitPrice: number;
  @IsNumber() @IsOptional() discountPct?: number;
  @IsNumber() @IsOptional() gstRate?: number;
}

export class CreatePurchaseOrderDto {
  @IsString() supplierId: string;
  @IsString() @IsOptional() supplierRef?: string;
  @IsString() @IsOptional() contactPerson?: string;
  @IsDateString() @IsOptional() expectedDate?: string;
  @IsString() @IsOptional() deliveryAddress?: string;
  @IsString() @IsOptional() paymentTerms?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto) lineItems: LineItemDto[];
  @IsString() @IsOptional() termsConditions?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() internalNotes?: string;
}

export class UpdatePurchaseOrderDto {
  @IsString() @IsOptional() supplierRef?: string;
  @IsString() @IsOptional() contactPerson?: string;
  @IsDateString() @IsOptional() expectedDate?: string;
  @IsString() @IsOptional() deliveryAddress?: string;
  @IsString() @IsOptional() paymentTerms?: string;
  @IsArray() @IsOptional() lineItems?: LineItemDto[];
  @IsString() @IsOptional() termsConditions?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() internalNotes?: string;
}

function calcTotals(items: LineItemDto[], supplierState?: string, labState?: string) {
  let subTotal = 0, discountTotal = 0, cgst = 0, sgst = 0, igst = 0;
  const interstate = supplierState && labState ? supplierState !== labState : false;

  for (const item of items) {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
    const discAmt = lineTotal * ((item.discountPct || 0) / 100);
    const taxable = lineTotal - discAmt;
    const gstRate = item.gstRate || 18;
    const gstAmt = (taxable * gstRate) / 100;
    subTotal += taxable;
    discountTotal += discAmt;
    if (interstate) { igst += gstAmt; } else { cgst += gstAmt / 2; sgst += gstAmt / 2; }
  }
  return { subTotal, discountTotal, cgst, sgst, igst, totalAmount: subTotal + cgst + sgst + igst };
}

@Injectable()
class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextNumber(labId: string) {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const existing = await this.prisma.purchaseOrder.findMany({
      where: { labId, poNumber: { startsWith: prefix } },
      select: { poNumber: true },
    });
    let max = 0;
    for (const { poNumber } of existing) {
      const n = parseInt(poNumber.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }

  async create(labId: string, dto: CreatePurchaseOrderDto) {
    const [lab, supplier] = await Promise.all([
      this.prisma.lab.findUnique({ where: { id: labId }, select: { state: true } }),
      this.prisma.supplier.findUnique({ where: { id: dto.supplierId }, select: { billingState: true } }),
    ]);
    const { subTotal, discountTotal, cgst, sgst, igst, totalAmount } = calcTotals(dto.lineItems, supplier?.billingState ?? undefined, lab?.state ?? undefined);
    return this.prisma.purchaseOrder.create({
      data: {
        labId,
        poNumber: await this.nextNumber(labId),
        supplierId: dto.supplierId,
        supplierRef: dto.supplierRef,
        contactPerson: dto.contactPerson,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        deliveryAddress: dto.deliveryAddress,
        paymentTerms: dto.paymentTerms,
        lineItems: dto.lineItems as any,
        subTotal, discountTotal, cgst, sgst, igst, totalAmount,
        termsConditions: dto.termsConditions,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
      },
      include: { supplier: { select: { name: true, code: true, phone: true, email: true } } },
    });
  }

  findAll(labId: string, search?: string, status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        labId,
        ...(status ? { status: status as PurchaseOrderStatus } : {}),
        ...(search ? { supplier: { name: { contains: search, mode: 'insensitive' } } } : {}),
      },
      include: { supplier: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, labId },
      include: { supplier: { select: { name: true, code: true, phone: true, email: true, gstin: true, billingAddress: true, billingCity: true, billingState: true, billingPinCode: true } } },
    });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return po;
  }

  async update(id: string, labId: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, labId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status !== 'DRAFT') throw new Error('Only DRAFT orders can be edited');

    const items = dto.lineItems ?? (po.lineItems as unknown as LineItemDto[]);
    const [lab, supplier] = await Promise.all([
      this.prisma.lab.findUnique({ where: { id: labId }, select: { state: true } }),
      this.prisma.supplier.findUnique({ where: { id: po.supplierId }, select: { billingState: true } }),
    ]);
    const { subTotal, discountTotal, cgst, sgst, igst, totalAmount } = calcTotals(items, supplier?.billingState ?? undefined, lab?.state ?? undefined);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { ...dto, lineItems: items as any, subTotal, discountTotal, cgst, sgst, igst, totalAmount,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined },
      include: { supplier: { select: { name: true, code: true } } },
    });
  }

  async setStatus(id: string, labId: string, status: PurchaseOrderStatus, reason?: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, labId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status, ...(reason ? { cancelReason: reason } : {}) },
      include: { supplier: { select: { name: true, code: true } } },
    });
  }

  async remove(id: string, labId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, labId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (!['DRAFT', 'CANCELLED'].includes(po.status)) throw new Error('Only DRAFT or CANCELLED POs can be deleted');
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }

  stats(labId: string) {
    return Promise.all([
      this.prisma.purchaseOrder.count({ where: { labId } }),
      this.prisma.purchaseOrder.count({ where: { labId, status: 'DRAFT' } }),
      this.prisma.purchaseOrder.count({ where: { labId, status: 'APPROVED' } }),
      this.prisma.purchaseOrder.count({ where: { labId, status: 'SENT' } }),
      this.prisma.purchaseOrder.aggregate({ where: { labId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
    ]).then(([total, draft, approved, sent, agg]) => ({
      total, draft, approved, sent, totalValue: agg._sum.totalAmount ?? 0,
    }));
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.service.create(req.user.labId, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query('search') search?: string, @Query('status') status?: string) {
    return this.service.findAll(req.user.labId, search, status);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.service.stats(req.user.labId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user.labId);
  }

  @Patch(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.service.update(id, req.user.labId, dto);
  }

  @Patch(':id/status')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  setStatus(@Request() req: any, @Param('id') id: string,
    @Body('status') status: PurchaseOrderStatus, @Body('reason') reason?: string) {
    return this.service.setStatus(id, req.user.labId, status, reason);
  }

  @Delete(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(id, req.user.labId);
  }
}

@Module({
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
