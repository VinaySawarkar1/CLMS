import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

// ── DTOs ────────────────────────────────────────────────────────────────────

class CreateDocumentDto {
  docNumber!: string;
  title!: string;
  category!: string;
  revision?: string;
  content?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewDueAt?: string;
}

class UpdateDocumentDto {
  title?: string;
  category?: string;
  revision?: string;
  status?: string;
  content?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewDueAt?: string;
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(labId: string) {
    return this.prisma.labDocument.findMany({
      where: { labId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(labId: string, dto: CreateDocumentDto) {
    return this.prisma.labDocument.create({
      data: {
        labId,
        docNumber: dto.docNumber,
        title: dto.title,
        category: dto.category,
        revision: dto.revision ?? '00',
        content: dto.content,
        approvedBy: dto.approvedBy,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
        reviewDueAt: dto.reviewDueAt ? new Date(dto.reviewDueAt) : undefined,
      },
    });
  }

  async update(id: string, labId: string, dto: UpdateDocumentDto) {
    const doc = await this.prisma.labDocument.findFirst({ where: { id, labId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.labDocument.update({
      where: { id },
      data: {
        ...dto,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
        reviewDueAt: dto.reviewDueAt ? new Date(dto.reviewDueAt) : undefined,
      },
    });
  }

  async remove(id: string, labId: string) {
    const doc = await this.prisma.labDocument.findFirst({ where: { id, labId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.labDocument.update({ where: { id }, data: { status: 'OBSOLETE' } });
  }
}

// ── Controller ───────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER,
         Role.SERVICE_ENGINEER, Role.DATA_ENTRY_OPERATOR)
  list(@Request() req: any) {
    return this.svc.list(req.user.labId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  create(@Request() req: any, @Body() dto: CreateDocumentDto) {
    return this.svc.create(req.user.labId, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateDocumentDto) {
    return this.svc.update(id, req.user.labId, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.svc.remove(id, req.user.labId);
  }
}

// ── Module ───────────────────────────────────────────────────────────────────

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
