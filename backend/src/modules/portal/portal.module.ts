import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, Post, Request,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ────────────────────────── Portal JWT strategy ──────────────────────────────

function portalSecret() {
  return (process.env.PORTAL_JWT_SECRET ?? `${process.env.JWT_SECRET ?? 'clms-secret'}-portal`);
}

@Injectable()
class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: portalSecret(),
    });
  }

  validate(payload: any) {
    if (payload.role !== 'CUSTOMER') throw new UnauthorizedException();
    return payload; // { customerId, labId, role }
  }
}

@Injectable()
class PortalJwtGuard extends AuthGuard('portal-jwt') {}

// ───────────────────────────── Portal Auth Service ───────────────────────────

@Injectable()
class PortalAuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, labAccreditationCode: string) {
    // Find the lab by accreditation number
    const lab = await this.prisma.lab.findFirst({
      where: { accreditationNumber: labAccreditationCode },
    });
    if (!lab) throw new UnauthorizedException('Lab accreditation code not found');

    // Find the customer by email within this lab
    const customer = await this.prisma.customer.findFirst({
      where: { labId: lab.id, email },
    });
    if (!customer) throw new UnauthorizedException('Customer email not found for this lab');

    const payload = { customerId: customer.id, labId: lab.id, role: 'CUSTOMER' };
    const token = this.jwt.sign(payload, {
      secret: portalSecret(),
      expiresIn: '7d',
    });

    return { accessToken: token, customer: { id: customer.id, name: customer.name, email: customer.email } };
  }
}

// ────────────────────────────── Portal Service ───────────────────────────────

@Injectable()
class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Used by the legacy (internal) portal endpoints keyed by userId. */
  private async customerIdFor(userId: string): Promise<string> {
    const link = await this.prisma.setting.findUnique({ where: { key: `portal:link:${userId}` } });
    const customerId = (link?.value as any)?.customerId;
    if (!customerId) throw new ForbiddenException('Portal account is not linked to a customer');
    return customerId;
  }

  // ─── Customer-facing portal (JWT role=CUSTOMER) ───────────────────────────

  async me(customerId: string) {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true, phone: true, address: true, code: true },
    });
  }

  async portalJobs(customerId: string, labId: string) {
    return this.prisma.job.findMany({
      where: { customerId, labId },
      select: {
        id: true,
        jobNumber: true,
        status: true,
        receivedAt: true,
        dueDate: true,
        instrument: { select: { id: true, name: true, serialNumber: true } },
        certificate: { select: { id: true, certificateNumber: true, isLocked: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async portalCertificates(customerId: string, labId: string) {
    return this.prisma.certificate.findMany({
      where: { job: { customerId, labId }, isLocked: true },
      select: {
        id: true,
        certificateNumber: true,
        type: true,
        issueDate: true,
        isLocked: true,
        job: {
          select: {
            id: true,
            jobNumber: true,
            instrument: { select: { id: true, name: true, serialNumber: true } },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async portalInstruments(customerId: string, labId: string) {
    return this.prisma.instrument.findMany({
      where: { customerId, labId },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        make: true,
        model: true,
        nextDueDate: true,
        lastCalibrationDate: true,
        calibrationIntervalMonths: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Internal portal (linked via Setting) ────────────────────────────────

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

// ─────────────────────────────── Controllers ─────────────────────────────────

@Controller('portal')
class PortalAuthController {
  constructor(private readonly auth: PortalAuthService) {}

  @Post('login')
  login(@Body() body: { email: string; labAccreditationCode: string }) {
    return this.auth.login(body.email, body.labAccreditationCode);
  }
}

@UseGuards(PortalJwtGuard)
@Controller('portal')
class PortalCustomerController {
  constructor(private readonly portal: PortalService) {}

  @Get('me')
  me(@Request() req: any) {
    return this.portal.me(req.user.customerId);
  }

  @Get('jobs')
  jobs(@Request() req: any) {
    return this.portal.portalJobs(req.user.customerId, req.user.labId);
  }

  @Get('certificates')
  certificates(@Request() req: any) {
    return this.portal.portalCertificates(req.user.customerId, req.user.labId);
  }

  @Get('instruments')
  instruments(@Request() req: any) {
    return this.portal.portalInstruments(req.user.customerId, req.user.labId);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('portal')
class PortalInternalController {
  constructor(private readonly portal: PortalService) {}

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
  imports: [
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [PortalAuthController, PortalCustomerController, PortalInternalController],
  providers: [PortalService, PortalAuthService, PortalJwtStrategy],
})
export class PortalModule {}
