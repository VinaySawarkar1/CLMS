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
import { RecallScheduler } from './recall.scheduler';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
export type NotificationEvent =
  | 'CALIBRATION_DUE'
  | 'JOB_ASSIGNED'
  | 'CERTIFICATE_READY'
  | 'REVIEW_PENDING'
  | 'PAYMENT_DUE'
  | 'MASTER_DUE';

/**
 * Persists notifications and dispatches them to channels. Channel delivery is
 * stubbed (logged) here; integrate a provider (SES/Twilio/WhatsApp) per channel.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.dispatch(record.channel, record.event, record.payload);
    return record;
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

  private async dispatch(channel: string, event: string, payload: unknown) {
    // TODO: integrate real providers per channel.
    // eslint-disable-next-line no-console
    console.log(`[notify:${channel}] ${event}`, payload ?? '');
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly recall: RecallScheduler,
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
}

@Module({
  imports: [MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RecallScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
