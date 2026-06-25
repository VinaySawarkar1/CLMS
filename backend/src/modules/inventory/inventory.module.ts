import {
  Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query, Request, UseGuards,
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

  async deleteItem(labId: string, id: string) {
    const key = ITEM_KEY(labId, id);
    return this.prisma.setting.delete({ where: { key } });
  }

  async bulkUpsert(labId: string, items: any[]) {
    const results = [];
    for (const item of items) {
      try {
        results.push(await this.upsertItem(labId, item));
      } catch (e: any) {
        results.push({ error: e?.message, input: item });
      }
    }
    return { imported: results.filter((r: any) => !r.error).length, errors: results.filter((r: any) => r.error) };
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

  @Delete('items/:id')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.inventory.deleteItem(req.user.labId, id);
  }

  @Post('items/import')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  bulkImport(@Request() req: any, @Body() body: { records: any[] }) {
    return this.inventory.bulkUpsert(req.user.labId, body.records);
  }
}

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
