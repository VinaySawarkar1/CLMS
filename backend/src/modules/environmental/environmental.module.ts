import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Acceptable environmental limits per location (override via Settings). */
const DEFAULT_LIMITS = {
  temperature: { min: 18, max: 27 },
  humidity: { min: 30, max: 70 },
};

@Injectable()
class EnvironmentalService {
  constructor(private readonly prisma: PrismaService) {}

  async record(data: {
    location: string;
    temperature?: number;
    humidity?: number;
    pressure?: number;
    operator?: string;
  }) {
    const record = await this.prisma.environmentalRecord.create({ data });
    return { record, alerts: this.checkLimits(data) };
  }

  list(location?: string) {
    return this.prisma.environmentalRecord.findMany({
      where: location ? { location } : undefined,
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
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
  record(@Body() body: any) {
    return this.environmental.record(body);
  }

  @Get()
  list(@Query('location') location?: string) {
    return this.environmental.list(location);
  }
}

@Module({
  controllers: [EnvironmentalController],
  providers: [EnvironmentalService],
})
export class EnvironmentalModule {}
