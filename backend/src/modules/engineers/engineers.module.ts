import { Body, Controller, Get, Injectable, Post, UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

@Injectable()
class EngineersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: string;
    employeeCode: string;
    skills?: string[];
    authorizations?: string[];
  }) {
    return this.prisma.engineer.create({
      data: {
        userId: data.userId,
        employeeCode: data.employeeCode,
        skills: data.skills ?? [],
        authorizations: data.authorizations ?? [],
      },
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
