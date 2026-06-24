import {
  Controller,
  Get,
  Header,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CertificateReportData,
  ReferenceStandardInfo,
  renderCertificateHtml,
} from '../../common/report/report-engine';
import {
  buildQrPayload,
  contentHash,
  verifyHash,
  generateQrDataUrl,
} from '../../common/qr/qr-engine';

@Injectable()
class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async certificateHtml(certificateId: string): Promise<string> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        signatures: { orderBy: { signedAt: 'asc' } },
        job: {
          include: {
            customer: true,
            instrument: true,
            lab: true,
            references: {
              include: { master: true },
            },
            datasheets: {
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                observations: { orderBy: { id: 'asc' } },
                uncertainty: { include: { parameters: true } },
              },
            },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');

    const datasheet = cert.job.datasheets[0];
    const env = (datasheet?.environmental as any) ?? null;

    const refStandards: ReferenceStandardInfo[] = cert.job.references.map((r) => ({
      name: r.master.name,
      idNumber: r.master.idNumber,
      make: r.master.make,
      model: r.master.model,
      serialNumber: r.master.serialNumber,
      certificateNumber: r.master.certificateNumber,
      traceability: r.master.traceability,
      uncertainty: r.master.uncertainty,
      calibrationDue: r.master.calibrationDue,
    }));

    const traceability = refStandards.length > 0
      ? refStandards.map((r) => r.traceability).filter(Boolean).join('; ')
      : undefined;

    const qr = buildQrPayload({
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issueDate: cert.issueDate,
      contentHash: cert.qrHash ?? contentHash({ id: cert.id, num: cert.certificateNumber }),
    });

    const qrDataUrl = await generateQrDataUrl(qr.verificationUrl);

    const data: CertificateReportData = {
      certificateNumber: cert.certificateNumber,
      type: cert.type,
      issueDate: cert.issueDate,
      labName: (cert.job as any).lab?.name,
      labAccreditation: (cert.job as any).lab?.accreditationNumber,
      customerName: cert.job.customer.name,
      customerAddress: (cert.job.customer as any).address,
      instrumentName: cert.job.instrument.name,
      instrumentMake: cert.job.instrument.make,
      instrumentModel: cert.job.instrument.model,
      instrumentSerial: cert.job.instrument.serialNumber,
      instrumentRange: (cert.job.instrument as any).range,
      instrumentLeastCount: (cert.job.instrument as any).leastCount,
      jobNumber: cert.job.jobNumber,
      environmental: env,
      observations: datasheet?.observations ?? [],
      expandedUncertainty: datasheet?.uncertainty?.expandedUncertainty ?? null,
      coverageFactor: datasheet?.uncertainty?.coverageFactor ?? null,
      decisionRule: cert.decisionRule,
      traceability,
      referenceStandards: refStandards,
      qrVerificationUrl: qr.verificationUrl,
      qrDataUrl,
      signatures: cert.signatures.map((s) => ({ stage: s.stage, by: s.signedByName })),
    };
    return renderCertificateHtml(data);
  }

  async verifyCertificate(certId: string, hash: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certId },
      include: { job: { include: { customer: true, instrument: true, lab: true } } },
    });
    if (!cert) return { valid: false, reason: 'Certificate not found' };

    const expected = buildQrPayload({
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issueDate: cert.issueDate,
      contentHash: cert.qrHash ?? contentHash({ id: cert.id, num: cert.certificateNumber }),
    });

    const valid = hash ? verifyHash(expected.hash.slice(0, 16), hash) : true;

    return {
      valid,
      reason: valid ? undefined : 'Hash mismatch — certificate may have been altered',
      certificate: {
        certificateNumber: cert.certificateNumber,
        type: cert.type,
        issueDate: cert.issueDate,
        isLocked: cert.isLocked,
        labName: (cert.job as any).lab?.name,
        labAccreditation: (cert.job as any).lab?.accreditationNumber,
        customerName: cert.job.customer.name,
        instrumentName: cert.job.instrument.name,
        instrumentMake: cert.job.instrument.make,
        instrumentModel: cert.job.instrument.model,
        instrumentSerial: cert.job.instrument.serialNumber,
        jobNumber: cert.job.jobNumber,
      },
    };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('reports')
class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('certificate/:id.html')
  @Header('Content-Type', 'text/html')
  certificateHtml(@Param('id') id: string) {
    return this.reports.certificateHtml(id);
  }
}

/** Public endpoint — no auth required — for QR scan verification. */
@Controller('portal')
class PortalController {
  constructor(private readonly reports: ReportsService) {}

  @Get('verify/:id')
  verifyCertificate(@Param('id') id: string, @Query('h') hash: string) {
    return this.reports.verifyCertificate(id, hash);
  }
}

@Module({
  controllers: [ReportsController, PortalController],
  providers: [ReportsService],
})
export class ReportsModule {}
