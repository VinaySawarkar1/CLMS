import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN)
  findAll(@Request() req: any) {
    const labId = req.user.role === Role.SUPER_ADMIN ? undefined : req.user.labId;
    return this.users.findAll(labId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id/role')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN)
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.users.updateRole(id, role);
  }

  @Patch(':id/active')
  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN)
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.users.setActive(id, isActive);
  }
}
