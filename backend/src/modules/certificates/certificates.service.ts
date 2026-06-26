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
  'ENGINEER',
  'REVIEWER',
  'TECHNICAL_MANAGER',
  'QUALITY_MANAGER',
  'FINAL_LOCK',
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

    const certificateNumber = await this.nextCertificateNumber(labId, type);
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

    // When the last required stage (FINAL_LOCK) is signed, auto-lock the certificate.
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
      revision: cert.revision,
      issueDate: cert.issueDate,
      jobNumber: (cert.job as any)?.jobNumber,
      signatures: cert.signatures.map((s) => ({ stage: s.stage, by: s.signedByName })),
      qr,
    };
  }

  /**
   * Certificate-number prefix per certificate type. NABL and Non-NABL
   * certificates run on independent sequences so their numbers never collide.
   */
  private static readonly TYPE_PREFIX: Record<CertificateType, string> = {
    NABL: 'CC',
    NON_NABL: 'CR',
    CALIBRATION_REPORT: 'CALR',
    VERIFICATION_REPORT: 'VR',
    TEST_REPORT: 'TR',
  };

  private async nextCertificateNumber(
    _labId: string,
    type: CertificateType,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const code = CertificatesService.TYPE_PREFIX[type] ?? 'CC';
    const prefix = `${code}/${year}/`;
    // Count globally per type — certificateNumber has a global unique
    // constraint, so the running sequence is scoped by the type prefix.
    const existing = await this.prisma.certificate.findMany({
      where: { certificateNumber: { startsWith: prefix } },
      select: { certificateNumber: true },
    });
    let max = 0;
    for (const { certificateNumber } of existing) {
      // The base sequence number is the segment after the prefix, ignoring any
      // "/R{n}" revision suffix (e.g. CC/2026/00007/R1).
      const seq = certificateNumber.slice(prefix.length).split('/')[0];
      const n = parseInt(seq, 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }

  /**
   * Create a new revision of an existing (locked) certificate. The original is
   * never edited in place: its current state is archived read-only into
   * CertificateRevision, then the certificate row is advanced to the next
   * revision with a fresh number (…/R{n}), cleared signatures and unlocked so
   * the new revision can be re-reviewed and re-signed.
   */
  async createRevision(
    id: string,
    labId: string,
    reason: string,
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A revision reason is required');
    }
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: { signatures: { orderBy: { signedAt: 'asc' } }, job: true },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    if ((cert.job as any).labId !== labId) {
      throw new NotFoundException('Certificate not found');
    }
    if (!cert.isLocked) {
      throw new BadRequestException(
        'Only a finalised (locked) certificate can be revised',
      );
    }

    // Archive the current state as an immutable historical revision.
    await this.prisma.certificateRevision.create({
      data: {
        certificateId: cert.id,
        revision: cert.revision,
        certificateNumber: cert.certificateNumber,
        type: cert.type,
        issueDate: cert.issueDate,
        qrHash: cert.qrHash,
        decisionRule: cert.decisionRule,
        revisionReason: cert.revisionReason,
        snapshot: {
          isLocked: cert.isLocked,
          signatures: cert.signatures.map((s) => ({
            stage: s.stage,
            signedByName: s.signedByName,
            signedAt: s.signedAt,
            signatureHash: s.signatureHash,
          })),
        },
      },
    });

    // New revision number: base sequence carried forward with a /R{n} suffix.
    const nextRevision = cert.revision + 1;
    const base = cert.certificateNumber.split('/R')[0];
    const newNumber = `${base}/R${nextRevision}`;
    const newHash = createHash('sha256')
      .update(`${cert.qrHash ?? ''}|R${nextRevision}|${reason}`)
      .digest('hex');

    // Clear prior signatures, unlock, and advance the revision in place.
    await this.prisma.digitalSignature.deleteMany({
      where: { certificateId: cert.id },
    });
    await this.prisma.certificate.update({
      where: { id: cert.id },
      data: {
        certificateNumber: newNumber,
        revision: nextRevision,
        revisionReason: reason.trim(),
        isLocked: false,
        issueDate: new Date(),
        qrHash: newHash,
      },
    });

    // Reopen the job for re-review of the revised certificate.
    await this.prisma.job.update({
      where: { id: cert.jobId },
      data: { status: 'APPROVED' },
    });

    return this.findOne(cert.id);
  }

  /** Full revision history (archived, read-only) for a certificate. */
  async getRevisions(id: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: { revisions: { orderBy: { revision: 'desc' } } },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return {
      current: {
        revision: cert.revision,
        certificateNumber: cert.certificateNumber,
        revisionReason: cert.revisionReason,
        isLocked: cert.isLocked,
        issueDate: cert.issueDate,
      },
      history: cert.revisions,
    };
  }

  /**
   * Public lookup for the online verification page. Resolves a certificate by
   * its certificate number or by job number, returning the verification view.
   */
  async lookup(query: string) {
    const q = (query ?? '').trim();
    if (!q) throw new BadRequestException('A search term is required');
    const cert = await this.prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateNumber: { equals: q, mode: 'insensitive' } },
          { job: { jobNumber: { equals: q, mode: 'insensitive' } } },
        ],
      },
      include: { job: true },
    });
    if (!cert) {
      throw new NotFoundException(
        'No certificate found for that certificate or job number',
      );
    }
    return this.verify(cert.id);
  }
}
