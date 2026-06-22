import { createHash } from 'crypto';

/**
 * CLMS QR Verification Engine
 * ---------------------------
 * Builds the tamper-evident payload embedded in a certificate's QR code and
 * the public verification URL used to confirm authenticity.
 */

export interface CertificateQrInput {
  certificateId: string;
  certificateNumber: string;
  issueDate: Date;
  /** Stable content fingerprint of the certificate data. */
  contentHash: string;
}

const VERIFY_BASE_URL =
  process.env.CERT_VERIFY_BASE_URL || 'https://verify.clms.local/c';

/** Deterministic SHA-256 fingerprint of arbitrary certificate content. */
export function contentHash(content: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex');
}

export function buildQrPayload(input: CertificateQrInput) {
  const hash = createHash('sha256')
    .update(`${input.certificateId}|${input.certificateNumber}|${input.contentHash}`)
    .digest('hex');

  return {
    certificateId: input.certificateId,
    certificateNumber: input.certificateNumber,
    issueDate: input.issueDate.toISOString(),
    hash,
    verificationUrl: `${VERIFY_BASE_URL}/${input.certificateId}?h=${hash.slice(0, 16)}`,
  };
}

/** Verify a presented hash against the stored certificate fingerprint. */
export function verifyHash(stored: string, presented: string): boolean {
  return stored.length > 0 && stored === presented;
}
