import {
  Controller,
  Get,
  Injectable,
  Module,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

/**
 * Read-only query API over the immutable audit trail. Audit rows are written by
 * the services that perform the actions; they are never updated or deleted.
 */
@Injectable()
class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  query(filters: { userId?: string; entity?: string; action?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
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
  @Roles(Role.SUPER_ADMIN, Role.QUALITY_MANAGER, Role.AUDITOR)
  query(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    return this.audit.query({ userId, entity, action });
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
