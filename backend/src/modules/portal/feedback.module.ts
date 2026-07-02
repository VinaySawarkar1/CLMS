import {
  BadRequestException, Body, Controller, Get, Injectable, Module, Post, Request, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type FeedbackInput = {
  customerId?: string;
  jobId?: string;
  serviceRating: number;
  qualityRating: number;
  tatRating: number;
  supportRating: number;
  comments?: string;
};

const RATING_FIELDS = ['serviceRating', 'qualityRating', 'tatRating', 'supportRating'] as const;

@Injectable()
class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  list(labId: string) {
    return this.prisma.customerFeedback.findMany({
      where: { labId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async summary(labId: string) {
    const agg = await this.prisma.customerFeedback.aggregate({
      where: { labId },
      _avg: {
        serviceRating: true,
        qualityRating: true,
        tatRating: true,
        supportRating: true,
      },
      _count: true,
    });

    const avgService = agg._avg.serviceRating ?? 0;
    const avgQuality = agg._avg.qualityRating ?? 0;
    const avgTat = agg._avg.tatRating ?? 0;
    const avgSupport = agg._avg.supportRating ?? 0;
    const avgOverall = (avgService + avgQuality + avgTat + avgSupport) / 4;

    return {
      avgService,
      avgQuality,
      avgTat,
      avgSupport,
      avgOverall,
      total: agg._count,
    };
  }

  create(labId: string, data: FeedbackInput) {
    for (const field of RATING_FIELDS) {
      const value = data[field];
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new BadRequestException(`${field} must be an integer between 1 and 5`);
      }
    }

    return this.prisma.customerFeedback.create({
      data: {
        labId,
        customerId: data.customerId,
        jobId: data.jobId,
        serviceRating: data.serviceRating,
        qualityRating: data.qualityRating,
        tatRating: data.tatRating,
        supportRating: data.supportRating,
        comments: data.comments,
      },
    });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('feedback')
class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get()
  list(@Request() req: any) {
    return this.feedback.list(req.user.labId);
  }

  @Get('summary')
  summary(@Request() req: any) {
    return this.feedback.summary(req.user.labId);
  }

  @Post()
  create(@Request() req: any, @Body() body: FeedbackInput) {
    return this.feedback.create(req.user.labId, body);
  }
}

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
