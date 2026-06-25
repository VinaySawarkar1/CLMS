import {
  Body, Controller, Get, Param, Patch, Post, Put, Query, Request, UseGuards,
} from '@nestjs/common';
import { LabStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { LabsService } from './labs.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('labs')
export class LabsController {
  constructor(private readonly labs: LabsService) {}

  // ── SUPER_ADMIN ────────────────────────────────────────────────────────────

  @Roles(Role.SUPER_ADMIN)
  @Get()
  findAll(@Query('status') status?: LabStatus) {
    return this.labs.findAll(status);
  }

  @Roles(Role.SUPER_ADMIN, Role.LAB_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const actorLabId = req.user.role === Role.SUPER_ADMIN ? null : req.user.labId;
    return this.labs.findOne(id, actorLabId);
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: LabStatus,
    @Request() req: any,
  ) {
    return this.labs.updateStatus(id, status, req.user.id);
  }

  // ── LAB_ADMIN (own lab) ────────────────────────────────────────────────────

  @Roles(Role.LAB_ADMIN)
  @Get(':id/permissions')
  getPermissions(@Param('id') id: string) {
    return this.labs.getPermissions(id);
  }

  @Roles(Role.LAB_ADMIN)
  @Get(':id/settings')
  getSettings(@Param('id') id: string) {
    return this.labs.getSettings(id);
  }

  @Roles(Role.LAB_ADMIN)
  @Patch(':id/settings')
  updateSettings(@Param('id') id: string, @Body() body: any) {
    return this.labs.updateSettings(id, body);
  }

  @Roles(Role.LAB_ADMIN)
  @Put(':id/permissions')
  savePermissions(
    @Param('id') id: string,
    @Body() matrix: { role: Role; permissionKey: string; granted: boolean }[],
  ) {
    return this.labs.savePermissions(id, matrix);
  }

  @Roles(Role.LAB_ADMIN, Role.SUPER_ADMIN)
  @Get(':id/users')
  getLabUsers(@Param('id') id: string) {
    return this.labs.getLabUsers(id);
  }

  @Roles(Role.LAB_ADMIN)
  @Post(':id/users')
  createLabUser(
    @Param('id') id: string,
    @Body() body: { email: string; fullName: string; password: string; role: Role },
  ) {
    return this.labs.createLabUser(id, body);
  }

  @Roles(Role.LAB_ADMIN)
  @Patch(':id/users/:userId/role')
  updateUserRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: Role,
  ) {
    return this.labs.updateUserRole(id, userId, role);
  }

  @Roles(Role.LAB_ADMIN)
  @Patch(':id/users/:userId/active')
  setUserActive(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.labs.setUserActive(id, userId, isActive);
  }

  // ── SUPER_ADMIN: reset any lab user's password ─────────────────────────────

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/users/:userId/reset-password')
  resetUserPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.labs.resetUserPassword(id, userId, newPassword);
  }

}
