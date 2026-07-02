import { Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';

enum ActivityType { CALL='CALL', EMAIL='EMAIL', MEETING='MEETING', TASK='TASK', NOTE='NOTE', WHATSAPP='WHATSAPP' }

class CreateActivityDto {
  @IsEnum(ActivityType) type: ActivityType;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() outcome?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() createdBy?: string;
}

class UpdateActivityDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() outcome?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsBoolean() isDone?: boolean;
}

@Injectable()
class CrmActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(labId: string, dto: CreateActivityDto) {
    return this.prisma.crmActivity.create({
      data: {
        labId, ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { customer: { select: { id: true, name: true } }, lead: { select: { id: true, title: true } } },
    });
  }

  async findAll(labId: string, opts: { type?: string; customerId?: string; leadId?: string; isDone?: string }) {
    return this.prisma.crmActivity.findMany({
      where: {
        labId,
        ...(opts.type ? { type: opts.type as any } : {}),
        ...(opts.customerId ? { customerId: opts.customerId } : {}),
        ...(opts.leadId ? { leadId: opts.leadId } : {}),
        ...(opts.isDone !== undefined ? { isDone: opts.isDone === 'true' } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, stage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async complete(id: string, labId: string, outcome?: string) {
    return this.prisma.crmActivity.update({
      where: { id },
      data: { isDone: true, completedAt: new Date(), ...(outcome ? { outcome } : {}) },
    });
  }

  async update(id: string, labId: string, dto: UpdateActivityDto) {
    return this.prisma.crmActivity.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async remove(id: string, labId: string) {
    return this.prisma.crmActivity.delete({ where: { id } });
  }

  async stats(labId: string) {
    const all = await this.prisma.crmActivity.findMany({
      where: { labId },
      select: { type: true, isDone: true, dueDate: true },
    });
    const now = new Date();
    const byType: Record<string, number> = {};
    let overdue = 0, pending = 0, done = 0;
    for (const a of all) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      if (a.isDone) { done++; }
      else {
        pending++;
        if (a.dueDate && new Date(a.dueDate) < now) overdue++;
      }
    }
    return { total: all.length, done, pending, overdue, byType };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm-activities')
class CrmActivitiesController {
  constructor(private readonly svc: CrmActivitiesService) {}

  @Post() create(@Request() req: any, @Body() dto: CreateActivityDto) {
    return this.svc.create(req.user.labId, { ...dto, createdBy: req.user.fullName ?? req.user.email });
  }

  @Get() findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('leadId') leadId?: string,
    @Query('isDone') isDone?: string,
  ) {
    return this.svc.findAll(req.user.labId, { type, customerId, leadId, isDone });
  }

  @Get('stats') stats(@Request() req: any) {
    return this.svc.stats(req.user.labId);
  }

  @Patch(':id/complete') complete(@Request() req: any, @Param('id') id: string, @Body() body: { outcome?: string }) {
    return this.svc.complete(id, req.user.labId, body.outcome);
  }

  @Patch(':id') update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.svc.update(id, req.user.labId, dto);
  }

  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.remove(id, req.user.labId);
  }
}

@Module({ controllers: [CrmActivitiesController], providers: [CrmActivitiesService] })
export class CrmActivitiesModule {}
