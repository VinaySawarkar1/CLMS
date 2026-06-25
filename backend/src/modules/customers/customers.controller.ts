import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.customers.create(req.user.labId, dto);
  }

  @Post('import')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  bulkImport(@Request() req: any, @Body() body: { records: CreateCustomerDto[] }) {
    return this.customers.bulkCreate(req.user.labId, body.records);
  }

  @Get()
  findAll(@Request() req: any, @Query('search') search?: string) {
    return this.customers.findAll(req.user.labId, search);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customers.findOne(id, req.user.labId);
  }

  @Patch(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.DATA_ENTRY_OPERATOR)
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, req.user.labId, dto);
  }

  @Delete(':id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.customers.remove(id, req.user.labId);
  }
}
