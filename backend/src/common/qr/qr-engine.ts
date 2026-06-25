import { createHash } from 'crypto';
import * as QRCode from 'qrcode';

export interface CertificateQrInput {
  certificateId: string;
  certificateNumber: string;
  issueDate: Date;
  contentHash: string;
}

const VERIFY_BASE_URL =
  process.env.CERT_VERIFY_BASE_URL || 'http://localhost:5173/verify';

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

export function verifyHash(stored: string, presented: string): boolean {
  return stored.length > 0 && stored === presented;
}

/** Generate a data-URL PNG QR code for the given URL (base64 encoded). */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 160,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
