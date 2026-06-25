import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { SeedService } from './seed.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('demo')
  @Roles(Role.LAB_ADMIN)
  seedDemo(@Request() req: any) {
    return this.seedService.seedDemo(req.user.labId);
  }
}
