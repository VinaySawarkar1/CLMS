import {
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
    userId?: string;
    channel: NotificationChannel;
    event: NotificationEvent;
    payload?: Record<string, unknown>;
  }) {
    const record = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        channel: params.channel,
        event: params.event,
        payload: params.payload ?? undefined,
      },
    });
    await this.dispatch(record.channel, record.event, record.payload);
    return record;
  }

  list(userId?: string) {
    return this.prisma.notification.findMany({
      where: userId ? { userId } : undefined,
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

@UseGuards(JwtAuthGuard)
@Controller('notifications')
class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query('userId') userId?: string) {
    return this.notifications.list(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }
}

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
