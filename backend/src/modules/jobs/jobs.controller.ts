import {
  Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { JobStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { JobsService } from './jobs.service';
import { AssignEngineerDto, CreateJobDto, UpdateStatusDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() dto: CreateJobDto) {
    return this.jobs.create(req.user.labId, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query('status') status?: JobStatus) {
    return this.jobs.findAll(req.user.labId, status);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.jobs.findOne(id, req.user.labId);
  }

  @Patch(':id/assign')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  assign(@Request() req: any, @Param('id') id: string, @Body() dto: AssignEngineerDto) {
    return this.jobs.assignEngineer(id, req.user.labId, dto.engineerId);
  }

  @Patch(':id/status')
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.jobs.updateStatus(id, req.user.labId, dto.status);
  }
}
