import {
  Controller,
  Get,
  Injectable,
  Module,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async widgets(labId: string) {
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
      this.prisma.job.count({ where: { labId, receivedAt: { gte: startOfDay } } }),
      this.prisma.job.count({
        where: { labId, status: { in: ['RECEIVED', 'WAITING', 'ASSIGNED'] } },
      }),
      this.prisma.job.count({
        where: { labId, dueDate: { lt: new Date() }, status: { not: 'CLOSED' } },
      }),
      this.prisma.certificate.count({ where: { job: { labId } } }),
      this.prisma.masterInstrument.count({
        where: { labId, calibrationDue: { lt: new Date() } },
      }),
      this.prisma.customer.count({ where: { labId } }),
    ]);

    const byStatus = await this.prisma.job.groupBy({
      by: ['status'],
      where: { labId },
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
  widgets(@Request() req: any) {
    return this.dashboard.widgets(req.user.labId);
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
