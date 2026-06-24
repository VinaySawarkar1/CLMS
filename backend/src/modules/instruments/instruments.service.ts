import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInstrumentDto } from './dto';

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(labId: string, dto: CreateInstrumentDto) {
    const { lastCalibrationDate, calibrationIntervalMonths, ...rest } = dto;
    const last = lastCalibrationDate ? new Date(lastCalibrationDate) : null;
    const nextDueDate = this.computeNextDue(last, calibrationIntervalMonths);
    return this.prisma.instrument.create({
      data: {
        ...rest,
        labId,
        calibrationIntervalMonths: calibrationIntervalMonths ?? null,
        lastCalibrationDate: last,
        nextDueDate,
      },
    });
  }

  private computeNextDue(last: Date | null, intervalMonths?: number | null): Date | null {
    if (!last || !intervalMonths) return null;
    const due = new Date(last);
    due.setMonth(due.getMonth() + intervalMonths);
    return due;
  }

  findAll(labId: string, customerId?: string) {
    return this.prisma.instrument.findMany({
      where: { labId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Instruments due for calibration within `days` (default 30) or already overdue. */
  async dueForRecall(labId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.prisma.instrument.findMany({
      where: { labId, nextDueDate: { not: null, lte: cutoff } },
      include: { customer: { select: { name: true, email: true, code: true } } },
      orderBy: { nextDueDate: 'asc' },
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
