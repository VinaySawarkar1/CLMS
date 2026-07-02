import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';

/**
 * AutomationScheduler — runs daily at 08:15 and handles:
 *  #1  Auto-close DELIVERED jobs after 7 days
 *  #2  Certificate / instrument calibration expiry alerts (30 / 15 / 7 days)
 *  #6  Lab plan expiry warnings (7d / 1d) + auto-suspend on expiry
 */
@Injectable()
export class AutomationScheduler {
  private readonly logger = new Logger(AutomationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron('15 8 * * *') // 08:15 every day
  async runDailyAutomations() {
    this.logger.log('[automation] Starting daily automation run');
    await Promise.allSettled([
      this.autoCloseDeliveredJobs(),
      this.certExpiryAlerts(),
      this.planExpiryCheck(),
    ]);
    this.logger.log('[automation] Daily automation run complete');
  }

  // ──────────────────────────────────────────────────────────────────
  // #1  Auto-close DELIVERED jobs after AUTO_CLOSE_DAYS days
  // ──────────────────────────────────────────────────────────────────
  async autoCloseDeliveredJobs(autoCloseDays = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - autoCloseDays);

    const jobs = await this.prisma.job.findMany({
      where: { status: 'DELIVERED', updatedAt: { lte: cutoff } },
      select: { id: true, jobNumber: true, labId: true, customerId: true },
    });

    let closed = 0;
    for (const job of jobs) {
      try {
        await this.prisma.job.update({ where: { id: job.id }, data: { status: 'CLOSED' } });
        await this.prisma.auditLog.create({
          data: {
            labId: job.labId,
            userId: null,
            action: 'JOB_AUTO_CLOSED',
            entity: 'Job',
            entityId: job.id,
          },
        });
        closed++;
        this.logger.log(`[auto-close] Job ${job.jobNumber} auto-closed`);
      } catch (err: any) {
        this.logger.error(`[auto-close] Failed for job ${job.id}: ${err?.message}`);
      }
    }

    this.logger.log(`[auto-close] ${closed} job(s) auto-closed`);
    return closed;
  }

  // ──────────────────────────────────────────────────────────────────
  // #2  Certificate / instrument calibration expiry alerts
  //     Notifies LAB users (in-app + email) about upcoming renewals
  // ──────────────────────────────────────────────────────────────────
  async certExpiryAlerts(): Promise<number> {
    const THRESHOLDS = [30, 15, 7];
    const now = new Date();
    let sent = 0;

    for (const days of THRESHOLDS) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);

      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find instruments whose calibration certificate is due in `days` days
      const instruments = await this.prisma.instrument.findMany({
        where: { nextDueDate: { gte: dayStart, lte: dayEnd } },
        include: {
          lab: {
            select: {
              id: true, name: true, contactEmail: true,
              users: {
                where: { role: { in: ['LAB_ADMIN', 'TECHNICAL_MANAGER'] }, isActive: true },
                select: { id: true, email: true, fullName: true },
              },
            },
          },
          customer: { select: { name: true, email: true } },
        },
      });

      for (const inst of instruments) {
        const dueStr = inst.nextDueDate!.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

        // In-app notification for each LAB_ADMIN / TECHNICAL_MANAGER (batch insert)
        const labUsers = inst.lab?.users ?? [];
        if (labUsers.length > 0) {
          try {
            await this.prisma.notification.createMany({
              data: labUsers.map((labUser) => ({
                labId: inst.labId,
                userId: labUser.id,
                channel: 'EMAIL' as const,
                event: 'CALIBRATION_DUE',
                payload: {
                  instrumentId: inst.id,
                  instrumentName: inst.name,
                  serialNumber: inst.serialNumber,
                  customerName: inst.customer?.name,
                  daysRemaining: days,
                  dueDate: inst.nextDueDate!.toISOString(),
                  message: `${inst.name} (S/N: ${inst.serialNumber ?? 'N/A'}) calibration due in ${days} day(s) on ${dueStr}`,
                } as any,
              })),
            });
          } catch { /* non-fatal */ }
        }

        // Email to lab contact
        if (inst.lab?.contactEmail) {
          try {
            await this.mail.sendRecallReminder(
              inst.lab.contactEmail,
              `[${days}d] Calibration Due — ${inst.name} (${inst.customer?.name ?? ''})`,
              `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#1677ff">Calibration Due in ${days} Day(s)</h2>
                <p>The following customer instrument is due for calibration renewal.</p>
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
                    <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong>Customer</strong></td>
                    <td style="padding:8px 12px;border:1px solid #d9e4ff">${inst.customer?.name ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong>Due Date</strong></td>
                    <td style="padding:8px 12px;border:1px solid #d9e4ff"><strong style="color:#d4380d">${dueStr}</strong></td>
                  </tr>
                </table>
                <p style="color:#555">Please create a new calibration job or contact the customer to schedule re-calibration.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                <p style="font-size:12px;color:#888">This is an automated reminder from CortexCLMS · ${inst.lab?.name}</p>
              </div>
              `,
            );
            sent++;
            this.logger.log(`[cert-expiry] ${days}d alert sent to ${inst.lab.contactEmail} for ${inst.name}`);
          } catch (err: any) {
            this.logger.error(`[cert-expiry] Email failed for ${inst.id}: ${err?.message}`);
          }
        }
      }
    }

    this.logger.log(`[cert-expiry] ${sent} alert(s) sent`);
    return sent;
  }

  // ──────────────────────────────────────────────────────────────────
  // #6  Plan expiry warnings + auto-suspend
  // ──────────────────────────────────────────────────────────────────
  async planExpiryCheck(): Promise<void> {
    const now = new Date();

    // 1. Auto-suspend expired labs
    const expired = await this.prisma.lab.findMany({
      where: {
        status: 'APPROVED',
        planExpiresAt: { lt: now },
        plan: { not: 'ENTERPRISE' }, // Enterprise is managed manually
      },
      include: {
        users: {
          where: { role: 'LAB_ADMIN', isActive: true },
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    for (const lab of expired) {
      try {
        await this.prisma.lab.update({ where: { id: lab.id }, data: { status: 'SUSPENDED' } });
        await this.prisma.auditLog.create({
          data: { labId: lab.id, userId: null, action: 'LAB_AUTO_SUSPENDED_PLAN_EXPIRED', entity: 'Lab', entityId: lab.id },
        });
        this.logger.warn(`[plan-expiry] Lab ${lab.name} auto-suspended — plan expired`);

        // Notify lab admin
        for (const admin of lab.users) {
          await this.sendPlanEmail(
            admin.email,
            `Your CortexCLMS subscription for "${lab.name}" has expired`,
            `
            <h2 style="color:#cf1322">Subscription Expired</h2>
            <p>Dear ${admin.fullName},</p>
            <p>Your <strong>${lab.plan}</strong> plan subscription for lab <strong>${lab.name}</strong> has expired and access has been suspended.</p>
            <p>Please renew your subscription or contact support to restore access.</p>
            `,
          );
        }

        // Notify SUPER_ADMIN(s)
        await this.notifySuperAdmins(
          `[Plan Expired] Lab "${lab.name}" auto-suspended`,
          `Lab <strong>${lab.name}</strong> (plan: ${lab.plan}) has been auto-suspended because its subscription expired on ${lab.planExpiresAt?.toLocaleDateString('en-IN')}.`,
        );
      } catch (err: any) {
        this.logger.error(`[plan-expiry] Auto-suspend failed for lab ${lab.id}: ${err?.message}`);
      }
    }

    // 2. Warn about upcoming expiry (7 days and 1 day)
    for (const warnDays of [7, 1]) {
      const warnDate = new Date(now);
      warnDate.setDate(warnDate.getDate() + warnDays);
      const warnStart = new Date(warnDate); warnStart.setHours(0, 0, 0, 0);
      const warnEnd = new Date(warnDate);   warnEnd.setHours(23, 59, 59, 999);

      const expiringSoon = await this.prisma.lab.findMany({
        where: {
          status: 'APPROVED',
          planExpiresAt: { gte: warnStart, lte: warnEnd },
          plan: { not: 'ENTERPRISE' },
        },
        include: {
          users: {
            where: { role: 'LAB_ADMIN', isActive: true },
            select: { id: true, email: true, fullName: true },
          },
        },
      });

      for (const lab of expiringSoon) {
        const expiryStr = lab.planExpiresAt!.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const urgency = warnDays === 1 ? '🚨 URGENT: ' : '⚠️ ';

        for (const admin of lab.users) {
          // In-app notification
          await this.prisma.notification.create({
            data: {
              labId: lab.id,
              userId: admin.id,
              channel: 'EMAIL',
              event: 'PAYMENT_DUE',
              payload: {
                message: `${urgency}Your ${lab.plan} plan expires in ${warnDays} day(s) on ${expiryStr}. Renew now to avoid service interruption.`,
              } as any,
            },
          }).catch(() => undefined);

          // Email
          await this.sendPlanEmail(
            admin.email,
            `${urgency}CortexCLMS subscription expires in ${warnDays} day(s) — ${lab.name}`,
            `
            <h2 style="color:${warnDays === 1 ? '#cf1322' : '#d46b08'}">${urgency}Subscription Expiring in ${warnDays} Day(s)</h2>
            <p>Dear ${admin.fullName},</p>
            <p>Your <strong>${lab.plan}</strong> plan for lab <strong>${lab.name}</strong> will expire on <strong>${expiryStr}</strong>.</p>
            <p>Please renew your subscription before the expiry date to avoid service interruption.</p>
            <p>Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@example.com'}">${process.env.SUPPORT_EMAIL || 'support@example.com'}</a>${process.env.SUPPORT_PHONE ? ` or call ${process.env.SUPPORT_PHONE}` : ''} to upgrade or renew.</p>
            `,
          );

          this.logger.warn(`[plan-expiry] ${warnDays}d warning sent to ${admin.email} for lab ${lab.name}`);
        }

        // Notify SUPER_ADMIN
        await this.notifySuperAdmins(
          `[Plan Expiry ${warnDays}d] Lab "${lab.name}"`,
          `Lab <strong>${lab.name}</strong> (plan: ${lab.plan}) expires in ${warnDays} day(s) on ${expiryStr}.`,
        );
      }
    }
  }

  // ── helpers ──────────────────────────────────────────────────────

  private async sendPlanEmail(to: string, subject: string, bodyHtml: string) {
    try {
      await this.mail.sendRecallReminder(
        to,
        subject,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#888">CortexCLMS · Pune, Maharashtra, India 411034</p>
        </div>`,
      );
    } catch (err: any) {
      this.logger.error(`[plan-email] Send failed to ${to}: ${err?.message}`);
    }
  }

  private async notifySuperAdmins(subject: string, bodyHtml: string) {
    const superAdmins = await this.prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { email: true },
    });
    for (const sa of superAdmins) {
      await this.sendPlanEmail(sa.email, subject, bodyHtml);
    }
  }
}
