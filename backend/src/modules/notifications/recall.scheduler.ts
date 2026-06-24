import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';

const THRESHOLDS = [30, 15, 7]; // days before due date

@Injectable()
export class RecallScheduler {
  private readonly logger = new Logger(RecallScheduler.name);
  /** In-memory set to avoid double-sending within a single run */
  private sentThisRun = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron('0 8 * * *')
  async handleRecallCheck() {
    return this.runRecallCheck();
  }

  /** Returns how many emails were sent — used by the manual trigger endpoint. */
  async runRecallCheck(): Promise<{ sent: number; instruments: any[] }> {
    this.sentThisRun.clear();

    const now = new Date();
    const results: any[] = [];

    for (const days of THRESHOLDS) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);

      // Match instruments due on that exact calendar day
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const instruments = await this.prisma.instrument.findMany({
        where: {
          nextDueDate: { gte: dayStart, lte: dayEnd },
        },
        include: {
          customer: { select: { email: true, name: true } },
          lab: { select: { name: true, contactEmail: true, accreditationNumber: true } },
        },
      });

      for (const inst of instruments) {
        const key = `${inst.id}-${days}`;
        if (this.sentThisRun.has(key)) continue;
        this.sentThisRun.add(key);

        const email = inst.customer?.email;
        if (!email) {
          this.logger.warn(`Instrument ${inst.id} (${inst.name}) — customer has no email, skipping`);
          continue;
        }

        const dueStr = inst.nextDueDate!.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

        const htmlBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1677ff">Calibration Due Reminder</h2>
            <p>Dear ${inst.customer?.name ?? 'Customer'},</p>
            <p>This is a reminder that the following instrument is due for calibration in <strong>${days} day(s)</strong>.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr style="background:#f0f5ff">
                <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong>Instrument</strong></td>
                <td style="padding:8px 12px;border:1px solid #d9e4ff">${inst.name}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong>Serial No.</strong></td>
                <td style="padding:8px 12px;border:1px solid #d9e4ff">${inst.serialNumber ?? 'N/A'}</td>
              </tr>
              <tr style="background:#f0f5ff">
                <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong>Due Date</strong></td>
                <td style="padding:8px 12px;border:1px solid #d9e4ff">${dueStr}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong>Lab</strong></td>
                <td style="padding:8px 12px;border:1px solid #d9e4ff">${inst.lab?.name ?? ''}</td>
              </tr>
            </table>
            <p>Please contact us to schedule your calibration appointment.</p>
            ${inst.lab?.contactEmail ? `<p><strong>Lab Email:</strong> <a href="mailto:${inst.lab.contactEmail}">${inst.lab.contactEmail}</a></p>` : ''}
            ${inst.lab?.accreditationNumber ? `<p><strong>Accreditation No.:</strong> ${inst.lab.accreditationNumber}</p>` : ''}
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:12px;color:#888">This is an automated reminder from CLMS.</p>
          </div>
        `;

        try {
          await this.mail.sendRecallReminder(
            email,
            `Calibration Due Reminder — ${inst.name} (S/N: ${inst.serialNumber ?? 'N/A'})`,
            htmlBody,
          );
          this.logger.log(`[recall] Sent ${days}-day reminder for ${inst.name} to ${email}`);
          results.push({ instrumentId: inst.id, name: inst.name, daysThreshold: days, sentTo: email });
        } catch (err: any) {
          this.logger.error(`[recall] Failed to send for ${inst.id}: ${err?.message}`);
        }
      }
    }

    this.logger.log(`[recall] Run complete — ${results.length} notification(s) sent`);
    return { sent: results.length, instruments: results };
  }
}
