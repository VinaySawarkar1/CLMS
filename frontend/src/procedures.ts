// Calibration procedure templates, organised by NABL discipline →
// sub-discipline → instrument. Each procedure defines the datasheet
// measurement points (with units) and the typical uncertainty contributors.
//
// Values here are engineering defaults to speed up data entry. The accredited
// values (master/reference-standard uncertainty from its calibration
// certificate, UUC resolution, CMC, decision rule) must be set per the lab's
// NABL scope for each instrument.
//
// Implemented disciplines are filled in one by one. Current: MECHANICAL.

export const DISCIPLINES = [
  'Mechanical',
  'Electro Technical',
  'Thermal',
  'Mass & Volume',
  'Force & Torque',
  'Pressure',
  'Speed',
] as const;

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

export interface Procedure {
  id: string;
  label: string;          // instrument
  discipline: (typeof DISCIPLINES)[number];
  subDiscipline: string;  // sub-discipline within the discipline
  unit: string;
  points: ProcedurePoint[];
  typeB: ProcedureTypeB[];
}

const R3 = Math.sqrt(3); // rectangular distribution divisor

// Common Type-B builders for dimensional (length) instruments, in mm.
const dimTypeB = (masterU: number, resolution: number): ProcedureTypeB[] => [
  { source: 'Reference standard uncertainty (from certificate)', value: masterU, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'mm' },
  { source: 'Resolution of UUC', value: resolution / 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
  { source: 'Thermal effect (20 ± dT °C)', value: 0.0008, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
];

// ─────────────────────────── MECHANICAL ────────────────────────────
const MECHANICAL: Procedure[] = [
  // Sub-discipline: Dimension — Length
  {
    id: 'mech-vernier-caliper', label: 'Vernier / Digital Caliper',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [0, 25, 50, 100, 150].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0005, 0.01),
  },
  {
    id: 'mech-outside-micrometer', label: 'Outside Micrometer',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [0, 5, 10, 15, 20, 25].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0003, 0.001),
  },
  {
    id: 'mech-inside-micrometer', label: 'Inside Micrometer',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [25, 50, 75, 100].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0004, 0.001),
  },
  {
    id: 'mech-depth-micrometer', label: 'Depth Micrometer / Vernier Depth Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [0, 25, 50, 75, 100].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0005, 0.01),
  },
  {
    id: 'mech-height-gauge', label: 'Vernier Height Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [0, 50, 100, 200, 300].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0008, 0.01),
  },
  {
    id: 'mech-steel-rule', label: 'Steel Rule / Measuring Scale',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [0, 100, 200, 300, 500, 1000].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.05, 0.5),
  },
  {
    id: 'mech-measuring-tape', label: 'Measuring Tape',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm',
    points: [0, 500, 1000, 2000, 3000, 5000].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.2, 1),
  },
  // Sub-discipline: Dimension — Displacement / Indicators
  {
    id: 'mech-dial-indicator', label: 'Dial Indicator / Plunger Dial Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Displacement', unit: 'mm',
    points: [0, 2, 4, 6, 8, 10].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.001, 0.01),
  },
  {
    id: 'mech-dial-thickness', label: 'Dial Thickness Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Displacement', unit: 'mm',
    points: [0, 2, 4, 6, 8, 10].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.001, 0.01),
  },
  {
    id: 'mech-bore-gauge', label: 'Dial Bore Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Displacement', unit: 'mm',
    points: [0, 0.05, 0.1, 0.15, 0.2].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.002, 0.001),
  },
  // Sub-discipline: Dimension — Gauges
  {
    id: 'mech-slip-gauge', label: 'Slip Gauge / Gauge Block (verification)',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm',
    points: [1, 5, 10, 25, 50].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0002, 0.0001),
  },
  {
    id: 'mech-plug-gauge', label: 'Plain Plug Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm',
    points: [5, 10, 15, 20].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0005, 0.001),
  },
  {
    id: 'mech-ring-gauge', label: 'Plain Ring Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm',
    points: [10, 20, 30, 50].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.0006, 0.001),
  },
  {
    id: 'mech-feeler-gauge', label: 'Feeler Gauge',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm',
    points: [0.05, 0.1, 0.3, 0.5, 1.0].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.002, 0.01),
  },
  // Sub-discipline: Dimension — Angle
  {
    id: 'mech-bevel-protractor', label: 'Universal Bevel Protractor',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Angle', unit: '°',
    points: [0, 30, 45, 60, 90].map((n) => ({ label: `${n}°`, nominal: n })),
    typeB: [
      { source: 'Reference standard uncertainty (from certificate)', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '°' },
      { source: 'Resolution of UUC', value: 5 / 60 / 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°' },
    ],
  },
  {
    id: 'mech-try-square', label: 'Try Square / Engineer Square (squareness)',
    discipline: 'Mechanical', subDiscipline: 'Dimension — Angle', unit: 'mm',
    points: [50, 100, 150, 200].map((n) => ({ label: `${n} mm`, nominal: n })),
    typeB: dimTypeB(0.003, 0.01),
  },
];

export const PROCEDURES: Procedure[] = [...MECHANICAL];

export const findProcedure = (idOrLabel?: string) =>
  PROCEDURES.find((p) => p.id === idOrLabel || p.label === idOrLabel);

/** Procedures grouped by discipline → sub-discipline, for grouped menus. */
export function groupedProcedures() {
  const byDiscipline: Record<string, Record<string, Procedure[]>> = {};
  for (const p of PROCEDURES) {
    (byDiscipline[p.discipline] ??= {});
    (byDiscipline[p.discipline][p.subDiscipline] ??= []).push(p);
  }
  return byDiscipline;
}
