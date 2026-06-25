import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto, UpdateInstrumentDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instruments: InstrumentsService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() dto: CreateInstrumentDto) {
    return this.instruments.create(req.user.labId, dto);
  }

  @Post('import')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  bulkImport(@Request() req: any, @Body() body: { records: CreateInstrumentDto[] }) {
    return this.instruments.bulkCreate(req.user.labId, body.records);
  }

  @Get()
  findAll(@Request() req: any, @Query('customerId') customerId?: string) {
    return this.instruments.findAll(req.user.labId, customerId);
  }

  @Get('due/recall')
  dueForRecall(@Request() req: any, @Query('days') days?: string) {
    return this.instruments.dueForRecall(req.user.labId, days ? Number(days) : 30);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.instruments.findOne(id, req.user.labId);
  }

  @Patch(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateInstrumentDto) {
    return this.instruments.update(id, req.user.labId, dto);
  }

  @Delete(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.instruments.remove(id, req.user.labId);
  }
}
