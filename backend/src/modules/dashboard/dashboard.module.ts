import {
  Controller,
  Get,
  Injectable,
  Module,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async widgets() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      todaysJobs,
      pendingJobs,
      overdueJobs,
      certificatesIssued,
      dueInstruments,
      customers,
    ] = await Promise.all([
      this.prisma.job.count({ where: { receivedAt: { gte: startOfDay } } }),
      this.prisma.job.count({
        where: { status: { in: ['RECEIVED', 'WAITING', 'ASSIGNED'] } },
      }),
      this.prisma.job.count({
        where: { dueDate: { lt: new Date() }, status: { not: 'CLOSED' } },
      }),
      this.prisma.certificate.count(),
      this.prisma.masterInstrument.count({
        where: { calibrationDue: { lt: new Date() } },
      }),
      this.prisma.customer.count(),
    ]);

    const byStatus = await this.prisma.job.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return {
      todaysJobs,
      pendingJobs,
      overdueJobs,
      certificatesIssued,
      masterDue: dueInstruments,
      customers,
      jobsByStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count._all]),
      ),
    };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  widgets() {
    return this.dashboard.widgets();
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
