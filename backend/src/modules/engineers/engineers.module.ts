import { Body, Controller, Get, Injectable, Post, Request, UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

@Injectable()
class EngineersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(labId: string, data: {
    userId?: string; fullName?: string; email?: string; password?: string; role?: Role;
    employeeCode: string; skills?: string[]; authorizations?: string[];
  }) {
    let userId = data.userId;
    if (!userId) {
      const email = data.email || `${data.employeeCode.toLowerCase()}@clms.local`;
      // Use the admin-provided password so the engineer can log in; otherwise
      // generate a random one (admin can set it later via reset-password).
      const passwordHash = await bcrypt.hash(data.password || randomBytes(6).toString('hex'), 10);
      const role = data.role === Role.SERVICE_ENGINEER ? Role.SERVICE_ENGINEER : Role.CALIBRATION_ENGINEER;
      const user = await this.prisma.user.create({
        data: {
          email, passwordHash,
          fullName: data.fullName || data.employeeCode,
          role,
          labId,
        },
      });
      userId = user.id;
    }
    return this.prisma.engineer.create({
      data: {
        userId,
        employeeCode: data.employeeCode,
        skills: data.skills ?? [],
        authorizations: data.authorizations ?? [],
      },
      include: { user: { select: { fullName: true, email: true, labId: true } } },
    });
  }

  findAll(labId: string) {
    return this.prisma.engineer.findMany({
      where: { user: { labId } },
      include: { user: { select: { fullName: true, email: true } } },
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('engineers')
class EngineersController {
  constructor(private readonly engineers: EngineersService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  create(@Request() req: any, @Body() body: any) {
    return this.engineers.create(req.user.labId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.engineers.findAll(req.user.labId);
  }
}

@Module({
  controllers: [EngineersController],
  providers: [EngineersService],
})
export class EngineersModule {}
