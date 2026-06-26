import {
  Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { evaluate } from '../../common/formula/formula-engine';
import { convert, supportedUnits } from '../../common/formula/unit-convert';

// ─────────────────────────── CMC / Scope master ──────────────────────────────

type CmcInput = {
  discipline: string;
  parameter: string;
  rangeMin?: number;
  rangeMax?: number;
  rangeText?: string;
  unit?: string;
  cmc?: string;
  cmcValue?: number;
  method?: string;
  scope?: string;
  revision?: string;
  effectiveDate?: string;
};

type MpeInput = {
  discipline: string;
  parameter: string;
  instrumentType?: string;
  accuracyClass?: string;
  standard?: string;
  rangeMin?: number;
  rangeMax?: number;
  unit?: string;
  mpeValue: number;
  mpeIsPercent?: boolean;
  resolution?: number;
};

/** Does `value` fall within [min, max]? Open-ended when a bound is null. */
function inRange(value: number, min?: number | null, max?: number | null): boolean {
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

/** Width of a range; unbounded ranges sort last (widest) so tighter rules win. */
function rangeWidth(min?: number | null, max?: number | null): number {
  if (min == null || max == null) return Number.POSITIVE_INFINITY;
  return Math.abs(max - min);
}

@Injectable()
class CalibrationMastersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CMC / Scope ──
  listCmc(labId: string) {
    return this.prisma.cmcScope.findMany({
      where: { labId, isActive: true },
      orderBy: [{ discipline: 'asc' }, { parameter: 'asc' }, { rangeMin: 'asc' }],
    });
  }

  createCmc(labId: string, d: CmcInput) {
    return this.prisma.cmcScope.create({
      data: {
        labId,
        discipline: d.discipline,
        parameter: d.parameter,
        rangeMin: d.rangeMin ?? null,
        rangeMax: d.rangeMax ?? null,
        rangeText: d.rangeText,
        unit: d.unit,
        cmc: d.cmc,
        cmcValue: d.cmcValue ?? null,
        method: d.method,
        scope: d.scope,
        revision: d.revision,
        effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : null,
      },
    });
  }

  async updateCmc(id: string, labId: string, d: Partial<CmcInput>) {
    const existing = await this.prisma.cmcScope.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('CMC scope entry not found');
    return this.prisma.cmcScope.update({
      where: { id },
      data: {
        ...d,
        effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : undefined,
      } as Prisma.CmcScopeUpdateInput,
    });
  }

  /** Soft delete — preserves history while removing the entry from active use. */
  async removeCmc(id: string, labId: string) {
    const existing = await this.prisma.cmcScope.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('CMC scope entry not found');
    await this.prisma.cmcScope.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  /**
   * Auto-fetch the applicable CMC scope entry for a calibration point. Matches
   * discipline + parameter (case-insensitive) where the value falls within the
   * entry's range; the tightest range wins, then the latest effective date.
   */
  async lookupCmc(labId: string, discipline: string, parameter: string, value?: number) {
    const rows = await this.prisma.cmcScope.findMany({
      where: {
        labId,
        isActive: true,
        discipline: { equals: discipline, mode: 'insensitive' },
        parameter: { equals: parameter, mode: 'insensitive' },
      },
    });
    const candidates = value == null
      ? rows
      : rows.filter((r) => inRange(value, r.rangeMin, r.rangeMax));
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const w = rangeWidth(a.rangeMin, a.rangeMax) - rangeWidth(b.rangeMin, b.rangeMax);
      if (w !== 0) return w;
      const ad = a.effectiveDate?.getTime() ?? 0;
      const bd = b.effectiveDate?.getTime() ?? 0;
      return bd - ad;
    });
    return candidates[0];
  }

  // ── MPE rules ──
  listMpe(labId: string) {
    return this.prisma.mpeRule.findMany({
      where: { labId, isActive: true },
      orderBy: [{ discipline: 'asc' }, { parameter: 'asc' }, { rangeMin: 'asc' }],
    });
  }

  createMpe(labId: string, d: MpeInput) {
    if (d.mpeValue == null || Number.isNaN(Number(d.mpeValue))) {
      throw new BadRequestException('mpeValue is required and must be numeric');
    }
    return this.prisma.mpeRule.create({
      data: {
        labId,
        discipline: d.discipline,
        parameter: d.parameter,
        instrumentType: d.instrumentType,
        accuracyClass: d.accuracyClass,
        standard: d.standard,
        rangeMin: d.rangeMin ?? null,
        rangeMax: d.rangeMax ?? null,
        unit: d.unit,
        mpeValue: Number(d.mpeValue),
        mpeIsPercent: d.mpeIsPercent ?? false,
        resolution: d.resolution ?? null,
      },
    });
  }

  async updateMpe(id: string, labId: string, d: Partial<MpeInput>) {
    const existing = await this.prisma.mpeRule.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('MPE rule not found');
    return this.prisma.mpeRule.update({ where: { id }, data: d as Prisma.MpeRuleUpdateInput });
  }

  async removeMpe(id: string, labId: string) {
    const existing = await this.prisma.mpeRule.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('MPE rule not found');
    await this.prisma.mpeRule.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  /**
   * Auto-select the MPE for a point from discipline/parameter/range, optionally
   * refined by accuracy class and reference standard. Returns the matched rule
   * plus the resolved absolute MPE (percent rules are applied to the value).
   */
  async lookupMpe(
    labId: string,
    q: { discipline: string; parameter: string; value?: number; accuracyClass?: string; standard?: string },
  ) {
    const rows = await this.prisma.mpeRule.findMany({
      where: {
        labId,
        isActive: true,
        discipline: { equals: q.discipline, mode: 'insensitive' },
        parameter: { equals: q.parameter, mode: 'insensitive' },
      },
    });

    let candidates = q.value == null ? rows : rows.filter((r) => inRange(q.value as number, r.rangeMin, r.rangeMax));
    // Prefer exact accuracy-class / standard matches when those were supplied.
    const refine = (field: 'accuracyClass' | 'standard', wanted?: string) => {
      if (!wanted) return;
      const exact = candidates.filter((r) => (r[field] ?? '').toLowerCase() === wanted.toLowerCase());
      if (exact.length) candidates = exact;
    };
    refine('accuracyClass', q.accuracyClass);
    refine('standard', q.standard);
    if (!candidates.length) return null;

    candidates.sort((a, b) => rangeWidth(a.rangeMin, a.rangeMax) - rangeWidth(b.rangeMin, b.rangeMax));
    const rule = candidates[0];
    const mpeAbsolute = rule.mpeIsPercent && q.value != null
      ? (rule.mpeValue / 100) * Math.abs(q.value)
      : rule.mpeValue;
    return { rule, mpeValue: rule.mpeValue, mpeIsPercent: rule.mpeIsPercent, mpeAbsolute, unit: rule.unit };
  }

  // ── Module 13: Reusable formulas + unit conversion ──

  listFormulas(labId: string) {
    return this.prisma.formulaMaster.findMany({
      where: { labId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  createFormula(labId: string, d: any) {
    if (!d.name || !d.expression) throw new BadRequestException('name and expression are required');
    // Validate the expression compiles against its declared variables/constants.
    this.evaluateFormula(d.expression, this.zeroContext(d.variables, d.constants));
    return this.prisma.formulaMaster.create({
      data: {
        labId,
        name: d.name,
        expression: d.expression,
        variables: Array.isArray(d.variables) ? d.variables : [],
        constants: (d.constants ?? undefined) as Prisma.InputJsonValue | undefined,
        unit: d.unit,
        description: d.description,
      },
    });
  }

  async updateFormula(id: string, labId: string, d: any) {
    const existing = await this.prisma.formulaMaster.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Formula not found');
    if (d.expression) this.evaluateFormula(d.expression, this.zeroContext(d.variables ?? existing.variables, d.constants));
    return this.prisma.formulaMaster.update({ where: { id }, data: d as Prisma.FormulaMasterUpdateInput });
  }

  async removeFormula(id: string, labId: string) {
    const existing = await this.prisma.formulaMaster.findFirst({ where: { id, labId } });
    if (!existing) throw new NotFoundException('Formula not found');
    await this.prisma.formulaMaster.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  /** Evaluate an arbitrary expression against supplied variables + constants. */
  evaluateFormula(expression: string, variables: Record<string, number>) {
    try {
      return evaluate(expression, variables);
    } catch (e: any) {
      throw new BadRequestException(`Formula error: ${e?.message ?? 'invalid expression'}`);
    }
  }

  private zeroContext(variables?: string[], constants?: Record<string, number>): Record<string, number> {
    const ctx: Record<string, number> = {};
    for (const v of variables ?? []) ctx[v] = 0;
    for (const [k, val] of Object.entries(constants ?? {})) ctx[k] = Number(val) || 0;
    return ctx;
  }

  convertUnit(value: number, from: string, to: string) {
    try {
      return { value, from, to, result: convert(value, from, to) };
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Conversion failed');
    }
  }

  units() {
    return supportedUnits();
  }
}

@UseGuards(JwtAuthGuard)
@Controller('calibration-masters')
class CalibrationMastersController {
  constructor(private readonly svc: CalibrationMastersService) {}

  // ── CMC / Scope ──
  @Get('cmc')
  listCmc(@Request() req: any) {
    return this.svc.listCmc(req.user.labId);
  }

  @Get('cmc/lookup')
  lookupCmc(
    @Request() req: any,
    @Query('discipline') discipline: string,
    @Query('parameter') parameter: string,
    @Query('value') value?: string,
  ) {
    return this.svc.lookupCmc(req.user.labId, discipline, parameter, value != null ? Number(value) : undefined);
  }

  @Post('cmc')
  createCmc(@Request() req: any, @Body() body: CmcInput) {
    return this.svc.createCmc(req.user.labId, body);
  }

  @Patch('cmc/:id')
  updateCmc(@Request() req: any, @Param('id') id: string, @Body() body: Partial<CmcInput>) {
    return this.svc.updateCmc(id, req.user.labId, body);
  }

  @Delete('cmc/:id')
  removeCmc(@Request() req: any, @Param('id') id: string) {
    return this.svc.removeCmc(id, req.user.labId);
  }

  @Post('cmc/import')
  async importCmc(@Request() req: any, @Body() body: { records: CmcInput[] }) {
    const out: any[] = [];
    for (const r of body.records ?? []) {
      try { out.push(await this.svc.createCmc(req.user.labId, r)); }
      catch (e: any) { out.push({ error: e?.message, input: r }); }
    }
    return { imported: out.filter((r) => !r.error).length, errors: out.filter((r) => r.error) };
  }

  // ── MPE rules ──
  @Get('mpe')
  listMpe(@Request() req: any) {
    return this.svc.listMpe(req.user.labId);
  }

  @Get('mpe/lookup')
  lookupMpe(
    @Request() req: any,
    @Query('discipline') discipline: string,
    @Query('parameter') parameter: string,
    @Query('value') value?: string,
    @Query('accuracyClass') accuracyClass?: string,
    @Query('standard') standard?: string,
  ) {
    return this.svc.lookupMpe(req.user.labId, {
      discipline, parameter, accuracyClass, standard,
      value: value != null ? Number(value) : undefined,
    });
  }

  @Post('mpe')
  createMpe(@Request() req: any, @Body() body: MpeInput) {
    return this.svc.createMpe(req.user.labId, body);
  }

  @Patch('mpe/:id')
  updateMpe(@Request() req: any, @Param('id') id: string, @Body() body: Partial<MpeInput>) {
    return this.svc.updateMpe(id, req.user.labId, body);
  }

  @Delete('mpe/:id')
  removeMpe(@Request() req: any, @Param('id') id: string) {
    return this.svc.removeMpe(id, req.user.labId);
  }

  @Post('mpe/import')
  async importMpe(@Request() req: any, @Body() body: { records: MpeInput[] }) {
    const out: any[] = [];
    for (const r of body.records ?? []) {
      try { out.push(await this.svc.createMpe(req.user.labId, r)); }
      catch (e: any) { out.push({ error: e?.message, input: r }); }
    }
    return { imported: out.filter((r) => !r.error).length, errors: out.filter((r) => r.error) };
  }

  // ── Module 13: Reusable formulas + unit conversion ──

  @Get('formulas')
  listFormulas(@Request() req: any) {
    return this.svc.listFormulas(req.user.labId);
  }

  @Post('formulas')
  createFormula(@Request() req: any, @Body() body: any) {
    return this.svc.createFormula(req.user.labId, body);
  }

  @Patch('formulas/:id')
  updateFormula(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateFormula(id, req.user.labId, body);
  }

  @Delete('formulas/:id')
  removeFormula(@Request() req: any, @Param('id') id: string) {
    return this.svc.removeFormula(id, req.user.labId);
  }

  /** Evaluate an expression against supplied variables (live formula tester). */
  @Post('formulas/evaluate')
  evaluate(@Body() body: { expression: string; variables?: Record<string, number> }) {
    return { result: this.svc.evaluateFormula(body.expression, body.variables ?? {}) };
  }

  @Get('units')
  units() {
    return this.svc.units();
  }

  @Get('convert')
  convert(@Query('value') value: string, @Query('from') from: string, @Query('to') to: string) {
    return this.svc.convertUnit(Number(value), from, to);
  }
}

@Module({
  controllers: [CalibrationMastersController],
  providers: [CalibrationMastersService],
})
export class CalibrationMastersModule {}
