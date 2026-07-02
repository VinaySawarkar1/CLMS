import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module,
  NotFoundException, Param, Post, Query, Request, Res, UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const CATEGORIES = ['BEFORE', 'AFTER', 'DAMAGE', 'ACCESSORY'] as const;
type ImageCategory = (typeof CATEGORIES)[number];

// ── DTO ──────────────────────────────────────────────────────────────────────

class CreateImageDto {
  @IsOptional() @IsString() jobId?: string;
  @IsOptional() @IsString() instrumentId?: string;
  @IsNotEmpty() @IsString() category!: string;
  @IsNotEmpty() @IsString() fileName!: string;
  @IsNotEmpty() @IsString() fileBase64!: string;
  @IsOptional() @IsString() fileType?: string;
  @IsOptional() @IsString() remarks?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
class InstrumentImagesService {
  constructor(private readonly prisma: PrismaService) {}

  list(labId: string, jobId?: string, instrumentId?: string) {
    return this.prisma.instrumentImage.findMany({
      where: { labId, ...(jobId ? { jobId } : {}), ...(instrumentId ? { instrumentId } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, labId: true, jobId: true, instrumentId: true, category: true,
        fileName: true, fileType: true, remarks: true, uploadedById: true, createdAt: true,
      },
    });
  }

  findOne(id: string, labId: string) {
    return this.prisma.instrumentImage.findFirst({ where: { id, labId } });
  }

  create(labId: string, uploadedById: string | undefined, dto: CreateImageDto) {
    const category = dto.category as ImageCategory;
    if (!CATEGORIES.includes(category)) {
      throw new BadRequestException(`category must be one of ${CATEGORIES.join(', ')}`);
    }
    const mime = dto.fileType ?? 'application/octet-stream';
    const fileData = dto.fileBase64.startsWith('data:')
      ? dto.fileBase64
      : `data:${mime};base64,${dto.fileBase64}`;
    return this.prisma.instrumentImage.create({
      data: {
        labId,
        jobId: dto.jobId,
        instrumentId: dto.instrumentId,
        category,
        fileName: dto.fileName,
        fileType: dto.fileType,
        fileData,
        remarks: dto.remarks,
        uploadedById,
      },
      select: {
        id: true, labId: true, jobId: true, instrumentId: true, category: true,
        fileName: true, fileType: true, remarks: true, uploadedById: true, createdAt: true,
      },
    });
  }

  async remove(id: string, labId: string) {
    const img = await this.prisma.instrumentImage.findFirst({ where: { id, labId } });
    if (!img) throw new NotFoundException('Image not found');
    await this.prisma.instrumentImage.delete({ where: { id } });
    return { ok: true };
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('instrument-images')
class InstrumentImagesController {
  constructor(private readonly svc: InstrumentImagesService) {}

  @Get()
  list(
    @Request() req: any,
    @Query('jobId') jobId?: string,
    @Query('instrumentId') instrumentId?: string,
  ) {
    return this.svc.list(req.user.labId, jobId, instrumentId);
  }

  @Get(':id/file')
  async serveFile(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const img = await this.svc.findOne(id, req.user.labId);
    if (!img?.fileData?.startsWith('data:')) {
      return res.status(404).send('No file attached');
    }
    const [header, b64] = img.fileData.split(',');
    const mime = header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
    const buf = Buffer.from(b64, 'base64');
    res.set('Content-Type', mime);
    res.set('Content-Disposition', `inline; filename="${img.fileName}"`);
    res.send(buf);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateImageDto) {
    return this.svc.create(req.user.labId, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.svc.remove(id, req.user.labId);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  controllers: [InstrumentImagesController],
  providers: [InstrumentImagesService],
})
export class InstrumentImagesModule {}
