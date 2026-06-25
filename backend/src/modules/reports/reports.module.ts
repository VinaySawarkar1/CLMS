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
export class ReportsService {
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
            references: { include: { master: true } },
            datasheets: {
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                observations: { orderBy: { id: 'asc' } },
                uncertainty: true,
              },
            },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');

    const job = cert.job as any;
    const datasheet = job.datasheets[0];
    const env = (datasheet?.environmental as any) ?? null;

    const refStandards: ReferenceStandardInfo[] = job.references.map((r: any) => ({
      name: r.master.name,
      idNumber: r.master.idNumber,
      srNo: r.master.serialNumber,
      make: r.master.make,
      model: r.master.model,
      serialNumber: r.master.serialNumber,
      certificateNumber: r.master.certificateNumber,
      calibrationDate: r.master.calibratedDate,
      validUpTo: r.master.calibrationDue,
      traceability: r.master.traceability,
      uncertainty: r.master.uncertainty,
    }));

    const traceability = refStandards.map((r) => r.traceability).filter(Boolean).join('; ');

    // Build ULR-style number from lab accreditation
    const labAcc: string = job.lab?.accreditationNumber ?? '';
    const ulr = labAcc
      ? `${labAcc.replace(/[^A-Z0-9]/gi, '')}${new Date(cert.issueDate).getFullYear()}${cert.certificateNumber.replace(/\D/g, '').slice(-6).padStart(6, '0')}F`
      : undefined;

    const qr = buildQrPayload({
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issueDate: cert.issueDate,
      contentHash: cert.qrHash ?? contentHash({ id: cert.id, num: cert.certificateNumber }),
    });

    const qrDataUrl = await generateQrDataUrl(qr.verificationUrl);

    // Determine NABL discipline from instrument discipline (if linked)
    const discipline = (job.instrument as any).discipline;
    const nablDiscipline = discipline
      ? `NABL · Mechanical Discipline: ${discipline.name}`
      : undefined;

    const data: CertificateReportData = {
      // Header
      certificateNumber: cert.certificateNumber,
      ulrNumber: ulr,
      type: cert.type,
      issueDate: cert.issueDate,
      pageNumber: 1,
      totalPages: 1,

      // Lab
      labName: job.lab?.name,
      labAddress: job.lab?.address,
      labAccreditation: job.lab?.accreditationNumber,

      // Customer
      customerName: job.customer.name,
      customerAddress: job.customer.address,

      // Job admin
      jobNumber: job.jobNumber,
      dateOfReceipt: job.receivedAt,
      calibrationDate: cert.issueDate,
      nextCalibrationDate: job.instrument.nextDueDate,
      challanNo: job.challanNo,
      poNumber: job.poNumber,
      conditionOfItem: job.conditionOfItem,

      // Instrument
      instrumentName: job.instrument.name,
      instrumentMake: job.instrument.make,
      instrumentModel: job.instrument.model,
      instrumentSerial: job.instrument.serialNumber,
      instrumentRange: job.instrument.range,
      instrumentLeastCount: job.instrument.leastCount,
      instrumentIdNumber: job.instrument.idNumber,
      labIdNo: job.instrument.labIdNo,
      calibrationLocation: job.isOnsite ? `Onsite — ${job.siteAddress ?? ''}` : 'In Lab',

      // Procedure
      calibrationProcedureNo: job.calibrationProcedureNo,
      referenceDocumentNo: job.referenceDocumentNo,
      calibrationProcedure: job.calibrationProcedure,

      // NABL discipline
      nablDiscipline,

      // Environment
      environmental: env ? {
        temperature: env.temperature,
        temperatureTolerance: env.temperatureTolerance ?? 1,
        humidity: env.humidity,
        humidityTolerance: env.humidityTolerance ?? 10,
        pressure: env.pressure,
      } : null,

      // Results
      observations: datasheet?.observations ?? [],
      expandedUncertainty: datasheet?.uncertainty?.expandedUncertainty ?? null,
      uncertaintyUnit: job.instrument.unit,
      coverageFactor: datasheet?.uncertainty?.coverageFactor ?? null,
      decisionRule: cert.decisionRule,

      // Reference standards
      referenceStandards: refStandards,

      // QR
      qrVerificationUrl: qr.verificationUrl,
      qrDataUrl,

      // Signatures
      signatures: cert.signatures.map((s: any) => ({
        stage: s.stage,
        by: s.signedByName,
        designation: s.stage === 'ENGINEER' ? 'Calibrated By'
          : s.stage === 'TECHNICAL_MANAGER' ? 'Technical Manager'
          : s.stage === 'QUALITY_MANAGER' ? 'Quality Manager'
          : s.stage === 'FINAL_LOCK' ? 'Authorized Signatory'
          : s.stage,
      })),
    };

    return renderCertificateHtml(data);
  }

  async verifyCertificate(certId: string, hash: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certId },
      include: { job: { include: { customer: true, instrument: true, lab: true } } },
    });
    if (!cert) return { valid: false, reason: 'Certificate not found' };

    const job = cert.job as any;
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
        labName: job.lab?.name,
        labAccreditation: job.lab?.accreditationNumber,
        customerName: job.customer.name,
        instrumentName: job.instrument.name,
        instrumentMake: job.instrument.make,
        instrumentModel: job.instrument.model,
        instrumentSerial: job.instrument.serialNumber,
        jobNumber: job.jobNumber,
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
  exports: [ReportsService],
})
export class ReportsModule {}
