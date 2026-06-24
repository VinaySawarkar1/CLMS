import {
  Controller, Get, Injectable, Module, Query, Request, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

@Injectable()
class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  query(labId: string | null, filters: { userId?: string; entity?: string; action?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(labId ? { labId } : {}),
        userId: filters.userId,
        entity: filters.entity,
        action: filters.action,
      },
      include: { user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  query(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    const labId = req.user.role === Role.SUPER_ADMIN ? null : req.user.labId;
    return this.audit.query(labId, { userId, entity, action });
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
