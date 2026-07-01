import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Derive a 32-byte key from the env secret (or a fallback)
const ENC_SECRET = process.env.SMTP_ENC_SECRET || 'clms-smtp-enc-key-change-in-prod';
const ENC_KEY = scryptSync(ENC_SECRET, 'clms-salt', 32);
const ALGO = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

function decrypt(data: string): string {
  const [ivHex, encHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGO, ENC_KEY, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string; // plaintext when in/out of API; encrypted at rest
  fromName?: string;
  fromEmail?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /** In-memory cache: labId → transporter (invalidated on config change) */
  private cache = new Map<string, nodemailer.Transporter>();

  /** Platform-level transporter from env vars (fallback / SUPER_ADMIN mails) */
  private platformTransporter: nodemailer.Transporter | null = null;

  constructor(private readonly prisma: PrismaService) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      this.platformTransporter = nodemailer.createTransport({
        host, port, secure: port === 465, auth: { user, pass },
      });
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  /** Get SMTP config for a lab (password redacted). */
  async getSmtpConfig(labId: string): Promise<Omit<SmtpConfig, 'pass'> & { configured: boolean; hasPassword: boolean }> {
    const raw = await this.loadRawConfig(labId);
    if (!raw) return { configured: false, hasPassword: false, host: '', port: 587, secure: false, user: '', fromName: '', fromEmail: '' };
    return {
      configured: true,
      hasPassword: Boolean(raw.pass),
      host: raw.host,
      port: raw.port,
      secure: raw.secure,
      user: raw.user,
      fromName: raw.fromName ?? '',
      fromEmail: raw.fromEmail ?? '',
    };
  }

  /** Save SMTP config for a lab. Password is encrypted before storage. */
  async saveSmtpConfig(labId: string, cfg: SmtpConfig): Promise<void> {
    const toStore = {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      pass: cfg.pass ? encrypt(cfg.pass) : null,
      fromName: cfg.fromName ?? '',
      fromEmail: cfg.fromEmail ?? cfg.user,
    };
    const key = `lab_smtp:${labId}`;
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: toStore as any },
      update: { value: toStore as any },
    });
    // Invalidate cached transporter so next send picks up new config
    this.cache.delete(labId);
  }

  /** Test SMTP by sending a test email. Returns { ok, error? }. */
  async testSmtpConfig(labId: string, toEmail: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const transporter = await this.getTransporter(labId);
      if (!transporter) return { ok: false, error: 'SMTP not configured for this lab' };
      const cfg = await this.loadRawConfig(labId);
      const from = cfg?.fromEmail ? `"${cfg.fromName || 'CortexCLMS'}" <${cfg.fromEmail}>` : cfg?.user;
      await transporter.sendMail({
        from,
        to: toEmail,
        subject: 'CortexCLMS — SMTP Test Email',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#1677ff">✅ SMTP Connection Successful</h2>
            <p>Your email configuration is working correctly.</p>
            <p style="color:#888;font-size:12px">Sent from CortexCLMS · ${new Date().toLocaleString('en-IN')}</p>
          </div>
        `,
      });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Unknown error' };
    }
  }

  /** Send a certificate email using the lab's configured SMTP (or platform fallback). */
  async sendCertificate(to: string, certNumber: string, jobNumber: string, htmlContent: string, labId?: string): Promise<void> {
    const transporter = await this.getTransporter(labId);
    if (!transporter) {
      this.logger.warn(`[mail] No SMTP configured, skipping certificate email to ${to}`);
      return;
    }
    const from = await this.buildFrom(labId);
    await transporter.sendMail({
      from, to,
      subject: `Calibration Certificate ${certNumber} — ${jobNumber}`,
      html: htmlContent,
    });
    this.logger.log(`[mail] Certificate ${certNumber} sent to ${to}`);
  }

  /** Send a generic reminder/notification email. */
  async sendRecallReminder(to: string, subject: string, htmlContent: string, labId?: string): Promise<void> {
    const transporter = await this.getTransporter(labId);
    if (!transporter) {
      this.logger.warn(`[mail] No SMTP configured, skipping email to ${to}: ${subject}`);
      return;
    }
    const from = await this.buildFrom(labId);
    await transporter.sendMail({ from, to, subject, html: htmlContent });
    this.logger.log(`[mail] Email sent to ${to}: ${subject}`);
  }

  // ── Internal helpers ──────────────────────────────────────────────

  private async getTransporter(labId?: string): Promise<nodemailer.Transporter | null> {
    if (!labId) return this.platformTransporter;

    // Return cached transporter if available
    if (this.cache.has(labId)) return this.cache.get(labId)!;

    const cfg = await this.loadRawConfig(labId);
    if (!cfg) return this.platformTransporter; // fall back to platform SMTP

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass ? decrypt(cfg.pass) : '' },
    });
    this.cache.set(labId, transporter);
    return transporter;
  }

  private async buildFrom(labId?: string): Promise<string> {
    if (labId) {
      const cfg = await this.loadRawConfig(labId);
      if (cfg?.fromEmail) {
        return cfg.fromName ? `"${cfg.fromName}" <${cfg.fromEmail}>` : cfg.fromEmail;
      }
      if (cfg?.user) return cfg.user;
    }
    const envFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    return envFrom ?? 'noreply@clms.local';
  }

  private async loadRawConfig(labId: string): Promise<(SmtpConfig & { pass: string | null }) | null> {
    const key = `lab_smtp:${labId}`;
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (!row) return null;
    return row.value as any;
  }
}
