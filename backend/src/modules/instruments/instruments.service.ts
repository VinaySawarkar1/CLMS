import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInstrumentDto, UpdateInstrumentDto } from './dto';

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enforce that an instrument ID number is unique per customer, so one
   * customer can register many instruments (different types, or the same type
   * with distinct IDs) while different customers may reuse the same ID. Empty
   * IDs are not constrained.
   */
  private async assertUniqueIdNumber(
    labId: string,
    customerId: string,
    idNumber?: string | null,
    excludeId?: string,
  ) {
    const id = (idNumber ?? '').trim();
    if (!id) return;
    const clash = await this.prisma.instrument.findFirst({
      where: { labId, customerId, idNumber: id, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (clash) {
      throw new BadRequestException(`This customer already has an instrument with ID "${id}"`);
    }
  }

  async create(labId: string, dto: CreateInstrumentDto) {
    const { lastCalibrationDate, calibrationIntervalMonths, ...rest } = dto;
    await this.assertUniqueIdNumber(labId, dto.customerId, dto.idNumber);
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
      include: { customer: { select: { id: true, name: true, code: true } } },
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

  async update(id: string, labId: string, dto: UpdateInstrumentDto) {
    const existing = await this.findOne(id, labId);
    if (dto.idNumber !== undefined || dto.customerId !== undefined) {
      await this.assertUniqueIdNumber(
        labId,
        dto.customerId ?? existing.customerId,
        dto.idNumber ?? existing.idNumber,
        id,
      );
    }
    const { lastCalibrationDate, calibrationIntervalMonths, ...rest } = dto;
    const last = lastCalibrationDate ? new Date(lastCalibrationDate) : undefined;
    const nextDueDate = last !== undefined
      ? this.computeNextDue(last, calibrationIntervalMonths)
      : undefined;
    return this.prisma.instrument.update({
      where: { id },
      data: {
        ...rest,
        ...(calibrationIntervalMonths !== undefined ? { calibrationIntervalMonths } : {}),
        ...(last !== undefined ? { lastCalibrationDate: last } : {}),
        ...(nextDueDate !== undefined ? { nextDueDate } : {}),
      },
    });
  }

  async bulkCreate(labId: string, records: CreateInstrumentDto[]) {
    const results: any[] = [];
    for (const dto of records) {
      try {
        results.push(await this.create(labId, dto));
      } catch (e: any) {
        results.push({ error: e?.message, input: dto });
      }
    }
    return { imported: results.filter((r: any) => !r.error).length, errors: results.filter((r: any) => r.error) };
  }

  async remove(id: string, labId: string) {
    await this.findOne(id, labId);
    return this.prisma.instrument.delete({ where: { id } });
  }
}
