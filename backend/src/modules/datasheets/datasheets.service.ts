import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { evaluate, FormulaContext } from '../../common/formula/formula-engine';
import {
  computeUncertainty,
  UncertaintyContributor,
} from '../../common/uncertainty/uncertainty-engine';
import { computePoint } from '../../common/calculations/calc-engine';
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

  /** Update environmental conditions on an existing datasheet. */
  async updateEnvironmental(id: string, environmental: any) {
    await this.findOne(id);
    return this.prisma.datasheet.update({
      where: { id },
      data: { environmental },
      include: { observations: true, uncertainty: { include: { parameters: true } } },
    });
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
        try {
          updates[field] = evaluate(formula, ctx);
        } catch (err: any) {
          throw new BadRequestException(`Formula error in '${field}': ${err?.message}`);
        }
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
   * `data.readings`. For every point this derives and persists:
   *   - mean (= observed value)
   *   - standard deviation s (sample, n−1)
   *   - repeatability (range = max − min of the readings)
   *   - Type-A standard uncertainty uA = s / √n
   *   - correction (standard − observed) and error (observed − standard)
   *   - drift (current observed − observed for the same point in the previous
   *     datasheet version, if one exists)
   *   - Pass/Fail vs the maximum permissible error (data.mpe), when supplied
   * A datasheet-level summary (result + counts) is returned alongside the rows.
   */
  async computeResults(id: string) {
    const ds = await this.findOne(id);

    // Previous datasheet version for the same job → drift reference by point.
    const previous = await this.prisma.datasheet.findFirst({
      where: { jobId: ds.jobId, version: { lt: ds.version } },
      orderBy: { version: 'desc' },
      include: { observations: true },
    });
    const prevByPoint = new Map<string, number>();
    for (const p of previous?.observations ?? []) {
      if (p.pointLabel != null && p.observedValue != null) {
        prevByPoint.set(p.pointLabel, p.observedValue);
      }
    }

    let passCount = 0;
    let failCount = 0;
    let evaluated = 0;

    // Automatic corrections (Module 13): reference + environmental + instrument,
    // stored on the datasheet's environmental JSON as `corrections`.
    const corr: any = (ds.environmental as any)?.corrections ?? {};
    const appliedCorrection =
      (Number(corr.reference) || 0) +
      (Number(corr.environmental) || 0) +
      (Number(corr.instrument) || 0);

    for (const obs of ds.observations) {
      const data: any = (obs.data as any) ?? {};
      const readings: number[] = Array.isArray(data.readings)
        ? data.readings.map(Number).filter((n: number) => !Number.isNaN(n))
        : [];

      const previousObserved =
        obs.pointLabel != null && prevByPoint.has(obs.pointLabel)
          ? (prevByPoint.get(obs.pointLabel) as number)
          : null;

      const r = computePoint({
        readings,
        standardValue: obs.standardValue ?? 0,
        previousObserved,
        mpe: data.mpe,
        appliedCorrection,
      });

      // Fall back to any previously stored observed value when no readings.
      const observedValue = r.mean ?? obs.observedValue ?? null;

      if (r.result) {
        evaluated += 1;
        if (r.result === 'PASS') passCount += 1; else failCount += 1;
      }

      await this.prisma.observation.update({
        where: { id: obs.id },
        data: {
          observedValue,
          correction: r.correction,
          error: r.error,
          data: {
            ...data,
            mean: observedValue,
            stdDev: r.stdDev,
            repeatability: r.repeatability,
            uA: r.uA,
            drift: r.drift,
            result: r.result,
            appliedCorrection,
          } as Prisma.InputJsonValue,
        },
      });
    }

    const refreshed = await this.findOne(id);
    const overall = evaluated === 0 ? null : failCount === 0 ? 'PASS' : 'FAIL';
    return { ...refreshed, summary: { evaluated, passCount, failCount, overall } };
  }

  /** Auto-build GUM uncertainty budget from job references & instrument resolution. */
  async autoUncertainty(id: string) {
    const ds = await this.prisma.datasheet.findUnique({
      where: { id },
      include: {
        observations: true,
        job: {
          include: {
            instrument: true,
            references: { include: { master: true } },
          },
        },
      },
    });
    if (!ds) throw new NotFoundException('Datasheet not found');

    // Type A: max uA across all observations
    const maxUA = ds.observations.reduce((m, o) => {
      const uA = Number((o.data as any)?.uA ?? 0);
      return uA > m ? uA : m;
    }, 0);

    // Type B 1: reference standard uncertainty (parse numeric from e.g. "±0.10 µm")
    let refUncertainty = 0;
    const ref = ds.job.references[0]?.master;
    if (ref?.uncertainty) {
      const match = ref.uncertainty.match(/[\d.]+/);
      if (match) refUncertainty = parseFloat(match[0]);
    }

    // Type B 2: resolution uncertainty = (leastCount/2) / sqrt(3)
    let resolutionUncertainty = 0;
    const lcStr = ds.job.instrument?.leastCount;
    if (lcStr) {
      const match = lcStr.match(/[\d.]+/);
      if (match) {
        const lc = parseFloat(match[0]);
        resolutionUncertainty = (lc / 2) / Math.sqrt(3);
      }
    }

    const unit = ds.observations[0]?.unit ?? '';
    const contributors: UncertaintyContributor[] = [
      { source: 'Repeatability (Type A)', type: 'A', value: maxUA, divisor: 1, sensitivity: 1, unit },
      { source: 'Reference standard uncertainty', type: 'B', value: refUncertainty, distribution: 'normal', divisor: 2, sensitivity: 1, unit },
      { source: 'Resolution of UUC', type: 'B', value: resolutionUncertainty, distribution: 'rectangular', divisor: 1, sensitivity: 1, unit },
    ];

    return this.computeBudget(id, contributors);
  }

  /** Build a printable HTML report for a datasheet. */
  async buildReport(id: string): Promise<string> {
    const ds = await this.prisma.datasheet.findUnique({
      where: { id },
      include: {
        observations: { orderBy: { id: 'asc' } },
        uncertainty: true,
        job: { include: { customer: true, instrument: true, lab: true, engineer: { include: { user: true } } } },
      },
    });
    if (!ds) throw new Error('Datasheet not found');

    const job = ds.job as any;
    const env = ds.environmental as any;
    const unc = ds.uncertainty as any;

    const obsRows = ds.observations.map((o) => {
      const d: any = (o.data as any) ?? {};
      const result: string | null = d.result ?? null;
      const resultCell = result
        ? `<td style="font-weight:bold;color:${result === 'PASS' ? '#237804' : '#a8071a'}">${result}</td>`
        : '<td>—</td>';
      return `
      <tr>
        <td>${o.pointLabel || '—'}</td>
        <td>${o.unit || '—'}</td>
        <td>${o.nominal ?? '—'}</td>
        <td>${o.standardValue ?? '—'}</td>
        <td>${o.observedValue != null ? Number(o.observedValue).toFixed(4) : '—'}</td>
        <td>${o.correction != null ? Number(o.correction).toFixed(4) : '—'}</td>
        <td>${o.error != null ? Number(o.error).toFixed(4) : '—'}</td>
        <td>${d.stdDev != null ? Number(d.stdDev).toExponential(3) : '—'}</td>
        <td>${d.repeatability != null ? Number(d.repeatability).toFixed(4) : '—'}</td>
        <td>${d.drift != null ? Number(d.drift).toFixed(4) : '—'}</td>
        <td>${d.uA != null ? Number(d.uA).toExponential(3) : '—'}</td>
        ${resultCell}
      </tr>`;
    }).join('');

    // Overall Pass/Fail summary across evaluated points.
    const evaluated = ds.observations.filter((o) => (o.data as any)?.result).length;
    const failed = ds.observations.filter((o) => (o.data as any)?.result === 'FAIL').length;
    const overallResult = evaluated === 0 ? null : failed === 0 ? 'PASS' : 'FAIL';
    const resultSummary = overallResult
      ? `<div class="env" style="background:${overallResult === 'PASS' ? '#f6ffed' : '#fff1f0'};border-color:${overallResult === 'PASS' ? '#b7eb8f' : '#ffa39e'}">
          <div class="env-item"><div class="env-label">Overall Result</div><div class="env-value" style="color:${overallResult === 'PASS' ? '#237804' : '#a8071a'}">${overallResult}</div></div>
          <div class="env-item"><div class="env-label">Points Evaluated</div><div class="env-value">${evaluated}</div></div>
          <div class="env-item"><div class="env-label">Failed</div><div class="env-value">${failed}</div></div>
        </div>` : '';

    const uncSection = unc ? `
      <div class="section">
        <h3>Uncertainty Budget (GUM)</h3>
        <table>
          <tr><th>Parameter</th><th>Value</th></tr>
          <tr><td>Combined Standard Uncertainty (u<sub>c</sub>)</td><td>${Number(unc.combinedUncertainty).toExponential(3)}</td></tr>
          <tr><td>Coverage Factor (k)</td><td>${Number(unc.coverageFactor).toFixed(2)}</td></tr>
          <tr><td>Expanded Uncertainty (U, ~95%)</td><td>±${Number(unc.expandedUncertainty).toExponential(3)}</td></tr>
          <tr><td>Confidence Level</td><td>${unc.confidenceLevel ?? '95'}%</td></tr>
        </table>
      </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Calibration Datasheet — ${ds.templateName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 24px 32px; }
    h1 { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: bold; text-align: center; color: #555; margin-bottom: 20px; }
    h3 { font-size: 13px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .header { border-bottom: 2px solid #1677ff; margin-bottom: 20px; padding-bottom: 12px; }
    .section { margin-bottom: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 16px; }
    .info-row { display: flex; gap: 8px; }
    .label { color: #888; min-width: 140px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f0f5ff; border: 1px solid #d0d7e3; padding: 6px 8px; text-align: left; font-weight: bold; }
    td { border: 1px solid #ddd; padding: 5px 8px; }
    tr:nth-child(even) td { background: #fafafa; }
    .env { background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 10px 16px; margin-bottom: 16px; display: flex; gap: 32px; }
    .env-item { }
    .env-label { font-size: 11px; color: #666; }
    .env-value { font-weight: bold; font-size: 13px; }
    .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 11px; color: #888; text-align: center; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${job.lab?.name || 'Calibration Laboratory'}</h1>
    <h2>Calibration Datasheet — ${ds.templateName} (v${ds.version})</h2>
  </div>

  <div class="section">
    <h3>Job Information</h3>
    <div class="info-grid">
      <div class="info-row"><span class="label">Job Number:</span><strong>${job.jobNumber}</strong></div>
      <div class="info-row"><span class="label">Date:</span>${new Date(ds.createdAt).toLocaleDateString()}</div>
      <div class="info-row"><span class="label">Customer:</span>${job.customer?.name || '—'}</div>
      <div class="info-row"><span class="label">Customer Address:</span>${job.customer?.address || '—'}</div>
      <div class="info-row"><span class="label">Instrument:</span>${job.instrument?.name || '—'}</div>
      <div class="info-row"><span class="label">Make / Model:</span>${job.instrument?.make || '—'} / ${job.instrument?.model || '—'}</div>
      <div class="info-row"><span class="label">Serial Number:</span>${job.instrument?.serialNumber || '—'}</div>
      <div class="info-row"><span class="label">Range:</span>${job.instrument?.range || '—'}</div>
      <div class="info-row"><span class="label">Least Count:</span>${job.instrument?.leastCount || '—'}</div>
      <div class="info-row"><span class="label">Engineer:</span>${job.engineer?.user?.fullName || '—'}</div>
      <div class="info-row"><span class="label">Condition of Item:</span>${job.conditionOfItem || '—'}</div>
      <div class="info-row"><span class="label">Challan No.:</span>${job.challanNo || '—'}</div>
    </div>
  </div>

  ${env ? `<div class="env">
    <div class="env-item"><div class="env-label">Temperature</div><div class="env-value">${env.temperature ?? '—'} °C</div></div>
    <div class="env-item"><div class="env-label">Humidity</div><div class="env-value">${env.humidity ?? '—'} %RH</div></div>
    <div class="env-item"><div class="env-label">Pressure</div><div class="env-value">${env.pressure ?? '—'} kPa</div></div>
  </div>` : ''}

  ${resultSummary}

  <div class="section">
    <h3>Measurement Observations</h3>
    <table>
      <thead>
        <tr>
          <th>Point</th>
          <th>Unit</th>
          <th>Nominal</th>
          <th>Standard Value</th>
          <th>Observed Mean</th>
          <th>Correction</th>
          <th>Error</th>
          <th>Std Dev (s)</th>
          <th>Repeatability</th>
          <th>Drift</th>
          <th>u<sub>A</sub></th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>${obsRows || '<tr><td colspan="12" style="text-align:center;color:#888">No observations recorded</td></tr>'}</tbody>
    </table>
  </div>

  ${uncSection}

  <div class="footer">
    Generated by CLMS · ${new Date().toLocaleString()} · Datasheet ID: ${ds.id}
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
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
