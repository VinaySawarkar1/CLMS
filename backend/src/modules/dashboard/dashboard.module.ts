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

  async kpis(labId: string) {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Statuses considered "still in progress" (not yet finalised/delivered/closed).
    const COMPLETED_STATUSES = [
      'CERTIFICATE_GENERATED',
      'DELIVERED',
      'CLOSED',
    ] as const;

    const [
      jobsToday,
      pendingJobs,
      // certificatesPending: jobs awaiting a certificate. Definition:
      // jobs in APPROVED or PENDING_REVIEW (calibration done / under review but
      // certificate not yet generated).
      certificatesPending,
      dueStandards,
      customerCount,
    ] = await Promise.all([
      this.prisma.job.count({
        where: { labId, receivedAt: { gte: startOfDay } },
      }),
      this.prisma.job.count({
        where: { labId, status: { notIn: [...COMPLETED_STATUSES] } },
      }),
      this.prisma.job.count({
        where: { labId, status: { in: ['APPROVED', 'PENDING_REVIEW'] } },
      }),
      this.prisma.masterInstrument.count({
        where: { labId, calibrationDue: { lte: in30Days } },
      }),
      this.prisma.customer.count({ where: { labId } }),
    ]);

    // Revenue: sum of totalAmount over PAID invoices for the lab.
    const revenueAgg = await this.prisma.invoice.aggregate({
      where: { labId, status: 'PAID' },
      _sum: { totalAmount: true },
    });
    const revenue = revenueAgg._sum.totalAmount ?? 0;

    // Monthly calibration: count of jobs grouped by YYYY-MM for the last 6 months.
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recentJobs = await this.prisma.job.findMany({
      where: { labId, receivedAt: { gte: sixMonthsAgo } },
      select: { receivedAt: true },
    });
    const monthBuckets: { month: string; count: number }[] = [];
    const monthIndex = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthIndex.set(key, monthBuckets.length);
      monthBuckets.push({ month: key, count: 0 });
    }
    for (const j of recentJobs) {
      const d = j.receivedAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = monthIndex.get(key);
      if (idx !== undefined) monthBuckets[idx].count += 1;
    }
    const monthlyCalibration = monthBuckets;

    // Engineer productivity: jobs handled per engineer (resolved via Engineer.user.fullName).
    const jobsByEngineer = await this.prisma.job.groupBy({
      by: ['engineerId'],
      where: { labId, engineerId: { not: null } },
      _count: { _all: true },
    });
    const engineerIds = jobsByEngineer
      .map((g) => g.engineerId)
      .filter((id): id is string => id !== null);
    const engineers = engineerIds.length
      ? await this.prisma.engineer.findMany({
          where: { id: { in: engineerIds } },
          select: { id: true, user: { select: { fullName: true } } },
        })
      : [];
    const engineerNameById = new Map(
      engineers.map((e) => [e.id, e.user.fullName]),
    );
    const engineerProductivity = jobsByEngineer.map((g) => ({
      engineer: engineerNameById.get(g.engineerId as string) ?? 'Unknown',
      jobs: g._count._all,
    }));

    // Turnaround time: average (certificate.issueDate - job.receivedAt) in days
    // over jobs that have a certificate.
    const certifiedJobs = await this.prisma.job.findMany({
      where: { labId, certificate: { isNot: null } },
      select: {
        receivedAt: true,
        certificate: { select: { issueDate: true } },
      },
    });
    let turnaroundTimeDays = 0;
    if (certifiedJobs.length) {
      const totalDays = certifiedJobs.reduce((sum, j) => {
        const issued = j.certificate?.issueDate;
        if (!issued) return sum;
        const diffMs = issued.getTime() - j.receivedAt.getTime();
        return sum + diffMs / (1000 * 60 * 60 * 24);
      }, 0);
      turnaroundTimeDays =
        Math.round((totalDays / certifiedJobs.length) * 100) / 100;
    }

    return {
      jobsToday,
      pendingJobs,
      certificatesPending,
      dueStandards,
      revenue,
      monthlyCalibration,
      engineerProductivity,
      turnaroundTimeDays,
      customerCount,
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

  @Get('kpis')
  kpis(@Request() req: any) {
    return this.dashboard.kpis(req.user.labId);
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
