// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: SHARED TYPES & HELPERS
// ─────────────────────────────────────────────────────────────────
// Each discipline lives in its own file (mechanical.ts, electrotechnical.ts,
// …) and exports a `Procedure[]`. index.ts aggregates them.
//
// Model is per NABL-126 / ISO-IEC 17025: an instrument may measure several
// PARAMETERS, each with its own UNIT, RANGE and standard POINTS, plus the
// uncertainty contributors (Type B) and the documented calibration METHOD.
//
// Engineering default values speed up data entry; the accredited values
// (master uncertainty, UUC resolution, CMC, decision rule) are editable in UI.

export const DISCIPLINES = [
  'Mechanical',
  'Electro Technical',
  'Thermal',
  'Pressure',
  'Mass & Volume',
  'Force & Torque',
  'Fluid Flow',
  'Speed & Time',
  'Optical & Photometry',
  'Acoustics & Sound',
  'Analytical / Electro-Chemical',
  'Medical / Bio-Medical',
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export interface ProcedurePoint {
  label: string;
  nominal: number;
}

export interface ProcedureTypeB {
  source: string;
  value: number;
  distribution: 'normal' | 'rectangular' | 'triangular' | 'u-shaped';
  divisor: number;
  sensitivity: number;
  unit: string;
}

/**
 * A single measurement parameter/range of an instrument (e.g. a DMM's
 * "DC Voltage 0–100 V" or a pressure gauge's "0–25 bar"). Instruments with
 * multiple parameters/units list several of these in `ranges`.
 */
export interface MeasurementRange {
  parameter: string;   // e.g. "DC Voltage", "Temperature", "Torque (CW)"
  unit: string;        // primary unit of this range
  altUnits?: string[]; // equivalent units the same range may be reported in
  rangeText?: string;  // human range, e.g. "0 – 25 bar"
  points: ProcedurePoint[];
  typeB: ProcedureTypeB[];
}

export interface Procedure {
  id: string;
  label: string;          // instrument name
  discipline: Discipline;
  subDiscipline: string;  // sub-discipline within the discipline
  // ── Primary range (kept required for backward-compat with existing UI) ──
  unit: string;
  points: ProcedurePoint[];
  typeB: ProcedureTypeB[];
  // ── NABL enrichment ──
  units?: string[];               // all units the instrument can read
  ranges?: MeasurementRange[];    // multiple parameters/ranges/units
  procedureText?: string;         // documented calibration method (NABL)
  nablReference?: string;         // e.g. "NABL 122-02", "DKD-R 6-1", "EURAMET cg-x"
  referenceStandard?: string;     // typical master/standard used
  // ── NABL 129 specific criteria ──────────────────────────────────
  nablChapter?: string;           // NABL 129 chapter (e.g. "Chapter 1(F)")
  minReadings?: number;           // minimum observations per calibration point
  calibrationIntervalMonths?: number; // recommended recalibration period
  mpe?: string;                   // maximum permissible error for typical class
  accuracyClasses?: { class: string; mpe: string }[]; // accuracy class table
}

// ── Shared helpers ────────────────────────────────────────────────

export const R3 = Math.sqrt(3); // rectangular distribution divisor √3
export const R6 = Math.sqrt(6); // triangular distribution divisor √6

/** Build standard points from nominal values. */
export const pts = (unit: string, ns: number[]): ProcedurePoint[] =>
  ns.map((n) => ({ label: `${n} ${unit}`, nominal: n }));

/** Standard Type-B set: reference-standard uncertainty + UUC resolution + extras. */
export const tb = (
  unit: string,
  masterU: number,
  resolution: number,
  extra: ProcedureTypeB[] = [],
): ProcedureTypeB[] => [
  { source: 'Reference standard uncertainty (from certificate)', value: masterU, distribution: 'normal', divisor: 2, sensitivity: 1, unit },
  { source: 'Resolution of UUC', value: resolution / 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit },
  ...extra,
];

/** Common extra contributors. */
export const hysteresisExtra = (unit: string, v: number): ProcedureTypeB =>
  ({ source: 'Hysteresis / repeatability of UUC', value: v, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit });

export const thermalExtra = (unit: string, v = 0.05): ProcedureTypeB =>
  ({ source: 'Bath / medium uniformity & stability', value: v, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit });

export const driftExtra = (unit: string, v: number): ProcedureTypeB =>
  ({ source: 'Drift / stability of standard', value: v, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit });

/** Convenience: make a MeasurementRange. */
export const range = (
  parameter: string,
  unit: string,
  ns: number[],
  typeB: ProcedureTypeB[],
  opts: { altUnits?: string[]; rangeText?: string } = {},
): MeasurementRange => ({
  parameter,
  unit,
  altUnits: opts.altUnits,
  rangeText: opts.rangeText ?? (ns.length ? `${ns[0]} – ${ns[ns.length - 1]} ${unit}` : undefined),
  points: pts(unit, ns),
  typeB,
});
