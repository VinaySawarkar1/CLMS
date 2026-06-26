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

  private async getLabSettings(labId: string): Promise<Record<string, any>> {
    const key = `lab_settings:${labId}`;
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return (row?.value as any) ?? {};
  }

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
    const labSettings = await this.getLabSettings(job.lab?.id ?? '');
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
      revision: cert.revision,
      isDraft: !cert.isLocked,
      issueDate: cert.issueDate,
      pageNumber: 1,
      totalPages: 1,

      // Lab
      labName: job.lab?.name,
      labAddress: job.lab?.address,
      labAccreditation: job.lab?.accreditationNumber,
      labPhone: labSettings.labPhone ?? job.lab?.phone,
      labEmail: labSettings.labEmail ?? job.lab?.contactEmail,
      labWebsite: labSettings.labWebsite ?? job.lab?.website,
      labLogoUrl: labSettings.logoUrl ?? job.lab?.logoUrl,
      labSignatoryName: labSettings.signatoryName,
      labSignatoryDesignation: labSettings.signatoryDesignation,

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

  /**
   * Render a printable calibration sticker (Module 7) for a certificate.
   * Includes the verification QR, instrument ID, calibration & due dates,
   * certificate number and the overall Pass/Fail result.
   */
  async stickerHtml(certificateId: string): Promise<string> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        job: {
          include: {
            instrument: true,
            lab: true,
            datasheets: {
              orderBy: { version: 'desc' },
              take: 1,
              include: { observations: true },
            },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');

    const job = cert.job as any;
    const inst = job.instrument;
    const labSettings = await this.getLabSettings(job.lab?.id ?? '');

    // Overall Pass/Fail from the latest datasheet's computed results.
    const obs = job.datasheets[0]?.observations ?? [];
    const evaluated = obs.filter((o: any) => (o.data as any)?.result).length;
    const failed = obs.filter((o: any) => (o.data as any)?.result === 'FAIL').length;
    const result = evaluated === 0 ? null : failed === 0 ? 'PASS' : 'FAIL';

    // Due date: explicit instrument due, else cal date + interval.
    let dueDate: Date | null = inst?.nextDueDate ?? null;
    if (!dueDate && inst?.calibrationIntervalMonths) {
      const d = new Date(cert.issueDate);
      d.setMonth(d.getMonth() + inst.calibrationIntervalMonths);
      dueDate = d;
    }

    const qr = buildQrPayload({
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issueDate: cert.issueDate,
      contentHash: cert.qrHash ?? contentHash({ id: cert.id, num: cert.certificateNumber }),
    });
    const qrDataUrl = await generateQrDataUrl(qr.verificationUrl);

    const fmt = (d?: Date | null) =>
      d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const esc = (s?: string | null) =>
      (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

    const labName = labSettings.labName ?? job.lab?.name ?? 'Calibration Laboratory';
    const instId = inst?.labIdNo || inst?.idNumber || inst?.serialNumber || '—';
    const resultColor = result === 'PASS' ? '#237804' : result === 'FAIL' ? '#a8071a' : '#8c8c8c';

    return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Calibration Sticker — ${esc(cert.certificateNumber)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #f0f0f0; padding: 16px; }
  .sticker { width: 90mm; border: 2px solid #1a237e; border-radius: 6px; background: #fff;
    padding: 8px 10px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1.5px solid #1a237e; padding-bottom: 4px; margin-bottom: 6px; }
  .lab { font-size: 11px; font-weight: bold; color: #1a237e; line-height: 1.2; max-width: 58mm; }
  .title { font-size: 12px; font-weight: bold; letter-spacing: 1px; color: #1a237e;
    text-align: center; text-transform: uppercase; margin-bottom: 6px; }
  .body { display: flex; gap: 8px; }
  .fields { flex: 1; font-size: 10.5px; }
  .row { display: flex; margin-bottom: 3px; }
  .lbl { color: #555; width: 26mm; flex-shrink: 0; }
  .val { font-weight: bold; color: #111; }
  .qr { width: 24mm; height: 24mm; flex-shrink: 0; }
  .qr img { width: 100%; height: 100%; }
  .result { text-align: center; margin-top: 6px; padding: 3px; border-radius: 4px;
    font-size: 14px; font-weight: 900; letter-spacing: 2px; color: #fff; background: ${resultColor}; }
  .foot { font-size: 8px; color: #888; text-align: center; margin-top: 5px; }
  @media print { body { background: #fff; padding: 0; } .sticker { margin: 4mm; } }
</style></head>
<body>
  <div class="sticker">
    <div class="head">
      <div class="lab">${esc(labName)}${job.lab?.accreditationNumber ? `<br/><span style="font-size:9px;color:#444">${esc(job.lab.accreditationNumber)}</span>` : ''}</div>
    </div>
    <div class="title">Calibration Label</div>
    <div class="body">
      <div class="fields">
        <div class="row"><span class="lbl">Instrument ID</span><span class="val">${esc(instId)}</span></div>
        <div class="row"><span class="lbl">Instrument</span><span class="val">${esc(inst?.name)}</span></div>
        <div class="row"><span class="lbl">Certificate No.</span><span class="val">${esc(cert.certificateNumber)}</span></div>
        <div class="row"><span class="lbl">Cal. Date</span><span class="val">${fmt(cert.issueDate)}</span></div>
        <div class="row"><span class="lbl">Due Date</span><span class="val">${fmt(dueDate)}</span></div>
      </div>
      <div class="qr"><img src="${qrDataUrl}" alt="Verify QR"/></div>
    </div>
    ${result ? `<div class="result">${result}</div>` : ''}
    <div class="foot">Scan QR to verify · ${esc(qr.verificationUrl)}</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body></html>`;
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

  @Get('sticker/:id.html')
  @Header('Content-Type', 'text/html')
  stickerHtml(@Param('id') id: string) {
    return this.reports.stickerHtml(id);
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
