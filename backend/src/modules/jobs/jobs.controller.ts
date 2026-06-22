import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
  @Roles(Role.SUPER_ADMIN, Role.DATA_ENTRY_OPERATOR, Role.STORE_MANAGER)
  create(@Body() dto: CreateJobDto) {
    return this.jobs.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: JobStatus) {
    return this.jobs.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @Patch(':id/assign')
  @Roles(Role.SUPER_ADMIN, Role.TECHNICAL_MANAGER, Role.QUALITY_MANAGER)
  assign(@Param('id') id: string, @Body() dto: AssignEngineerDto) {
    return this.jobs.assignEngineer(id, dto.engineerId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.jobs.updateStatus(id, dto.status);
  }
}
