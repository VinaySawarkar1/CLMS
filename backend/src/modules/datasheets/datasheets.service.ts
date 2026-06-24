import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { evaluate, FormulaContext } from '../../common/formula/formula-engine';
import {
  computeUncertainty,
  UncertaintyContributor,
} from '../../common/uncertainty/uncertainty-engine';
import { CreateDatasheetDto, RecalcDto } from './dto';

@Injectable()
export class DatasheetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDatasheetDto) {
    // New version = (max existing version for the job) + 1.
    const latest = await this.prisma.datasheet.findFirst({
      where: { jobId: dto.jobId },
      orderBy: { version: 'desc' },
    });
    return this.prisma.datasheet.create({
      data: {
        jobId: dto.jobId,
        templateName: dto.templateName,
        version: (latest?.version ?? 0) + 1,
        environmental: (dto.environmental ?? undefined) as Prisma.InputJsonValue | undefined,
        observations: dto.observations?.length
          ? {
              create: dto.observations.map((o) => ({
                pointLabel: o.pointLabel,
                unit: o.unit,
                nominal: o.nominal,
                standardValue: o.standardValue,
                observedValue: o.observedValue,
                data: (o.data ?? undefined) as Prisma.InputJsonValue | undefined,
              })),
            }
          : undefined,
      },
      include: { observations: true },
    });
  }

  async findOne(id: string) {
    const ds = await this.prisma.datasheet.findUnique({
      where: { id },
      include: { observations: true, uncertainty: { include: { parameters: true } } },
    });
    if (!ds) throw new NotFoundException('Datasheet not found');
    return ds;
  }

  /** Apply formula columns to every observation row using the formula engine. */
  async recalculate(id: string, dto: RecalcDto) {
    const ds = await this.findOne(id);
    for (const obs of ds.observations) {
      const ctx: FormulaContext = {
        nominal: obs.nominal ?? 0,
        standardValue: obs.standardValue ?? 0,
        observedValue: obs.observedValue ?? 0,
        correction: obs.correction ?? 0,
        error: obs.error ?? 0,
      };
      const updates: Record<string, number> = {};
      for (const [field, formula] of Object.entries(dto.formulas)) {
        updates[field] = evaluate(formula, ctx);
      }
      await this.prisma.observation.update({
        where: { id: obs.id },
        data: updates,
      });
    }
    return this.findOne(id);
  }

  /**
   * Compute calibration results from raw readings stored in each observation's
   * `data.readings`: mean (= observed value), correction (standard − observed),
   * error (observed − standard), and the Type-A repeatability standard
   * uncertainty uA = s / sqrt(n). Results are written back to each row.
   */
  async computeResults(id: string) {
    const ds = await this.findOne(id);
    for (const obs of ds.observations) {
      const data: any = (obs.data as any) ?? {};
      const readings: number[] = Array.isArray(data.readings)
        ? data.readings.map(Number).filter((n: number) => !Number.isNaN(n))
        : [];

      let observedValue = obs.observedValue ?? null;
      let uA = 0;
      if (readings.length) {
        const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
        observedValue = mean;
        if (readings.length > 1) {
          const variance =
            readings.reduce((a, b) => a + (b - mean) ** 2, 0) / (readings.length - 1);
          uA = Math.sqrt(variance) / Math.sqrt(readings.length);
        }
      }

      const standardValue = obs.standardValue ?? 0;
      const correction = observedValue == null ? null : standardValue - observedValue;
      const error = observedValue == null ? null : observedValue - standardValue;

      await this.prisma.observation.update({
        where: { id: obs.id },
        data: {
          observedValue,
          correction,
          error,
          data: { ...data, uA, mean: observedValue } as Prisma.InputJsonValue,
        },
      });
    }
    return this.findOne(id);
  }

  /** Compute and persist the uncertainty budget for a datasheet. */
  async computeBudget(id: string, contributors: UncertaintyContributor[]) {
    await this.findOne(id);
    const result = computeUncertainty(contributors);

    const budget = await this.prisma.uncertaintyBudget.upsert({
      where: { datasheetId: id },
      create: {
        datasheetId: id,
        combinedUncertainty: result.combinedUncertainty,
        coverageFactor: result.coverageFactor,
        expandedUncertainty: result.expandedUncertainty,
        confidenceLevel: result.confidenceLevel,
      },
      update: {
        combinedUncertainty: result.combinedUncertainty,
        coverageFactor: result.coverageFactor,
        expandedUncertainty: result.expandedUncertainty,
        confidenceLevel: result.confidenceLevel,
      },
    });

    // Replace parameter rows.
    await this.prisma.uncertaintyParameter.deleteMany({
      where: { budgetId: budget.id },
    });
    await this.prisma.uncertaintyParameter.createMany({
      data: contributors.map((c) => ({
        budgetId: budget.id,
        source: c.source,
        type: c.type,
        value: c.value,
        distribution: c.distribution,
        divisor: c.divisor,
        sensitivity: c.sensitivity ?? 1,
        degreesFreedom: c.degreesFreedom,
        unit: c.unit,
      })),
    });

    return { budget, result };
  }
}
