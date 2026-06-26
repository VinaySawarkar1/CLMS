import {
  Controller, Get, Injectable, Module, Request, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

/**
 * Module 5 — Backup. Admin-only export of the lab's core data as a JSON
 * snapshot. Heavy binary blobs (certificate/image file payloads) are excluded
 * to keep the snapshot lightweight; metadata is retained.
 */
@Injectable()
class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  async export(labId: string) {
    const [
      customers, instruments, masters, jobs, certificates, invoices, payments,
      quotations, complaints, feedback, cmcScopes, mpeRules,
    ] = await Promise.all([
      this.prisma.customer.findMany({ where: { labId } }),
      this.prisma.instrument.findMany({ where: { labId } }),
      this.prisma.masterInstrument.findMany({ where: { labId } }),
      this.prisma.job.findMany({ where: { labId } }),
      this.prisma.certificate.findMany({ where: { job: { labId } } }),
      this.prisma.invoice.findMany({ where: { labId } }),
      this.prisma.payment.findMany({ where: { invoice: { labId } } }),
      this.prisma.quotation.findMany({ where: { labId } }),
      this.prisma.complaint.findMany({ where: { labId } }),
      this.prisma.customerFeedback.findMany({ where: { labId } }),
      this.prisma.cmcScope.findMany({ where: { labId } }),
      this.prisma.mpeRule.findMany({ where: { labId } }),
    ]);

    return {
      meta: { labId, generatedAt: new Date().toISOString(), version: 1 },
      counts: {
        customers: customers.length, instruments: instruments.length, masters: masters.length,
        jobs: jobs.length, certificates: certificates.length, invoices: invoices.length,
        payments: payments.length, quotations: quotations.length, complaints: complaints.length,
        feedback: feedback.length, cmcScopes: cmcScopes.length, mpeRules: mpeRules.length,
      },
      data: {
        customers, instruments, masters, jobs, certificates, invoices, payments,
        quotations, complaints, feedback, cmcScopes, mpeRules,
      },
    };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backup')
class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Get('export')
  @Roles(Role.LAB_ADMIN, Role.SUPER_ADMIN)
  export(@Request() req: any) {
    return this.backup.export(req.user.labId);
  }
}

@Module({
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
