import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { CertificateType, SignatureStage } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { buildQrPayload, contentHash } from '../../common/qr/qr-engine';
import { MailService } from '../../common/mail/mail.service';
import { ReportsService } from '../reports/reports.module';

/** The signature workflow order. Each stage must sign before the next. */
const SIGNATURE_ORDER: SignatureStage[] = [
  'TECHNICAL_MANAGER',
  'QUALITY_MANAGER',
];

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly reports: ReportsService,
  ) {}

  /** Generate a certificate for an approved job. */
  async generate(jobId: string, labId: string, type: CertificateType, decisionRule?: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, labId },
      include: {
        customer: true,
        instrument: true,
        certificate: true,
        datasheets: { include: { uncertainty: true, observations: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.certificate) {
      throw new ConflictException('Certificate already exists for this job');
    }
    // Allow generation for APPROVED jobs, or for CERTIFICATE_GENERATED jobs where
    // the certificate record was never actually created (status was set directly).
    const canGenerate =
      job.status === 'APPROVED' ||
      (job.status === 'CERTIFICATE_GENERATED' && !job.certificate);
    if (!canGenerate) {
      throw new BadRequestException('Job must be in APPROVED status for certificate generation');
    }

    const certificateNumber = await this.nextCertificateNumber(labId);
    const hash = contentHash({
      job: job.jobNumber,
      customer: job.customer.name,
      instrument: job.instrument.name,
      datasheets: job.datasheets,
    });

    const certificate = await this.prisma.certificate.create({
      data: {
        jobId,
        certificateNumber,
        type,
        decisionRule,
        qrHash: hash,
      },
    });

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'CERTIFICATE_GENERATED' },
    });

    return this.findOne(certificate.id);
  }

  async findOne(id: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: { signatures: { orderBy: { signedAt: 'asc' } }, job: true },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  /** Append a signature, enforcing the workflow order and immutability. */
  async sign(
    id: string,
    stage: SignatureStage,
    signedById: string,
    signedByName: string,
  ) {
    const cert = await this.findOne(id);
    if (cert.isLocked) {
      throw new ConflictException('Certificate is locked and immutable');
    }

    const signedStages = cert.signatures.map((s) => s.stage);
    const expectedIndex = signedStages.length;
    if (SIGNATURE_ORDER[expectedIndex] !== stage) {
      throw new BadRequestException(
        `Out-of-order signature: expected ${SIGNATURE_ORDER[expectedIndex]}, got ${stage}`,
      );
    }

    const signatureHash = createHash('sha256')
      .update(`${id}|${stage}|${signedById}|${cert.qrHash}`)
      .digest('hex');

    await this.prisma.digitalSignature.create({
      data: { certificateId: id, stage, signedById, signedByName, signatureHash },
    });

    // When the last required stage (QUALITY_MANAGER) is signed, auto-lock the certificate.
    const isLastStage = signedStages.length + 1 === SIGNATURE_ORDER.length;
    if (isLastStage) {
      await this.prisma.certificate.update({
        where: { id },
        data: { isLocked: true },
      });

      // Fetch customer email for the job linked to this certificate.
      const jobWithCustomer = await this.prisma.job.findUnique({
        where: { id: cert.jobId },
        include: { customer: true },
      });

      if (jobWithCustomer?.customer?.email) {
        try {
          const htmlContent = await this.reports.certificateHtml(id);
          await this.mail.sendCertificate(
            jobWithCustomer.customer.email,
            cert.certificateNumber,
            (cert.job as any)?.jobNumber ?? id,
            htmlContent,
          );
        } catch (err) {
          // Email failure must never block certificate finalisation
          console.error('[certificates] Email send failed:', err);
        }
      }
    }

    return this.findOne(id);
  }

  /** Public verification: returns status + QR payload for a certificate. */
  async verify(id: string) {
    const cert = await this.findOne(id);
    const qr = buildQrPayload({
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issueDate: cert.issueDate,
      contentHash: cert.qrHash ?? '',
    });
    return {
      certificateNumber: cert.certificateNumber,
      status: cert.isLocked ? 'VALID' : 'PENDING_SIGNATURES',
      type: cert.type,
      issueDate: cert.issueDate,
      signatures: cert.signatures.map((s) => ({ stage: s.stage, by: s.signedByName })),
      qr,
    };
  }

  private async nextCertificateNumber(_labId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CC/${year}/`;
    // Count globally — certificateNumber has a global unique constraint.
    const existing = await this.prisma.certificate.findMany({
      where: { certificateNumber: { startsWith: prefix } },
      select: { certificateNumber: true },
    });
    let max = 0;
    for (const { certificateNumber } of existing) {
      const n = parseInt(certificateNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }
}
