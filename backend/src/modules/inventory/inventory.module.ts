import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

/**
 * Inventory of standards, fixtures, accessories and consumables.
 * Items and stock movements are stored in the Setting-backed key space until a
 * dedicated table group is migrated; this keeps the API stable for the UI.
 */
const ITEM_KEY = (id: string) => `inventory:item:${id}`;

@Injectable()
class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertItem(item: {
    id?: string;
    name: string;
    category: string; // STANDARD | FIXTURE | ACCESSORY | CONSUMABLE
    quantity: number;
    location?: string;
  }) {
    const id = item.id ?? randomUUID();
    await this.prisma.setting.upsert({
      where: { key: ITEM_KEY(id) },
      create: { key: ITEM_KEY(id), value: { ...item, id } },
      update: { value: { ...item, id } },
    });
    return { ...item, id };
  }

  async list(category?: string) {
    const rows = await this.prisma.setting.findMany({
      where: { key: { startsWith: 'inventory:item:' } },
    });
    const items = rows.map((r) => r.value as any);
    return category ? items.filter((i) => i.category === category) : items;
  }

  async adjustStock(id: string, delta: number) {
    const row = await this.prisma.setting.findUnique({
      where: { key: ITEM_KEY(id) },
    });
    const item = (row?.value as any) ?? null;
    if (!item) return null;
    item.quantity = (item.quantity ?? 0) + delta;
    await this.prisma.setting.update({
      where: { key: ITEM_KEY(id) },
      data: { value: item },
    });
    return item;
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('items')
  @Roles(Role.SUPER_ADMIN, Role.STORE_MANAGER)
  upsert(@Body() body: any) {
    return this.inventory.upsertItem(body);
  }

  @Get('items')
  list(@Query('category') category?: string) {
    return this.inventory.list(category);
  }

  @Patch('items/:id/stock')
  @Roles(Role.SUPER_ADMIN, Role.STORE_MANAGER)
  adjust(@Param('id') id: string, @Body('delta') delta: number) {
    return this.inventory.adjustStock(id, delta);
  }
}

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
