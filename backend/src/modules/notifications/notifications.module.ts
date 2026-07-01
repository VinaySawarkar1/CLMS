import {
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { MailModule } from '../../common/mail/mail.module';
import { MailService } from '../../common/mail/mail.service';
import { RecallScheduler } from './recall.scheduler';
import { AutomationScheduler } from './automation.scheduler';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
export type NotificationEvent =
  | 'CALIBRATION_DUE'
  | 'STANDARD_EXPIRY'
  | 'CAPA_DUE'
  | 'AUDIT_DUE'
  | 'JOB_ASSIGNED'
  | 'CERTIFICATE_READY'
  | 'CERTIFICATE_APPROVAL'
  | 'REVIEW_PENDING'
  | 'DELIVERY'
  | 'PAYMENT_DUE'
  | 'MASTER_DUE';

/** Human-readable subject line per event for outbound messages. */
const EVENT_SUBJECTS: Record<string, string> = {
  CALIBRATION_DUE: 'Calibration due reminder',
  STANDARD_EXPIRY: 'Reference standard expiry reminder',
  CAPA_DUE: 'CAPA action due',
  AUDIT_DUE: 'Internal audit due',
  JOB_ASSIGNED: 'New job assigned',
  CERTIFICATE_READY: 'Calibration certificate ready',
  CERTIFICATE_APPROVAL: 'Certificate awaiting approval',
  REVIEW_PENDING: 'Calibration review pending',
  DELIVERY: 'Instrument delivered',
  PAYMENT_DUE: 'Payment due',
  MASTER_DUE: 'Reference standard due',
};

/**
 * Persists notifications and dispatches them to channels. Email uses the
 * configured SMTP transport; SMS/WhatsApp are config-driven (an HTTP gateway
 * set via env) and degrade gracefully to a recorded-only notification when no
 * provider is configured — never throwing.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async notify(params: {
    labId?: string;
    userId?: string;
    channel: NotificationChannel;
    event: NotificationEvent;
    payload?: Record<string, unknown>;
  }) {
    const record = await this.prisma.notification.create({
      data: {
        labId: params.labId,
        userId: params.userId,
        channel: params.channel,
        event: params.event,
        payload: (params.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    // Dispatch must never break the calling action.
    this.dispatch(record.channel, record.event, record.payload as any).catch(() => undefined);
    return record;
  }

  /** Emit the same event across several channels at once. */
  async notifyMany(params: {
    labId?: string;
    userId?: string;
    channels: NotificationChannel[];
    event: NotificationEvent;
    payload?: Record<string, unknown>;
  }) {
    const results: any[] = [];
    for (const channel of params.channels) {
      results.push(await this.notify({ ...params, channel }));
    }
    return results;
  }

  list(labId?: string, userId?: string) {
    return this.prisma.notification.findMany({
      where: { ...(labId ? { labId } : {}), ...(userId ? { userId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  private async dispatch(channel: string, event: string, payload: any) {
    const subject = EVENT_SUBJECTS[event] ?? event;
    const message: string = payload?.message ?? subject;
    try {
      if (channel === 'EMAIL' && payload?.email) {
        await this.mail.sendRecallReminder(payload.email, subject, `<p>${message}</p>`);
      } else if (channel === 'SMS' || channel === 'WHATSAPP') {
        await this.sendGateway(channel, payload?.phone, message);
      } else {
        // PUSH / in-app: persisted only.
        // eslint-disable-next-line no-console
        console.log(`[notify:${channel}] ${event}`, payload ?? '');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[notify:${channel}] dispatch failed for ${event}:`, err);
    }
  }

  /**
   * Config-driven SMS/WhatsApp gateway. Posts to the HTTP endpoint defined by
   * SMS_GATEWAY_URL / WHATSAPP_GATEWAY_URL (with an optional bearer token). When
   * unset, the message is recorded-only — no hardcoded provider or credentials.
   */
  private async sendGateway(channel: 'SMS' | 'WHATSAPP', phone: string | undefined, message: string) {
    const url = channel === 'SMS' ? process.env.SMS_GATEWAY_URL : process.env.WHATSAPP_GATEWAY_URL;
    const token = channel === 'SMS' ? process.env.SMS_GATEWAY_TOKEN : process.env.WHATSAPP_GATEWAY_TOKEN;
    if (!url || !phone) {
      // eslint-disable-next-line no-console
      console.log(`[notify:${channel}] gateway not configured — recorded only`, { phone, message });
      return;
    }
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ to: phone, message, channel }),
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly recall: RecallScheduler,
    private readonly automation: AutomationScheduler,
  ) {}

  @Get()
  list(@Request() req: any, @Query('userId') userId?: string) {
    return this.notifications.list(req.user.labId, userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Post('trigger-recall')
  @Roles(Role.LAB_ADMIN)
  async triggerRecall() {
    const result = await this.recall.runRecallCheck();
    return { ...result, triggeredAt: new Date().toISOString() };
  }

  @Post('trigger-automations')
  @Roles(Role.SUPER_ADMIN)
  async triggerAutomations() {
    const [closed, certAlerts] = await Promise.all([
      this.automation.autoCloseDeliveredJobs(),
      this.automation.certExpiryAlerts(),
    ]);
    await this.automation.planExpiryCheck();
    return { autoClosedJobs: closed, certAlertsSent: certAlerts, triggeredAt: new Date().toISOString() };
  }
}

@Module({
  imports: [MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RecallScheduler, AutomationScheduler],
  exports: [NotificationsService, AutomationScheduler],
})
export class NotificationsModule {}
