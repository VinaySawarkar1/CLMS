import {
  Body, Controller, Delete, Get, Injectable, Module, Param, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const DEFAULT_LIMITS = {
  temperature: { min: 18, max: 27 },
  humidity: { min: 30, max: 70 },
};

@Injectable()
class EnvironmentalService {
  constructor(private readonly prisma: PrismaService) {}

  async record(labId: string, data: {
    location: string; temperature?: number; humidity?: number; pressure?: number; operator?: string;
  }) {
    const record = await this.prisma.environmentalRecord.create({ data: { ...data, labId } });
    return { record, alerts: this.checkLimits(data) };
  }

  list(labId: string, location?: string) {
    return this.prisma.environmentalRecord.findMany({
      where: { labId, ...(location ? { location } : {}) },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
  }

  async remove(labId: string, id: string) {
    const rec = await this.prisma.environmentalRecord.findFirst({ where: { id, labId } });
    if (!rec) throw new NotFoundException('Record not found');
    return this.prisma.environmentalRecord.delete({ where: { id } });
  }

  async bulkRecord(labId: string, records: any[]) {
    const results = [];
    for (const r of records) {
      try {
        results.push(await this.record(labId, r));
      } catch (e: any) {
        results.push({ error: e?.message, input: r });
      }
    }
    return { imported: results.filter((r: any) => !r.error).length, errors: results.filter((r: any) => r.error) };
  }

  private checkLimits(d: { temperature?: number; humidity?: number }): string[] {
    const alerts: string[] = [];
    const { temperature: t, humidity: h } = DEFAULT_LIMITS;
    if (d.temperature !== undefined && (d.temperature < t.min || d.temperature > t.max)) {
      alerts.push(`Temperature ${d.temperature}°C outside ${t.min}–${t.max}°C`);
    }
    if (d.humidity !== undefined && (d.humidity < h.min || d.humidity > h.max)) {
      alerts.push(`Humidity ${d.humidity}% outside ${h.min}–${h.max}%`);
    }
    return alerts;
  }
}

@UseGuards(JwtAuthGuard)
@Controller('environmental')
class EnvironmentalController {
  constructor(private readonly environmental: EnvironmentalService) {}

  @Post()
  record(@Request() req: any, @Body() body: any) {
    return this.environmental.record(req.user.labId, body);
  }

  @Post('import')
  bulkImport(@Request() req: any, @Body() body: { records: any[] }) {
    return this.environmental.bulkRecord(req.user.labId, body.records);
  }

  @Get()
  list(@Request() req: any, @Query('location') location?: string) {
    return this.environmental.list(req.user.labId, location);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.environmental.remove(req.user.labId, id);
  }
}

@Module({
  controllers: [EnvironmentalController],
  providers: [EnvironmentalService],
})
export class EnvironmentalModule {}
