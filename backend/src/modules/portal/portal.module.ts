import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

/**
 * Customer self-service portal. A portal user is linked to a Customer via a
 * `portal:link:<userId>` setting that stores the customerId. All reads are
 * scoped to that customer so a customer can only see their own data.
 */
@Injectable()
class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerIdFor(userId: string): Promise<string> {
    const link = await this.prisma.setting.findUnique({
      where: { key: `portal:link:${userId}` },
    });
    const customerId = (link?.value as any)?.customerId;
    if (!customerId) {
      throw new ForbiddenException('Portal account is not linked to a customer');
    }
    return customerId;
  }

  async jobs(userId: string) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.job.findMany({
      where: { customerId },
      include: { instrument: true, certificate: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async certificates(userId: string) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.certificate.findMany({
      where: { job: { customerId }, isLocked: true },
      include: { job: { include: { instrument: true } } },
      orderBy: { issueDate: 'desc' },
    });
  }

  async invoices(userId: string) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.invoice.findMany({
      where: { customerId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestCalibration(userId: string, body: { instrumentName: string; remarks?: string }) {
    const customerId = await this.customerIdFor(userId);
    // Park the request as a setting until a Quotation/Enquiry table is added.
    const id = randomUUID();
    await this.prisma.setting.create({
      data: {
        key: `portal:request:${id}`,
        value: { id, customerId, ...body, status: 'NEW', createdAt: new Date().toISOString() },
      },
    });
    return { id, status: 'NEW' };
  }

  async raiseComplaint(userId: string, body: { description: string }) {
    const customerId = await this.customerIdFor(userId);
    return this.prisma.nCR.create({
      data: {
        reference: `CMP/${new Date().getFullYear()}/${randomUUID().slice(0, 8)}`,
        description: `[Customer ${customerId}] ${body.description}`,
        raisedById: userId,
      },
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('portal')
class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('jobs')
  jobs(@Request() req: any) {
    return this.portal.jobs(req.user.id);
  }

  @Get('certificates')
  certificates(@Request() req: any) {
    return this.portal.certificates(req.user.id);
  }

  @Get('invoices')
  invoices(@Request() req: any) {
    return this.portal.invoices(req.user.id);
  }

  @Post('requests')
  request(@Request() req: any, @Body() body: any) {
    return this.portal.requestCalibration(req.user.id, body);
  }

  @Post('complaints')
  complaint(@Request() req: any, @Body() body: any) {
    return this.portal.raiseComplaint(req.user.id, body);
  }
}

@Module({
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
