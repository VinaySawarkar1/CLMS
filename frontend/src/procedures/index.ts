// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: AGGREGATOR
// ─────────────────────────────────────────────────────────────────
// Re-exports the shared types/helpers and the combined PROCEDURES list.
// Each discipline file owns its instruments; this file only stitches them.

export * from './types';
export { getNabl129, NABL129_MAP, checkMpe, parseMpe } from './nabl129-criteria';
export type { Nabl129Criteria } from './nabl129-criteria';
import { DISCIPLINES, Procedure } from './types';

import { MECHANICAL } from './mechanical';
import { ELECTRO_TECHNICAL } from './electrotechnical';
import { THERMAL } from './thermal';
import { PRESSURE } from './pressure';
import { MASS_VOLUME } from './mass-volume';
import { FORCE_TORQUE } from './force-torque';
import { FLUID_FLOW } from './fluid-flow';
import { SPEED_TIME } from './speed-time';
import { OPTICAL } from './optical';
import { ACOUSTICS } from './acoustics';
import { ANALYTICAL } from './analytical';
import { MEDICAL } from './medical';

export const PROCEDURES: Procedure[] = [
  ...MECHANICAL,
  ...ELECTRO_TECHNICAL,
  ...THERMAL,
  ...PRESSURE,
  ...MASS_VOLUME,
  ...FORCE_TORQUE,
  ...FLUID_FLOW,
  ...SPEED_TIME,
  ...OPTICAL,
  ...ACOUSTICS,
  ...ANALYTICAL,
  ...MEDICAL,
];

export const findProcedure = (idOrLabel?: string) =>
  PROCEDURES.find((p) => p.id === idOrLabel || p.label === idOrLabel);

/** Procedures grouped by discipline → sub-discipline, preserving discipline order. */
export function groupedProcedures() {
  const byDiscipline: Record<string, Record<string, Procedure[]>> = {};
  for (const d of DISCIPLINES) byDiscipline[d] = {};
  for (const p of PROCEDURES) {
    (byDiscipline[p.discipline] ??= {});
    (byDiscipline[p.discipline][p.subDiscipline] ??= []).push(p);
  }
  return byDiscipline;
}
