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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { lab: { select: { status: true, name: true } } },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

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
    // Clear session token → invalidates all outstanding access tokens immediately
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentSessionToken: null },
    });
    // Revoke all refresh tokens
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
      where: { userId: payload.sub, tokenHash, revokedAt: null },
    });
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

  /** Validate that the session token in a JWT still matches the DB record.
   *  Called by JwtStrategy on every request — O(1) DB lookup by primary key. */
  async validateSession(userId: string, sessionToken: string | undefined): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentSessionToken: true, isActive: true },
    });
    if (!user || !user.isActive) return false;
    return user.currentSessionToken === (sessionToken ?? null);
  }

  /** Get full user profile with lab permissions */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true,
        labId: true,
        lab: { select: { id: true, name: true, status: true, accreditationNumber: true } },
      },
    });
    if (!user) throw new UnauthorizedException();

    // Fetch permissions for this role+lab
    let permissions: string[] = [];
    if (user.role === Role.SUPER_ADMIN) {
      permissions = ['*']; // super admin gets everything
    } else if (user.labId) {
      const perms = await this.prisma.labRolePermission.findMany({
        where: { labId: user.labId, role: user.role, granted: true },
        select: { permissionKey: true },
      });
      // LAB_ADMIN always has all permissions within their lab
      if (user.role === Role.LAB_ADMIN) {
        permissions = ['*'];
      } else {
        permissions = perms.map((p) => p.permissionKey);
      }
    }

    return { ...user, permissions };
  }

  private async issueTokens(sub: string, email: string, role: any, labId: string | null) {
    // Generate a fresh session token — this invalidates any previously issued JWTs
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
