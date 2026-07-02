import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Module 14 — Audit Trail.
 * Logs every state-changing request (POST/PATCH/PUT/DELETE) to AuditLog with
 * the acting user, module, action, IP address, and the request payload as the
 * "new value". Read requests are ignored. Failures never block the request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
  private static readonly SENSITIVE = ['password', 'newPassword', 'passwordHash', 'token', 'refreshToken', 'accessToken', 'fileBase64', 'fileData'];

  /** Strip sensitive / bulky fields before persisting the payload. */
  private sanitize(value: any): any {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((v) => this.sanitize(v));
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (AuditInterceptor.SENSITIVE.includes(k)) out[k] = '***';
      else if (typeof v === 'string' && v.length > 2000) out[k] = `${v.slice(0, 200)}…[truncated]`;
      else out[k] = this.sanitize(v);
    }
    return out;
  }

  /** Derive a module name from the first path segment (after /api). */
  private moduleFor(path: string): string {
    const parts = path.replace(/^\/?(api\/)?/, '').split('/').filter(Boolean);
    return parts[0] ?? 'root';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req?.method ?? 'GET';

    if (!AuditInterceptor.MUTATING.has(method)) return next.handle();

    const user = req.user;
    const path: string = req.originalUrl?.split('?')[0] ?? req.url ?? '';
    const module = this.moduleFor(path);
    // Skip auth endpoints so we never record credentials.
    if (module === 'auth') return next.handle();

    const ip =
      (req.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim()) ||
      req.ip || req.socket?.remoteAddress || null;
    const entityId = req.params?.id ?? null;
    const newValue = this.sanitize(req.body);

    return next.handle().pipe(
      tap({
        next: () => this.write(user, module, method, path, entityId, ip, newValue),
        error: () => this.write(user, module, method, path, entityId, ip, newValue, true),
      }),
    );
  }

  private write(
    user: any, module: string, method: string, path: string,
    entityId: string | null, ip: string | null, newValue: any, failed = false,
  ) {
    // Fire-and-forget; audit must never break the request.
    this.prisma.auditLog
      .create({
        data: {
          labId: user?.labId ?? null,
          userId: user?.id ?? null,
          action: `${method}${failed ? ' (FAILED)' : ''}`,
          entity: module,
          entityId,
          metadata: { path, ip, newValue, failed },
        },
      })
      .catch(() => undefined);
  }
}
