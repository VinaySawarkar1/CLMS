import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  async sendCertificate(
    to: string,
    certNumber: string,
    jobNumber: string,
    htmlContent: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[mail] SMTP not configured, skipping email to ${to}`);
      return;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const subject = `Calibration Certificate ${certNumber} — ${jobNumber}`;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      html: htmlContent,
    });

    this.logger.log(`[mail] Certificate ${certNumber} sent to ${to}`);
  }
}
