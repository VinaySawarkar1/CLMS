import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Simple in-memory rate limiter: tracks login attempts per IP
const ipLoginMap = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipLoginMap.entries()) {
    if (now > entry.resetAt) ipLoginMap.delete(ip);
  }
}, 10 * 60 * 1000);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Check IP-based rate limit. Returns true if blocked. */
  checkIpRateLimit(ip: string): boolean {
    const now = Date.now();
    const window = 60_000; // 1 minute window
    const maxPerWindow = 10; // 10 login attempts per IP per minute

    let entry = ipLoginMap.get(ip);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + window };
      ipLoginMap.set(ip, entry);
    }
    entry.count++;
    return entry.count > maxPerWindow;
  }

  /** Internal: create a user (SUPER_ADMIN use only via controller guard) */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role ?? 'DATA_ENTRY_OPERATOR',
        labId: dto.labId ?? null,
      },
    });
    await this.audit(user.id, user.labId, 'USER_REGISTERED', 'User', user.id);
    return this.issueTokens(user.id, user.email, user.role, user.labId);
  }

  async login(dto: LoginDto, ip?: string) {
    // IP-level rate limit
    if (ip && this.checkIpRateLimit(ip)) {
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { lab: { select: { status: true, name: true } } },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`
      );
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      const attempts = user.failedLoginAttempts + 1;
      const lockData: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        lockData.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: lockData });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset lockout on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Non-SUPER_ADMIN users must belong to an APPROVED lab
    if (user.role !== Role.SUPER_ADMIN) {
      if (!user.lab) throw new ForbiddenException('User has no lab assigned');
      if (user.lab.status === 'PENDING') {
        throw new ForbiddenException('Lab registration is pending approval');
      }
      if (user.lab.status === 'REJECTED') {
        throw new ForbiddenException('Lab registration was rejected');
      }
      if (user.lab.status === 'SUSPENDED') {
        throw new ForbiddenException('Lab account is suspended. Contact platform support.');
      }
    }

    await this.audit(user.id, user.labId, 'LOGIN', 'User', user.id);
    // Revoke all existing refresh tokens so old devices can't re-authenticate
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user.id, user.email, user.role, user.labId);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentSessionToken: null },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit(userId, null, 'LOGOUT', 'User', userId);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: any; labId: string | null; sid?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hash(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash },
    });

    // Token reuse detection: if already revoked, nuke ALL sessions (possible theft)
    if (stored && stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revokedAt: new Date() },
      });
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { currentSessionToken: null },
      });
      await this.audit(payload.sub, null, 'TOKEN_REUSE_DETECTED', 'User', payload.sub);
      throw new UnauthorizedException('TOKEN_REUSE_DETECTED');
    }

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Verify the session token in the refresh token still matches DB
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { currentSessionToken: true },
    });
    if (!user || user.currentSessionToken !== (payload.sid ?? null)) {
      throw new UnauthorizedException('SESSION_DISPLACED');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(payload.sub, payload.email, payload.role, payload.labId);
  }

  async validateSession(userId: string, sessionToken: string | undefined): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentSessionToken: true, isActive: true },
    });
    if (!user || !user.isActive) return false;
    return user.currentSessionToken === (sessionToken ?? null);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true,
        labId: true,
        lab: { select: { id: true, name: true, status: true, accreditationNumber: true, plan: true, maxUsers: true, planExpiresAt: true } },
      },
    });
    if (!user) throw new UnauthorizedException();

    let permissions: string[] = [];
    if (user.role === Role.SUPER_ADMIN) {
      permissions = ['*'];
    } else if (user.labId) {
      const perms = await this.prisma.labRolePermission.findMany({
        where: { labId: user.labId, role: user.role, granted: true },
        select: { permissionKey: true },
      });
      if (user.role === Role.LAB_ADMIN) {
        permissions = ['*'];
      } else {
        permissions = perms.map((p) => p.permissionKey);
      }
    }

    return { ...user, permissions };
  }

  private async issueTokens(sub: string, email: string, role: any, labId: string | null) {
    const sid = randomUUID();
    await this.prisma.user.update({
      where: { id: sub },
      data: { currentSessionToken: sid },
    });

    const payload = { sub, email, role, labId, sid };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
      expiresIn: process.env.JWT_ACCESS_TTL || '8h',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_TTL || '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { userId: sub, tokenHash: this.hash(refreshToken), expiresAt },
    });

    return { accessToken, refreshToken, user: { id: sub, email, role, labId } };
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  async audit(userId: string | null, labId: string | null, action: string, entity: string, entityId: string) {
    await this.prisma.auditLog.create({
      data: { userId, labId, action, entity, entityId },
    });
  }
}
