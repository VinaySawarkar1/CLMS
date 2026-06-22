import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';

/** Non-Conformance Reports (NCR) and their Corrective/Preventive Actions (CAPA). */
@Injectable()
class QualityService {
  constructor(private readonly prisma: PrismaService) {}

  async raiseNcr(data: { description: string; raisedById?: string }) {
    return this.prisma.nCR.create({
      data: {
        reference: `NCR/${new Date().getFullYear()}/${randomUUID().slice(0, 8)}`,
        description: data.description,
        raisedById: data.raisedById,
      },
    });
  }

  listNcr() {
    return this.prisma.nCR.findMany({
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
    return this.prisma.nCR.update({
      where: { id: ncrId },
      data: { status: 'CLOSED' },
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality')
class QualityController {
  constructor(private readonly quality: QualityService) {}

  @Post('ncr')
  @Roles(Role.SUPER_ADMIN, Role.QUALITY_MANAGER, Role.AUDITOR, Role.REVIEWER)
  raise(@Body() body: any) {
    return this.quality.raiseNcr(body);
  }

  @Get('ncr')
  list() {
    return this.quality.listNcr();
  }

  @Post('ncr/:id/capa')
  @Roles(Role.SUPER_ADMIN, Role.QUALITY_MANAGER)
  addCapa(@Param('id') id: string, @Body() body: any) {
    return this.quality.addCapa(id, body);
  }

  @Patch('ncr/:id/close')
  @Roles(Role.SUPER_ADMIN, Role.QUALITY_MANAGER)
  close(@Param('id') id: string) {
    return this.quality.closeNcr(id);
  }
}

@Module({
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
