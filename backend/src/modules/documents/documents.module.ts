import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Post, Request, Res, UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

// ── DTOs ────────────────────────────────────────────────────────────────────

class CreateDocumentDto {
  @IsNotEmpty() @IsString() docNumber!: string;
  @IsNotEmpty() @IsString() title!: string;
  @IsNotEmpty() @IsString() category!: string;
  @IsOptional() @IsString() revision?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsString() fileBase64?: string;
  @IsOptional() @IsString() fileMimeType?: string;
  @IsOptional() @IsString() approvedBy?: string;
  @IsOptional() @IsString() approvedAt?: string;
  @IsOptional() @IsString() reviewDueAt?: string;
}

class UpdateDocumentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() revision?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsString() fileBase64?: string;
  @IsOptional() @IsString() fileMimeType?: string;
  @IsOptional() @IsString() approvedBy?: string;
  @IsOptional() @IsString() approvedAt?: string;
  @IsOptional() @IsString() reviewDueAt?: string;
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

  findOne(id: string, labId: string) {
    return this.prisma.labDocument.findFirst({ where: { id, labId } });
  }

  private buildContent(dto: CreateDocumentDto | UpdateDocumentDto): string | undefined {
    if (dto.fileBase64 && dto.fileName) {
      const mime = dto.fileMimeType ?? 'application/octet-stream';
      return `data:${mime};filename=${dto.fileName};base64,${dto.fileBase64}`;
    }
    return dto.content;
  }

  create(labId: string, dto: CreateDocumentDto) {
    const content = this.buildContent(dto);
    return this.prisma.labDocument.create({
      data: {
        labId,
        docNumber: dto.docNumber,
        title: dto.title,
        category: dto.category,
        revision: dto.revision ?? '00',
        content,
        approvedBy: dto.approvedBy,
        approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
        reviewDueAt: dto.reviewDueAt ? new Date(dto.reviewDueAt) : undefined,
      },
    });
  }

  async update(id: string, labId: string, dto: UpdateDocumentDto) {
    const doc = await this.prisma.labDocument.findFirst({ where: { id, labId } });
    if (!doc) throw new NotFoundException('Document not found');
    const content = this.buildContent(dto) ?? dto.content;
    return this.prisma.labDocument.update({
      where: { id },
      data: {
        title: dto.title,
        category: dto.category,
        revision: dto.revision,
        status: dto.status as any,
        content,
        approvedBy: dto.approvedBy,
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

  @Get(':id/file')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER,
         Role.SERVICE_ENGINEER, Role.DATA_ENTRY_OPERATOR)
  async serveFile(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const doc = await this.svc.findOne(id, req.user.labId);
    if (!doc?.content?.startsWith('data:')) {
      return res.status(404).send('No file attached');
    }
    const [header, b64] = doc.content.split(',');
    const mime = header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
    const nameMatch = header.match(/filename=([^;]+)/);
    const filename = nameMatch ? nameMatch[1] : 'document';
    const buf = Buffer.from(b64, 'base64');
    res.set('Content-Type', mime);
    res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buf);
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
