import { Body, Controller, Get, Injectable, Post, UseGuards } from '@nestjs/common';
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

  /**
   * Create an engineer. If no userId is given, a backing user account is
   * created automatically (role CALIBRATION_ENGINEER) from the supplied name.
   */
  async create(data: {
    userId?: string;
    fullName?: string;
    email?: string;
    employeeCode: string;
    skills?: string[];
    authorizations?: string[];
  }) {
    let userId = data.userId;
    if (!userId) {
      const email = data.email || `${data.employeeCode.toLowerCase()}@clms.local`;
      const passwordHash = await bcrypt.hash(randomBytes(6).toString('hex'), 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: data.fullName || data.employeeCode,
          role: Role.CALIBRATION_ENGINEER,
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
      include: { user: { select: { fullName: true, email: true } } },
    });
  }

  findAll() {
    return this.prisma.engineer.findMany({
      include: { user: { select: { fullName: true, email: true } } },
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('engineers')
class EngineersController {
  constructor(private readonly engineers: EngineersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TECHNICAL_MANAGER)
  create(@Body() body: any) {
    return this.engineers.create(body);
  }

  @Get()
  findAll() {
    return this.engineers.findAll();
  }
}

@Module({
  controllers: [EngineersController],
  providers: [EngineersService],
})
export class EngineersModule {}
