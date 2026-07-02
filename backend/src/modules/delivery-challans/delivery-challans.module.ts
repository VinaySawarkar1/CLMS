import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { DeliveryChallanStatus, Role } from '@prisma/client';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

export class DCLineItemDto {
  @IsString() description: string;
  @IsString() @IsOptional() hsnCode?: string;
  @IsNumber() quantity: number;
  @IsString() @IsOptional() unit?: string;
  @IsNumber() @IsOptional() rate?: number;
  @IsString() @IsOptional() remarks?: string;
}

export class CreateDeliveryChallanDto {
  @IsString() customerId: string;
  @IsString() @IsOptional() contactPerson?: string;
  @IsString() @IsOptional() challanType?: string;
  @IsString() @IsOptional() deliveryAddress?: string;
  @IsString() @IsOptional() linkedQuotationId?: string;
  @IsString() @IsOptional() linkedInvoiceId?: string;
  @IsArray() lineItems: DCLineItemDto[];
  @IsDateString() @IsOptional() expectedDelivery?: string;
  @IsString() @IsOptional() transportMode?: string;
  @IsString() @IsOptional() transporterName?: string;
  @IsString() @IsOptional() vehicleNumber?: string;
  @IsString() @IsOptional() driverName?: string;
  @IsString() @IsOptional() driverMobile?: string;
  @IsString() @IsOptional() lrNumber?: string;
  @IsDateString() @IsOptional() lrDate?: string;
  @IsString() @IsOptional() eWayBillNumber?: string;
  @IsNumber() @IsOptional() numberOfPackages?: number;
  @IsNumber() @IsOptional() weightKg?: number;
  @IsString() @IsOptional() remarks?: string;
}

export class UpdateDeliveryChallanDto {
  @IsString() @IsOptional() contactPerson?: string;
  @IsString() @IsOptional() deliveryAddress?: string;
  @IsArray() @IsOptional() lineItems?: DCLineItemDto[];
  @IsDateString() @IsOptional() expectedDelivery?: string;
  @IsString() @IsOptional() transportMode?: string;
  @IsString() @IsOptional() transporterName?: string;
  @IsString() @IsOptional() vehicleNumber?: string;
  @IsString() @IsOptional() driverName?: string;
  @IsString() @IsOptional() driverMobile?: string;
  @IsString() @IsOptional() lrNumber?: string;
  @IsDateString() @IsOptional() lrDate?: string;
  @IsString() @IsOptional() eWayBillNumber?: string;
  @IsNumber() @IsOptional() numberOfPackages?: number;
  @IsNumber() @IsOptional() weightKg?: number;
  @IsString() @IsOptional() remarks?: string;
  @IsBoolean() @IsOptional() podUploaded?: boolean;
}

@Injectable()
class DeliveryChallansService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextNumber(labId: string) {
    const year = new Date().getFullYear();
    const prefix = `DC-${year}-`;
    const existing = await this.prisma.deliveryChallan.findMany({
      where: { labId, challanNumber: { startsWith: prefix } },
      select: { challanNumber: true },
    });
    let max = 0;
    for (const { challanNumber } of existing) {
      const n = parseInt(challanNumber.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }

  async create(labId: string, dto: CreateDeliveryChallanDto) {
    return this.prisma.deliveryChallan.create({
      data: {
        labId,
        challanNumber: await this.nextNumber(labId),
        customerId: dto.customerId,
        contactPerson: dto.contactPerson,
        challanType: dto.challanType ?? 'SALE',
        deliveryAddress: dto.deliveryAddress,
        linkedQuotationId: dto.linkedQuotationId,
        linkedInvoiceId: dto.linkedInvoiceId,
        lineItems: dto.lineItems as any,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
        transportMode: dto.transportMode,
        transporterName: dto.transporterName,
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        driverMobile: dto.driverMobile,
        lrNumber: dto.lrNumber,
        lrDate: dto.lrDate ? new Date(dto.lrDate) : null,
        eWayBillNumber: dto.eWayBillNumber,
        numberOfPackages: dto.numberOfPackages,
        weightKg: dto.weightKg,
        remarks: dto.remarks,
      },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  findAll(labId: string, search?: string, status?: string) {
    return this.prisma.deliveryChallan.findMany({
      where: {
        labId,
        ...(status ? { status: status as DeliveryChallanStatus } : {}),
        ...(search ? { customer: { name: { contains: search, mode: 'insensitive' } } } : {}),
      },
      include: { customer: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const dc = await this.prisma.deliveryChallan.findFirst({
      where: { id, labId },
      include: { customer: { select: { name: true, code: true, email: true, phone: true, gstin: true, billingAddress: true, billingCity: true, billingState: true, billingPinCode: true } } },
    });
    if (!dc) throw new NotFoundException('Delivery Challan not found');
    return dc;
  }

  async update(id: string, labId: string, dto: UpdateDeliveryChallanDto) {
    const dc = await this.prisma.deliveryChallan.findFirst({ where: { id, labId } });
    if (!dc) throw new NotFoundException('Delivery Challan not found');
    if (!['DRAFT', 'DISPATCHED'].includes(dc.status)) throw new Error('Cannot edit a delivered or closed challan');
    return this.prisma.deliveryChallan.update({
      where: { id },
      data: {
        ...dto,
        lineItems: dto.lineItems ? dto.lineItems as any : undefined,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        lrDate: dto.lrDate ? new Date(dto.lrDate) : undefined,
      },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  async dispatch(id: string, labId: string) {
    const dc = await this.prisma.deliveryChallan.findFirst({ where: { id, labId } });
    if (!dc) throw new NotFoundException('Delivery Challan not found');
    if (dc.status !== 'DRAFT') throw new Error('Only DRAFT challans can be dispatched');
    return this.prisma.deliveryChallan.update({
      where: { id },
      data: { status: 'DISPATCHED', dispatchDate: new Date() },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  async markDelivered(id: string, labId: string) {
    const dc = await this.prisma.deliveryChallan.findFirst({ where: { id, labId } });
    if (!dc) throw new NotFoundException('Delivery Challan not found');
    if (dc.status !== 'DISPATCHED') throw new Error('Only dispatched challans can be marked delivered');
    return this.prisma.deliveryChallan.update({
      where: { id },
      data: { status: 'DELIVERED', podUploaded: true },
      include: { customer: { select: { name: true, code: true } } },
    });
  }

  async setStatus(id: string, labId: string, status: DeliveryChallanStatus, reason?: string) {
    const dc = await this.prisma.deliveryChallan.findFirst({ where: { id, labId } });
    if (!dc) throw new NotFoundException('Delivery Challan not found');
    return this.prisma.deliveryChallan.update({
      where: { id },
      data: { status, ...(reason ? { cancelReason: reason } : {}) },
    });
  }

  async remove(id: string, labId: string) {
    const dc = await this.prisma.deliveryChallan.findFirst({ where: { id, labId } });
    if (!dc) throw new NotFoundException('Delivery Challan not found');
    if (!['DRAFT', 'CANCELLED'].includes(dc.status)) throw new Error('Only DRAFT or CANCELLED challans can be deleted');
    return this.prisma.deliveryChallan.delete({ where: { id } });
  }

  stats(labId: string) {
    return Promise.all([
      this.prisma.deliveryChallan.count({ where: { labId } }),
      this.prisma.deliveryChallan.count({ where: { labId, status: 'DRAFT' } }),
      this.prisma.deliveryChallan.count({ where: { labId, status: 'DISPATCHED' } }),
      this.prisma.deliveryChallan.count({ where: { labId, status: 'DELIVERED' } }),
    ]).then(([total, draft, dispatched, delivered]) => ({ total, draft, dispatched, delivered }));
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery-challans')
class DeliveryChallansController {
  constructor(private readonly service: DeliveryChallansService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() dto: CreateDeliveryChallanDto) {
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
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDeliveryChallanDto) {
    return this.service.update(id, req.user.labId, dto);
  }

  @Patch(':id/dispatch')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  dispatch(@Request() req: any, @Param('id') id: string) {
    return this.service.dispatch(id, req.user.labId);
  }

  @Patch(':id/deliver')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  markDelivered(@Request() req: any, @Param('id') id: string) {
    return this.service.markDelivered(id, req.user.labId);
  }

  @Patch(':id/status')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  setStatus(@Request() req: any, @Param('id') id: string,
    @Body('status') status: DeliveryChallanStatus, @Body('reason') reason?: string) {
    return this.service.setStatus(id, req.user.labId, status, reason);
  }

  @Delete(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(id, req.user.labId);
  }
}

@Module({
  controllers: [DeliveryChallansController],
  providers: [DeliveryChallansService],
})
export class DeliveryChallansModule {}
