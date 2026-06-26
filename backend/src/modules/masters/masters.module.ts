import {
  Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Request, Res, UseGuards,
} from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type MasterInput = {
  name: string;
  idNumber: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  traceability?: string;
  certificateNumber?: string;
  uncertainty?: string;
  calibratedDate?: string;
  calibrationDue?: string;
  location?: string;
};

@Injectable()
class MastersService {
  constructor(private readonly prisma: PrismaService) {}

  list(labId: string) {
    return this.prisma.masterInstrument.findMany({
      where: { labId },
      orderBy: { calibrationDue: 'asc' },
    });
  }

  create(labId: string, data: MasterInput) {
    return this.prisma.masterInstrument.create({
      data: {
        labId,
        name: data.name,
        idNumber: data.idNumber,
        make: data.make,
        model: data.model,
        serialNumber: data.serialNumber,
        traceability: data.traceability,
        certificateNumber: data.certificateNumber,
        uncertainty: data.uncertainty,
        location: data.location,
        calibratedDate: data.calibratedDate ? new Date(data.calibratedDate) : null,
        calibrationDue: data.calibrationDue ? new Date(data.calibrationDue) : null,
      },
    });
  }

  async update(id: string, labId: string, data: Partial<MasterInput>) {
    const existing = await this.prisma.masterInstrument.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Reference standard not found');
    return this.prisma.masterInstrument.update({
      where: { id },
      data: {
        ...data,
        calibratedDate: data.calibratedDate ? new Date(data.calibratedDate) : undefined,
        calibrationDue: data.calibrationDue ? new Date(data.calibrationDue) : undefined,
      },
    });
  }

  async remove(id: string, labId: string) {
    const existing = await this.prisma.masterInstrument.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Reference standard not found');
    await this.prisma.masterInstrument.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertMaster(masterId: string, labId: string) {
    const master = await this.prisma.masterInstrument.findFirst({ where: { id: masterId, labId } });
    if (!master) throw new NotFoundException('Reference standard not found');
    return master;
  }

  // ── 3.1 Certificate upload + version history ──

  /**
   * Upload a new calibration certificate version (PDF/image) for a reference
   * standard. The newest version becomes the active certificate and its
   * metadata is mirrored onto the master so existing flows keep working.
   */
  async uploadCertificate(
    masterId: string,
    labId: string,
    dto: {
      fileName: string;
      fileBase64: string;
      fileType?: string;
      certificateNumber?: string;
      calibratedDate?: string;
      calibrationDue?: string;
      traceability?: string;
      uncertainty?: string;
      remarks?: string;
    },
    uploadedById?: string,
  ) {
    await this.assertMaster(masterId, labId);
    if (!dto.fileBase64) throw new BadRequestException('File content is required');

    const latest = await this.prisma.referenceStandardCertificate.findFirst({
      where: { masterId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const mime = dto.fileType ?? 'application/octet-stream';
    const fileData = dto.fileBase64.startsWith('data:')
      ? dto.fileBase64
      : `data:${mime};base64,${dto.fileBase64}`;

    const cert = await this.prisma.referenceStandardCertificate.create({
      data: {
        masterId,
        version: (latest?.version ?? 0) + 1,
        fileName: dto.fileName,
        fileType: mime,
        fileData,
        certificateNumber: dto.certificateNumber,
        calibratedDate: dto.calibratedDate ? new Date(dto.calibratedDate) : null,
        calibrationDue: dto.calibrationDue ? new Date(dto.calibrationDue) : null,
        traceability: dto.traceability,
        uncertainty: dto.uncertainty,
        remarks: dto.remarks,
        uploadedById,
      },
    });

    // Mirror latest metadata onto the master record.
    await this.prisma.masterInstrument.update({
      where: { id: masterId },
      data: {
        certificateNumber: dto.certificateNumber ?? undefined,
        calibratedDate: dto.calibratedDate ? new Date(dto.calibratedDate) : undefined,
        calibrationDue: dto.calibrationDue ? new Date(dto.calibrationDue) : undefined,
        traceability: dto.traceability ?? undefined,
        uncertainty: dto.uncertainty ?? undefined,
      },
    });

    // Return metadata only (omit the heavy base64 payload).
    const { fileData: _omit, ...meta } = cert;
    return meta;
  }

  async listCertificates(masterId: string, labId: string) {
    await this.assertMaster(masterId, labId);
    return this.prisma.referenceStandardCertificate.findMany({
      where: { masterId },
      orderBy: { version: 'desc' },
      select: {
        id: true, version: true, fileName: true, fileType: true,
        certificateNumber: true, calibratedDate: true, calibrationDue: true,
        traceability: true, uncertainty: true, remarks: true, uploadedAt: true,
      },
    });
  }

  async getCertificateFile(masterId: string, certId: string, labId: string) {
    await this.assertMaster(masterId, labId);
    const cert = await this.prisma.referenceStandardCertificate.findFirst({
      where: { id: certId, masterId },
    });
    if (!cert) throw new NotFoundException('Certificate version not found');
    const header = cert.fileData.slice(0, cert.fileData.indexOf(','));
    const mime = header.match(/data:([^;]+)/)?.[1] ?? cert.fileType ?? 'application/octet-stream';
    const b64 = cert.fileData.slice(cert.fileData.indexOf(',') + 1);
    return { fileName: cert.fileName, mime, buffer: Buffer.from(b64, 'base64') };
  }

  // ── 3.2 Maintenance history + utilization ──

  async addMaintenance(
    masterId: string,
    labId: string,
    dto: { date: string; type: string; description?: string; performedBy?: string },
  ) {
    await this.assertMaster(masterId, labId);
    if (!dto.type) throw new BadRequestException('Maintenance type is required');
    return this.prisma.referenceStandardMaintenance.create({
      data: {
        masterId,
        date: dto.date ? new Date(dto.date) : new Date(),
        type: dto.type,
        description: dto.description,
        performedBy: dto.performedBy,
      },
    });
  }

  async listMaintenance(masterId: string, labId: string) {
    await this.assertMaster(masterId, labId);
    return this.prisma.referenceStandardMaintenance.findMany({
      where: { masterId },
      orderBy: { date: 'desc' },
    });
  }

  /** Utilization stats: usage count, last used, next due, history sizes. */
  async utilization(masterId: string, labId: string) {
    const master = await this.assertMaster(masterId, labId);

    // Jobs using this standard, via the direct link or the many-to-many table.
    const directJobs = await this.prisma.job.findMany({
      where: { masterInstrumentId: masterId },
      select: { id: true, jobNumber: true, receivedAt: true, status: true },
    });
    const refLinks = await this.prisma.referenceStandardOnJob.findMany({
      where: { masterId },
      select: { job: { select: { id: true, jobNumber: true, receivedAt: true, status: true } } },
    });
    const jobsById = new Map<string, { id: string; jobNumber: string; receivedAt: Date; status: string }>();
    for (const j of directJobs) jobsById.set(j.id, j);
    for (const r of refLinks) if (r.job) jobsById.set(r.job.id, r.job);
    const jobs = [...jobsById.values()].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

    const [certCount, maintenanceCount] = await Promise.all([
      this.prisma.referenceStandardCertificate.count({ where: { masterId } }),
      this.prisma.referenceStandardMaintenance.count({ where: { masterId } }),
    ]);

    const now = new Date();
    const due = master.calibrationDue ?? null;
    const dueStatus = !due ? 'NONE' : due < now ? 'OVERDUE' : (due.getTime() - now.getTime()) / 86400000 <= 30 ? 'DUE_SOON' : 'VALID';

    return {
      usageCount: jobs.length,
      lastUsed: jobs[0]?.receivedAt ?? null,
      lastUsedJob: jobs[0]?.jobNumber ?? null,
      nextDue: due,
      dueStatus,
      certificateVersions: certCount,
      maintenanceRecords: maintenanceCount,
      recentJobs: jobs.slice(0, 10),
    };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('masters')
class MastersController {
  constructor(private readonly masters: MastersService) {}

  @Get()
  list(@Request() req: any) {
    return this.masters.list(req.user.labId);
  }

  @Post()
  create(@Request() req: any, @Body() body: MasterInput) {
    return this.masters.create(req.user.labId, body);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: Partial<MasterInput>) {
    return this.masters.update(id, req.user.labId, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.masters.remove(id, req.user.labId);
  }

  @Post('import')
  async bulkImport(@Request() req: any, @Body() body: { records: MasterInput[] }) {
    const results: any[] = [];
    for (const r of body.records) {
      try {
        results.push(await this.masters.create(req.user.labId, r));
      } catch (e: any) {
        results.push({ error: e?.message, input: r });
      }
    }
    return { imported: results.filter((r: any) => !r.error).length, errors: results.filter((r: any) => r.error) };
  }

  // ── Reference-standard certificate versions & utilization (Module 3) ──

  @Get(':id/utilization')
  utilization(@Request() req: any, @Param('id') id: string) {
    return this.masters.utilization(id, req.user.labId);
  }

  @Get(':id/certificates')
  listCertificates(@Request() req: any, @Param('id') id: string) {
    return this.masters.listCertificates(id, req.user.labId);
  }

  @Post(':id/certificates')
  uploadCertificate(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.masters.uploadCertificate(id, req.user.labId, body, req.user.id);
  }

  @Get(':id/certificates/:certId/file')
  async certificateFile(
    @Request() req: any,
    @Param('id') id: string,
    @Param('certId') certId: string,
    @Res() res: Response,
  ) {
    const { fileName, mime, buffer } = await this.masters.getCertificateFile(id, certId, req.user.labId);
    res.set('Content-Type', mime);
    res.set('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(buffer);
  }

  @Get(':id/maintenance')
  listMaintenance(@Request() req: any, @Param('id') id: string) {
    return this.masters.listMaintenance(id, req.user.labId);
  }

  @Post(':id/maintenance')
  addMaintenance(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.masters.addMaintenance(id, req.user.labId, body);
  }
}

@Module({
  controllers: [MastersController],
  providers: [MastersService],
})
export class MastersModule {}
