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
  constructor(private readonly prisma: PrismaService) {}

  /** Generate a certificate for an approved job. */
  async generate(jobId: string, type: CertificateType, decisionRule?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
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
    if (job.status !== 'APPROVED') {
      throw new BadRequestException('Job must be APPROVED before certificate generation');
    }

    const certificateNumber = await this.nextCertificateNumber();
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

    // FINAL_LOCK makes the certificate immutable.
    if (stage === 'FINAL_LOCK') {
      await this.prisma.certificate.update({
        where: { id },
        data: { isLocked: true },
      });
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

  private async nextCertificateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CC/${year}/`;
    const count = await this.prisma.certificate.count({
      where: { certificateNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
}
