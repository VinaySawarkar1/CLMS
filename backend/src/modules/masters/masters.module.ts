import {
  Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type MasterInput = {
  name: string;
  idNumber: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  traceability?: string;
  certificateNumber?: string;
  uncertainty?: string;
  calibratedDate?: string;
  calibrationDue?: string;
  location?: string;
};

@Injectable()
class MastersService {
  constructor(private readonly prisma: PrismaService) {}

  list(labId: string) {
    return this.prisma.masterInstrument.findMany({
      where: { labId },
      orderBy: { calibrationDue: 'asc' },
    });
  }

  create(labId: string, data: MasterInput) {
    return this.prisma.masterInstrument.create({
      data: {
        labId,
        name: data.name,
        idNumber: data.idNumber,
        make: data.make,
        model: data.model,
        serialNumber: data.serialNumber,
        traceability: data.traceability,
        certificateNumber: data.certificateNumber,
        uncertainty: data.uncertainty,
        location: data.location,
        calibratedDate: data.calibratedDate ? new Date(data.calibratedDate) : null,
        calibrationDue: data.calibrationDue ? new Date(data.calibrationDue) : null,
      },
    });
  }

  async update(id: string, labId: string, data: Partial<MasterInput>) {
    const existing = await this.prisma.masterInstrument.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Reference standard not found');
    return this.prisma.masterInstrument.update({
      where: { id },
      data: {
        ...data,
        calibratedDate: data.calibratedDate ? new Date(data.calibratedDate) : undefined,
        calibrationDue: data.calibrationDue ? new Date(data.calibrationDue) : undefined,
      },
    });
  }

  async remove(id: string, labId: string) {
    const existing = await this.prisma.masterInstrument.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Reference standard not found');
    await this.prisma.masterInstrument.delete({ where: { id } });
    return { deleted: true };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('masters')
class MastersController {
  constructor(private readonly masters: MastersService) {}

  @Get()
  list(@Request() req: any) {
    return this.masters.list(req.user.labId);
  }

  @Post()
  create(@Request() req: any, @Body() body: MasterInput) {
    return this.masters.create(req.user.labId, body);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: Partial<MasterInput>) {
    return this.masters.update(id, req.user.labId, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.masters.remove(id, req.user.labId);
  }

  @Post('import')
  async bulkImport(@Request() req: any, @Body() body: { records: MasterInput[] }) {
    const results: any[] = [];
    for (const r of body.records) {
      try {
        results.push(await this.masters.create(req.user.labId, r));
      } catch (e: any) {
        results.push({ error: e?.message, input: r });
      }
    }
    return { imported: results.filter((r: any) => !r.error).length, errors: results.filter((r: any) => r.error) };
  }
}

@Module({
  controllers: [MastersController],
  providers: [MastersService],
})
export class MastersModule {}
