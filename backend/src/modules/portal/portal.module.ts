import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, Param, Post, Request,
  UnauthorizedException, UseGuards, Res, HttpCode, HttpStatus, HttpException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ── Portal login rate limiter (5 attempts per IP per 15 minutes) ─────────────
const PORTAL_MAX_ATTEMPTS = 5;
const PORTAL_WINDOW_MS = 15 * 60 * 1000;
const portalIpMap = new Map<string, { count: number; resetAt: number }>();

function checkPortalRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = portalIpMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + PORTAL_WINDOW_MS };
    portalIpMap.set(ip, entry);
  }
  entry.count++;
  return entry.count > PORTAL_MAX_ATTEMPTS;
}

// Periodic cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of portalIpMap.entries()) {
    if (now > entry.resetAt) portalIpMap.delete(ip);
  }
}, 10 * 60 * 1000);

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

  async login(email: string, password: string, labAccreditationCode?: string) {
    let lab: any = null;

    if (labAccreditationCode) {
      lab = await this.prisma.lab.findFirst({
        where: { accreditationNumber: labAccreditationCode },
      });
      if (!lab) throw new UnauthorizedException('Lab accreditation code not found');
    }

    const whereClause: any = { email };
    if (lab) whereClause.labId = lab.id;

    const customer = await this.prisma.customer.findFirst({ where: whereClause });
    if (!customer) throw new UnauthorizedException('Customer email not found');

    // If customer has a portal password set, validate it
    if (customer.portalPassword) {
      const passwordValid = password ? await bcrypt.compare(password, customer.portalPassword) : false;
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid password');
      }
    } else {
      // No password set yet — allow login with just email (backwards compat)
      // but require lab code to identify the right lab
      if (!labAccreditationCode) {
        throw new UnauthorizedException('Password not set. Contact the lab to set your portal password.');
      }
    }

    // Resolve lab if not already done
    if (!lab) {
      lab = await this.prisma.lab.findUnique({ where: { id: customer.labId } });
    }

    const payload = { customerId: customer.id, labId: customer.labId, role: 'CUSTOMER' };
    const token = this.jwt.sign(payload, { secret: portalSecret(), expiresIn: '7d' });

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

  async downloadCertificate(certId: string, customerId: string, labId: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: { id: certId, isLocked: true, job: { customerId, labId } },
      include: {
        job: {
          include: {
            instrument: true,
            customer: true,
            datasheets: { include: { observations: true, uncertainty: true } },
          },
        },
      },
    });
    if (!cert) throw new ForbiddenException('Certificate not found or not accessible');
    return cert;
  }

  async submitComplaint(customerId: string, labId: string, body: { description: string; subject?: string }) {
    return this.prisma.complaint.create({
      data: {
        labId,
        complaintNo: `PORTAL/${new Date().getFullYear()}/${randomUUID().slice(0, 8).toUpperCase()}`,
        customerId,
        subject: body.subject,
        description: body.description,
        status: 'OPEN',
      },
    });
  }

  async submitFeedback(customerId: string, labId: string, body: {
    serviceRating: number; qualityRating: number; tatRating: number; supportRating: number; comments?: string; jobId?: string;
  }) {
    return this.prisma.customerFeedback.create({
      data: { labId, customerId, ...body },
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

  // ─── Admin: set portal password for a customer ────────────────────────────

  async setPortalPassword(customerId: string, labId: string, password: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, labId } });
    if (!customer) throw new ForbiddenException('Customer not found');
    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { portalPassword: hashed },
    });
    return { success: true };
  }
}

// ─────────────────────────────── Controllers ─────────────────────────────────

@Controller('portal')
class PortalAuthController {
  constructor(private readonly auth: PortalAuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password?: string; labAccreditationCode?: string }, @Request() req: any) {
    const ip = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    if (checkPortalRateLimit(ip)) {
      throw new HttpException('Too many login attempts. Please try again later.', 429);
    }
    return this.auth.login(body.email, body.password ?? '', body.labAccreditationCode);
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

  @Get('certificates/:id/download')
  async downloadCertificate(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const cert = await this.portal.downloadCertificate(id, req.user.customerId, req.user.labId);
    // Return JSON; frontend builds HTML from it
    res.json(cert);
  }

  @Get('instruments')
  instruments(@Request() req: any) {
    return this.portal.portalInstruments(req.user.customerId, req.user.labId);
  }

  @Post('complaints')
  submitComplaint(@Request() req: any, @Body() body: any) {
    return this.portal.submitComplaint(req.user.customerId, req.user.labId, body);
  }

  @Post('feedback')
  submitFeedback(@Request() req: any, @Body() body: any) {
    return this.portal.submitFeedback(req.user.customerId, req.user.labId, body);
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

  @Post('customers/:id/set-password')
  setPassword(@Param('id') id: string, @Request() req: any, @Body() body: { password: string }) {
    return this.portal.setPortalPassword(id, req.user.labId, body.password);
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
