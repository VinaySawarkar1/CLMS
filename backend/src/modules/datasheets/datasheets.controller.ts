import { Body, Controller, Get, Header, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { DatasheetsService } from './datasheets.service';
import { CreateDatasheetDto, RecalcDto } from './dto';
import { UncertaintyContributor } from '../../common/uncertainty/uncertainty-engine';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('datasheets')
export class DatasheetsController {
  constructor(private readonly datasheets: DatasheetsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.CALIBRATION_ENGINEER, Role.DATA_ENTRY_OPERATOR)
  create(@Body() dto: CreateDatasheetDto) {
    return this.datasheets.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasheets.findOne(id);
  }

  @Get(':id/report')
  @Header('Content-Type', 'text/html')
  report(@Param('id') id: string) {
    return this.datasheets.buildReport(id);
  }

  @Post(':id/recalculate')
  @Roles(Role.SUPER_ADMIN, Role.CALIBRATION_ENGINEER, Role.DATA_ENTRY_OPERATOR)
  recalculate(@Param('id') id: string, @Body() dto: RecalcDto) {
    return this.datasheets.recalculate(id, dto);
  }

  @Post(':id/compute')
  @Roles(Role.SUPER_ADMIN, Role.CALIBRATION_ENGINEER, Role.DATA_ENTRY_OPERATOR)
  compute(@Param('id') id: string) {
    return this.datasheets.computeResults(id);
  }

  @Post(':id/uncertainty')
  @Roles(Role.SUPER_ADMIN, Role.CALIBRATION_ENGINEER, Role.TECHNICAL_MANAGER)
  computeUncertainty(
    @Param('id') id: string,
    @Body('contributors') contributors: UncertaintyContributor[],
  ) {
    return this.datasheets.computeBudget(id, contributors);
  }

  @Post(':id/auto-uncertainty')
  @Roles(Role.SUPER_ADMIN, Role.CALIBRATION_ENGINEER, Role.TECHNICAL_MANAGER)
  autoUncertainty(@Param('id') id: string) {
    return this.datasheets.autoUncertainty(id);
  }
}
