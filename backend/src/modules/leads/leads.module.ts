import { Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

enum LeadStage { NEW='NEW', CONTACTED='CONTACTED', QUALIFIED='QUALIFIED', PROPOSAL='PROPOSAL', NEGOTIATION='NEGOTIATION', WON='WON', LOST='LOST' }
enum LeadSource { WEBSITE='WEBSITE', REFERRAL='REFERRAL', COLD_CALL='COLD_CALL', EXHIBITION='EXHIBITION', SOCIAL_MEDIA='SOCIAL_MEDIA', EMAIL_CAMPAIGN='EMAIL_CAMPAIGN', WALK_IN='WALK_IN', OTHER='OTHER' }

class CreateLeadDto {
  @IsString() title: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsEnum(LeadStage) stage?: LeadStage;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @Type(() => Number) @IsNumber() value?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsDateString() expectedCloseDate?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() description?: string;
}

class UpdateLeadDto extends CreateLeadDto {
  @IsOptional() @IsString() lostReason?: string;
  @IsOptional() @IsString() convertedCustomerId?: string;
}

@Injectable()
class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(labId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: { labId, ...dto, expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined },
    });
  }

  async findAll(labId: string, stage?: string, search?: string) {
    return this.prisma.lead.findMany({
      where: {
        labId,
        ...(stage && stage !== 'ALL' ? { stage: stage as any } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    return this.prisma.lead.findFirst({
      where: { id, labId },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async update(id: string, labId: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      },
    });
  }

  async setStage(id: string, labId: string, stage: string, lostReason?: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { stage: stage as any, ...(lostReason ? { lostReason } : {}) },
    });
  }

  async convert(id: string, labId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, labId } });
    if (!lead) throw new Error('Lead not found');

    // Auto-generate customer code
    const count = await this.prisma.customer.count({ where: { labId } });
    const code = `CUST-${String(count + 1).padStart(4, '0')}`;

    const customer = await this.prisma.customer.create({
      data: {
        labId, code, name: lead.companyName ?? lead.contactName ?? lead.title,
        email: lead.contactEmail, phone: lead.contactPhone,
        customerStatus: 'ACTIVE', customerType: 'BUSINESS',
      },
    });

    // Add the contact
    if (lead.contactName) {
      await this.prisma.contact.create({
        data: { customerId: customer.id, name: lead.contactName, email: lead.contactEmail, phone: lead.contactPhone, isPrimary: true },
      });
    }

    await this.prisma.lead.update({
      where: { id },
      data: { stage: 'WON', convertedCustomerId: customer.id, convertedAt: new Date() },
    });

    return { customer, lead: { id } };
  }

  async remove(id: string, labId: string) {
    return this.prisma.lead.delete({ where: { id } });
  }

  async stats(labId: string) {
    const leads = await this.prisma.lead.findMany({ where: { labId }, select: { stage: true, value: true } });
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const l of leads) {
      if (!byStage[l.stage]) byStage[l.stage] = { count: 0, value: 0 };
      byStage[l.stage].count++;
      byStage[l.stage].value += l.value ?? 0;
    }
    const total = leads.length;
    const won = leads.filter((l) => l.stage === 'WON').length;
    const lost = leads.filter((l) => l.stage === 'LOST').length;
    const closed = won + lost;
    const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
    const pipelineValue = leads
      .filter((l) => !['WON', 'LOST'].includes(l.stage))
      .reduce((s, l) => s + (l.value ?? 0), 0);
    return { total, won, lost, winRate, pipelineValue, byStage };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post() create(@Request() req: any, @Body() dto: CreateLeadDto) {
    return this.leads.create(req.user.labId, dto);
  }

  @Get() findAll(@Request() req: any, @Query('stage') stage?: string, @Query('search') search?: string) {
    return this.leads.findAll(req.user.labId, stage, search);
  }

  @Get('stats') stats(@Request() req: any) {
    return this.leads.stats(req.user.labId);
  }

  @Get(':id') findOne(@Request() req: any, @Param('id') id: string) {
    return this.leads.findOne(id, req.user.labId);
  }

  @Patch(':id') update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leads.update(id, req.user.labId, dto);
  }

  @Patch(':id/stage') setStage(@Request() req: any, @Param('id') id: string, @Body() body: { stage: string; lostReason?: string }) {
    return this.leads.setStage(id, req.user.labId, body.stage, body.lostReason);
  }

  @Post(':id/convert') convert(@Request() req: any, @Param('id') id: string) {
    return this.leads.convert(id, req.user.labId);
  }

  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) {
    return this.leads.remove(id, req.user.labId);
  }
}

@Module({ controllers: [LeadsController], providers: [LeadsService] })
export class LeadsModule {}
