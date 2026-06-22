import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instruments: InstrumentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DATA_ENTRY_OPERATOR, Role.STORE_MANAGER)
  create(@Body() dto: CreateInstrumentDto) {
    return this.instruments.create(dto);
  }

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.instruments.findAll(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instruments.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.instruments.remove(id);
  }
}
