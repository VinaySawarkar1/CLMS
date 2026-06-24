import {
  Body, Controller, Get, Injectable, Module, Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

const ITEM_KEY = (labId: string, id: string) => `inventory:${labId}:item:${id}`;
const ITEM_PREFIX = (labId: string) => `inventory:${labId}:item:`;

@Injectable()
class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertItem(labId: string, item: {
    id?: string; name: string; category: string; quantity: number; location?: string;
  }) {
    const id = item.id ?? randomUUID();
    const key = ITEM_KEY(labId, id);
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: { ...item, id, labId } },
      update: { value: { ...item, id, labId } },
    });
    return { ...item, id };
  }

  async list(labId: string, category?: string) {
    const rows = await this.prisma.setting.findMany({
      where: { key: { startsWith: ITEM_PREFIX(labId) } },
    });
    const items = rows.map((r) => r.value as any);
    return category ? items.filter((i: any) => i.category === category) : items;
  }

  async adjustStock(labId: string, id: string, delta: number) {
    const key = ITEM_KEY(labId, id);
    const row = await this.prisma.setting.findUnique({ where: { key } });
    const item = (row?.value as any) ?? null;
    if (!item) return null;
    item.quantity = (item.quantity ?? 0) + delta;
    await this.prisma.setting.update({ where: { key }, data: { value: item } });
    return item;
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('items')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  upsert(@Request() req: any, @Body() body: any) {
    return this.inventory.upsertItem(req.user.labId, body);
  }

  @Get('items')
  list(@Request() req: any, @Query('category') category?: string) {
    return this.inventory.list(req.user.labId, category);
  }

  @Patch('items/:id/stock')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  adjust(@Request() req: any, @Param('id') id: string, @Body('delta') delta: number) {
    return this.inventory.adjustStock(req.user.labId, id, delta);
  }
}

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
