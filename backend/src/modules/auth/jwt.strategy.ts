import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  labId: string | null;
  sid?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) throw new UnauthorizedException();
    const valid = await this.authService.validateSession(payload.sub, payload.sid);
    if (!valid) throw new UnauthorizedException('SESSION_DISPLACED');
    return { id: payload.sub, email: payload.email, role: payload.role, labId: payload.labId ?? null };
  }
}
