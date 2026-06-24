import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, Post, Request, UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Customer self-service portal. Scoped by labId from the authenticated user.
 * Portal links are stored in the Setting table as `portal:link:<userId>` → { customerId }.
 */
@Injectable()
class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerIdFor(userId: string): Promise<string> {
    const link = await this.prisma.setting.findUnique({ where: { key: `portal:link:${userId}` } });
    const customerId = (link?.value as any)?.customerId;
    if (!customerId) throw new ForbiddenException('Portal account is not linked to a customer');
    return customerId;
  }

  async jobs(userId: string, labId: string) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.job.findMany({
      where: { customerId, labId },
      include: { instrument: true, certificate: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async certificates(userId: string, labId: string) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.certificate.findMany({
      where: { job: { customerId, labId }, isLocked: true },
      include: { job: { include: { instrument: true } } },
      orderBy: { issueDate: 'desc' },
    });
  }

  async invoices(userId: string, labId: string) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.invoice.findMany({
      where: { customerId, labId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestCalibration(userId: string, labId: string, body: { instrumentName: string; remarks?: string }) {
    const customerId = await this.customerIdFor(userId);
    const id = randomUUID();
    await this.prisma.setting.create({
      data: {
        key: `portal:request:${id}`,
        value: { id, customerId, labId, ...body, status: 'NEW', createdAt: new Date().toISOString() },
      },
    });
    return { id, status: 'NEW' };
  }

  async raiseComplaint(userId: string, labId: string, body: { description: string }) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.nCR.create({
      data: {
        labId,
        reference: `CMP/${new Date().getFullYear()}/${randomUUID().slice(0, 8)}`,
        description: `[Customer ${customerId}] ${body.description}`,
        raisedById: userId,
      },
    });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('portal')
class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('jobs')
  jobs(@Request() req: any) {
    return this.portal.jobs(req.user.id, req.user.labId);
  }

  @Get('certificates')
  certificates(@Request() req: any) {
    return this.portal.certificates(req.user.id, req.user.labId);
  }

  @Get('invoices')
  invoices(@Request() req: any) {
    return this.portal.invoices(req.user.id, req.user.labId);
  }

  @Post('requests')
  request(@Request() req: any, @Body() body: any) {
    return this.portal.requestCalibration(req.user.id, req.user.labId, body);
  }

  @Post('complaints')
  complaint(@Request() req: any, @Body() body: any) {
    return this.portal.raiseComplaint(req.user.id, req.user.labId, body);
  }
}

@Module({
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
