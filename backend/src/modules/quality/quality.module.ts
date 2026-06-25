import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

@Injectable()
class QualityService {
  constructor(private readonly prisma: PrismaService) {}

  async raiseNcr(labId: string, data: { description: string; raisedById?: string }) {
    return this.prisma.nCR.create({
      data: {
        labId,
        reference: `NCR/${new Date().getFullYear()}/${randomUUID().slice(0, 8)}`,
        description: data.description,
        raisedById: data.raisedById,
      },
    });
  }

  listNcr(labId: string) {
    return this.prisma.nCR.findMany({
      where: { labId },
      include: { capa: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCapa(
    ncrId: string,
    data: { rootCause?: string; correctiveAction?: string; preventiveAction?: string },
  ) {
    const ncr = await this.prisma.nCR.findUnique({ where: { id: ncrId } });
    if (!ncr) throw new NotFoundException('NCR not found');
    return this.prisma.cAPA.upsert({
      where: { ncrId },
      create: { ncrId, ...data },
      update: data,
    });
  }

  closeNcr(ncrId: string) {
    return this.prisma.nCR.update({ where: { id: ncrId }, data: { status: 'CLOSED' } });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality')
class QualityController {
  constructor(private readonly quality: QualityService) {}

  @Post('ncr')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER)
  raise(@Request() req: any, @Body() body: any) {
    return this.quality.raiseNcr(req.user.labId, { ...body, raisedById: req.user.id });
  }

  @Get('ncr')
  list(@Request() req: any) {
    return this.quality.listNcr(req.user.labId);
  }

  @Post('ncr/:id/capa')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  addCapa(@Param('id') id: string, @Body() body: any) {
    return this.quality.addCapa(id, body);
  }

  @Patch('ncr/:id/close')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  close(@Param('id') id: string) {
    return this.quality.closeNcr(id);
  }
}

@Module({
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
