import {
  Body, Controller, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

// ── DTOs ────────────────────────────────────────────────────────────────────

class CreateAuditDto {
  @IsNotEmpty() @IsString() auditNumber!: string;
  @IsNotEmpty() @IsString() plannedDate!: string;
  @IsNotEmpty() @IsString() auditor!: string;
  @IsNotEmpty() @IsString() scope!: string;
}

class UpdateAuditDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() conductedDate?: string;
  @IsOptional() @IsString() auditor?: string;
  @IsOptional() @IsString() scope?: string;
}

class CreateFindingDto {
  @IsNotEmpty() @IsString() clause!: string;
  @IsNotEmpty() @IsString() category!: string;
  @IsNotEmpty() @IsString() description!: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsString() correction?: string;
  @IsOptional() @IsString() dueDate?: string;
}

class UpdateFindingDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsString() correction?: string;
  @IsOptional() @IsString() closedAt?: string;
  @IsOptional() @IsString() dueDate?: string;
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
class AuditPlansService {
  constructor(private readonly prisma: PrismaService) {}

  list(labId: string) {
    return this.prisma.internalAudit.findMany({
      where: { labId },
      include: { findings: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(labId: string, dto: CreateAuditDto) {
    return this.prisma.internalAudit.create({
      data: {
        labId,
        auditNumber: dto.auditNumber,
        plannedDate: new Date(dto.plannedDate),
        auditor: dto.auditor,
        scope: dto.scope,
      },
      include: { findings: true },
    });
  }

  async update(id: string, labId: string, dto: UpdateAuditDto) {
    const audit = await this.prisma.internalAudit.findFirst({ where: { id, labId } });
    if (!audit) throw new NotFoundException('Audit not found');
    return this.prisma.internalAudit.update({
      where: { id },
      data: {
        ...dto,
        conductedDate: dto.conductedDate ? new Date(dto.conductedDate) : undefined,
      },
      include: { findings: true },
    });
  }

  async addFinding(auditId: string, labId: string, dto: CreateFindingDto) {
    const audit = await this.prisma.internalAudit.findFirst({ where: { id: auditId, labId } });
    if (!audit) throw new NotFoundException('Audit not found');
    return this.prisma.auditFinding.create({
      data: {
        auditId,
        clause: dto.clause,
        category: dto.category,
        description: dto.description,
        rootCause: dto.rootCause,
        correction: dto.correction,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateFinding(auditId: string, findingId: string, labId: string, dto: UpdateFindingDto) {
    const audit = await this.prisma.internalAudit.findFirst({ where: { id: auditId, labId } });
    if (!audit) throw new NotFoundException('Audit not found');
    return this.prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        ...dto,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }
}

// ── Controller ───────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-plans')
class AuditPlansController {
  constructor(private readonly svc: AuditPlansService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER,
         Role.SERVICE_ENGINEER, Role.DATA_ENTRY_OPERATOR)
  list(@Request() req: any) {
    return this.svc.list(req.user.labId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  create(@Request() req: any, @Body() dto: CreateAuditDto) {
    return this.svc.create(req.user.labId, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateAuditDto) {
    return this.svc.update(id, req.user.labId, dto);
  }

  @Post(':id/findings')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER)
  addFinding(@Param('id') id: string, @Request() req: any, @Body() dto: CreateFindingDto) {
    return this.svc.addFinding(id, req.user.labId, dto);
  }

  @Patch(':id/findings/:fid')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER)
  updateFinding(
    @Param('id') id: string,
    @Param('fid') fid: string,
    @Request() req: any,
    @Body() dto: UpdateFindingDto,
  ) {
    return this.svc.updateFinding(id, fid, req.user.labId, dto);
  }
}

// ── Module ───────────────────────────────────────────────────────────────────

@Module({
  controllers: [AuditPlansController],
  providers: [AuditPlansService],
})
export class AuditPlansModule {}
