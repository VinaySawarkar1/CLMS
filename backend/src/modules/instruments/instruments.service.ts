import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInstrumentDto } from './dto';

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInstrumentDto) {
    return this.prisma.instrument.create({ data: dto });
  }

  findAll(customerId?: string) {
    return this.prisma.instrument.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { id },
      include: { customer: true, discipline: true, category: true },
    });
    if (!instrument) throw new NotFoundException('Instrument not found');
    return instrument;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.instrument.delete({ where: { id } });
  }
}
