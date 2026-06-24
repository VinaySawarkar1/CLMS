import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInstrumentDto } from './dto';

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(labId: string, dto: CreateInstrumentDto) {
    return this.prisma.instrument.create({ data: { ...dto, labId } });
  }

  findAll(labId: string, customerId?: string) {
    return this.prisma.instrument.findMany({
      where: { labId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const instrument = await this.prisma.instrument.findFirst({
      where: { id, labId },
      include: { customer: true, discipline: true, category: true },
    });
    if (!instrument) throw new NotFoundException('Instrument not found');
    return instrument;
  }

  async remove(id: string, labId: string) {
    await this.findOne(id, labId);
    return this.prisma.instrument.delete({ where: { id } });
  }
}
