import {
  Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { JobStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { JobsService } from './jobs.service';
import { AssignEngineerDto, CreateJobDto, CreateJobBatchDto, UpdateStatusDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() dto: CreateJobDto) {
    return this.jobs.create(req.user.labId, dto);
  }

  /** Multi-instrument intake: one customer → one batch → a job per instrument. */
  @Post('batch')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  createBatch(@Request() req: any, @Body() dto: CreateJobBatchDto) {
    return this.jobs.createBatch(req.user.labId, dto);
  }

  @Get('batches')
  listBatches(@Request() req: any, @Query('customerId') customerId?: string) {
    return this.jobs.listBatches(req.user.labId, customerId);
  }

  @Get('batches/:id')
  getBatch(@Request() req: any, @Param('id') id: string) {
    return this.jobs.getBatch(id, req.user.labId);
  }

  @Get()
  findAll(@Request() req: any, @Query('status') status?: JobStatus) {
    return this.jobs.findAll(req.user.labId, status, { id: req.user.id, role: req.user.role });
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

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.jobs.updateJob(id, req.user.labId, body);
  }
}
