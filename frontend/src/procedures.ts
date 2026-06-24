// Calibration procedure templates, organised by NABL discipline →
// sub-discipline → instrument. Each procedure defines the datasheet
// measurement points (with units) and the typical uncertainty contributors.
//
// Values here are engineering defaults to speed up data entry. The accredited
// values (master/reference-standard uncertainty from its calibration
// certificate, UUC resolution, CMC, decision rule) must be set per the lab's
// NABL scope for each instrument — every field is editable in the UI.

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

const pts = (unit: string, ns: number[]): ProcedurePoint[] =>
  ns.map((n) => ({ label: `${n} ${unit}`, nominal: n }));

/** Standard Type-B set: reference-standard uncertainty + UUC resolution + extras. */
const tb = (
  unit: string,
  masterU: number,
  resolution: number,
  extra: ProcedureTypeB[] = [],
): ProcedureTypeB[] => [
  { source: 'Reference standard uncertainty (from certificate)', value: masterU, distribution: 'normal', divisor: 2, sensitivity: 1, unit },
  { source: 'Resolution of UUC', value: resolution / 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit },
  ...extra,
];

const thermalExtra = (unit: string): ProcedureTypeB =>
  ({ source: 'Bath/medium uniformity & stability', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit });
const hysteresisExtra = (unit: string, v: number): ProcedureTypeB =>
  ({ source: 'Hysteresis / repeatability of UUC', value: v, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit });

// ─────────────────────────── MECHANICAL ────────────────────────────
const dimTb = (masterU: number, resolution: number) =>
  tb('mm', masterU, resolution, [
    { source: 'Thermal effect (20 ± dT °C)', value: 0.0008, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
  ]);

const MECHANICAL: Procedure[] = [
  { id: 'mech-vernier-caliper', label: 'Vernier / Digital Caliper', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [0, 25, 50, 100, 150]), typeB: dimTb(0.0005, 0.01) },
  { id: 'mech-outside-micrometer', label: 'Outside Micrometer', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [0, 5, 10, 15, 20, 25]), typeB: dimTb(0.0003, 0.001) },
  { id: 'mech-inside-micrometer', label: 'Inside Micrometer', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [25, 50, 75, 100]), typeB: dimTb(0.0004, 0.001) },
  { id: 'mech-depth-micrometer', label: 'Depth Micrometer / Vernier Depth Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [0, 25, 50, 75, 100]), typeB: dimTb(0.0005, 0.01) },
  { id: 'mech-height-gauge', label: 'Vernier Height Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [0, 50, 100, 200, 300]), typeB: dimTb(0.0008, 0.01) },
  { id: 'mech-steel-rule', label: 'Steel Rule / Measuring Scale', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [0, 100, 200, 300, 500, 1000]), typeB: dimTb(0.05, 0.5) },
  { id: 'mech-measuring-tape', label: 'Measuring Tape', discipline: 'Mechanical', subDiscipline: 'Dimension — Length', unit: 'mm', points: pts('mm', [0, 500, 1000, 2000, 3000, 5000]), typeB: dimTb(0.2, 1) },
  { id: 'mech-dial-indicator', label: 'Dial Indicator / Plunger Dial Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Displacement', unit: 'mm', points: pts('mm', [0, 2, 4, 6, 8, 10]), typeB: dimTb(0.001, 0.01) },
  { id: 'mech-dial-thickness', label: 'Dial Thickness Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Displacement', unit: 'mm', points: pts('mm', [0, 2, 4, 6, 8, 10]), typeB: dimTb(0.001, 0.01) },
  { id: 'mech-bore-gauge', label: 'Dial Bore Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Displacement', unit: 'mm', points: pts('mm', [0, 0.05, 0.1, 0.15, 0.2]), typeB: dimTb(0.002, 0.001) },
  { id: 'mech-slip-gauge', label: 'Slip Gauge / Gauge Block (verification)', discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm', points: pts('mm', [1, 5, 10, 25, 50]), typeB: dimTb(0.0002, 0.0001) },
  { id: 'mech-plug-gauge', label: 'Plain Plug Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm', points: pts('mm', [5, 10, 15, 20]), typeB: dimTb(0.0005, 0.001) },
  { id: 'mech-ring-gauge', label: 'Plain Ring Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm', points: pts('mm', [10, 20, 30, 50]), typeB: dimTb(0.0006, 0.001) },
  { id: 'mech-feeler-gauge', label: 'Feeler Gauge', discipline: 'Mechanical', subDiscipline: 'Dimension — Gauges', unit: 'mm', points: pts('mm', [0.05, 0.1, 0.3, 0.5, 1.0]), typeB: dimTb(0.002, 0.01) },
  { id: 'mech-bevel-protractor', label: 'Universal Bevel Protractor', discipline: 'Mechanical', subDiscipline: 'Dimension — Angle', unit: '°', points: pts('°', [0, 30, 45, 60, 90]), typeB: tb('°', 0.05, 5 / 60) },
  { id: 'mech-try-square', label: 'Try Square / Engineer Square (squareness)', discipline: 'Mechanical', subDiscipline: 'Dimension — Angle', unit: 'mm', points: pts('mm', [50, 100, 150, 200]), typeB: dimTb(0.003, 0.01) },
];

// ────────────────────────── ELECTRO TECHNICAL ──────────────────────
const ELECTRO: Procedure[] = [
  { id: 'et-dmm-dcv', label: 'Digital Multimeter — DC Voltage', discipline: 'Electro Technical', subDiscipline: 'DC Voltage', unit: 'V', points: pts('V', [0.1, 1, 10, 100]), typeB: tb('V', 0.0005, 0.001) },
  { id: 'et-dmm-acv', label: 'Digital Multimeter — AC Voltage', discipline: 'Electro Technical', subDiscipline: 'AC Voltage', unit: 'V', points: pts('V', [1, 10, 100, 230]), typeB: tb('V', 0.002, 0.001) },
  { id: 'et-dmm-dci', label: 'Digital Multimeter — DC Current', discipline: 'Electro Technical', subDiscipline: 'DC Current', unit: 'A', points: pts('A', [0.01, 0.1, 1, 5]), typeB: tb('A', 0.0005, 0.001) },
  { id: 'et-dmm-aci', label: 'Digital Multimeter — AC Current', discipline: 'Electro Technical', subDiscipline: 'AC Current', unit: 'A', points: pts('A', [0.1, 1, 5, 10]), typeB: tb('A', 0.001, 0.001) },
  { id: 'et-dmm-res', label: 'Digital Multimeter — Resistance', discipline: 'Electro Technical', subDiscipline: 'Resistance', unit: 'Ω', points: pts('Ω', [10, 100, 1000, 10000]), typeB: tb('Ω', 0.05, 0.1) },
  { id: 'et-clamp-meter', label: 'Clamp / Tong Tester (AC Current)', discipline: 'Electro Technical', subDiscipline: 'AC Current', unit: 'A', points: pts('A', [10, 50, 100, 200]), typeB: tb('A', 0.1, 0.1) },
  { id: 'et-insulation', label: 'Insulation Tester / Megger', discipline: 'Electro Technical', subDiscipline: 'Insulation Resistance', unit: 'MΩ', points: pts('MΩ', [1, 10, 100, 1000]), typeB: tb('MΩ', 0.5, 1) },
  { id: 'et-earth', label: 'Earth Resistance Tester', discipline: 'Electro Technical', subDiscipline: 'Resistance', unit: 'Ω', points: pts('Ω', [1, 10, 100]), typeB: tb('Ω', 0.1, 0.1) },
  { id: 'et-lcr-cap', label: 'LCR Meter — Capacitance', discipline: 'Electro Technical', subDiscipline: 'Capacitance', unit: 'µF', points: pts('µF', [1, 10, 100]), typeB: tb('µF', 0.01, 0.01) },
  { id: 'et-frequency', label: 'Frequency Counter', discipline: 'Electro Technical', subDiscipline: 'Frequency', unit: 'Hz', points: pts('Hz', [50, 100, 1000, 10000]), typeB: tb('Hz', 0.01, 0.1) },
  { id: 'et-oscilloscope', label: 'Oscilloscope (Voltage)', discipline: 'Electro Technical', subDiscipline: 'DC Voltage', unit: 'V', points: pts('V', [1, 5, 10]), typeB: tb('V', 0.01, 0.01) },
  { id: 'et-decade-res', label: 'Decade Resistance Box', discipline: 'Electro Technical', subDiscipline: 'Resistance', unit: 'Ω', points: pts('Ω', [1, 10, 100, 1000]), typeB: tb('Ω', 0.02, 0.1) },
];

// ───────────────────────────── THERMAL ─────────────────────────────
const THERMAL: Procedure[] = [
  { id: 'th-rtd', label: 'Digital Thermometer / RTD', discipline: 'Thermal', subDiscipline: 'Temperature — Contact', unit: '°C', points: pts('°C', [0, 50, 100, 200]), typeB: tb('°C', 0.1, 0.1, [thermalExtra('°C')]) },
  { id: 'th-thermocouple', label: 'Thermocouple Indicator', discipline: 'Thermal', subDiscipline: 'Temperature — Contact', unit: '°C', points: pts('°C', [0, 100, 300, 600]), typeB: tb('°C', 0.5, 1, [thermalExtra('°C')]) },
  { id: 'th-controller', label: 'Temperature Indicator / Controller', discipline: 'Thermal', subDiscipline: 'Temperature — Contact', unit: '°C', points: pts('°C', [50, 100, 200, 400]), typeB: tb('°C', 0.3, 1, [thermalExtra('°C')]) },
  { id: 'th-lig', label: 'Liquid-in-Glass Thermometer', discipline: 'Thermal', subDiscipline: 'Temperature — Contact', unit: '°C', points: pts('°C', [0, 50, 100]), typeB: tb('°C', 0.1, 1, [thermalExtra('°C')]) },
  { id: 'th-ir', label: 'Infrared (Non-contact) Thermometer', discipline: 'Thermal', subDiscipline: 'Temperature — Non-contact', unit: '°C', points: pts('°C', [50, 100, 200, 300]), typeB: tb('°C', 0.5, 0.1, [{ source: 'Emissivity / black-body uncertainty', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' }]) },
  { id: 'th-oven', label: 'Hot Air Oven / Furnace (mapping)', discipline: 'Thermal', subDiscipline: 'Enclosure', unit: '°C', points: pts('°C', [100, 200, 300]), typeB: tb('°C', 0.5, 1, [thermalExtra('°C')]) },
  { id: 'th-bath', label: 'Temperature Bath', discipline: 'Thermal', subDiscipline: 'Enclosure', unit: '°C', points: pts('°C', [40, 60, 80]), typeB: tb('°C', 0.2, 0.1, [thermalExtra('°C')]) },
  { id: 'th-humidity', label: 'Hygrometer / Humidity Indicator', discipline: 'Thermal', subDiscipline: 'Humidity', unit: '%RH', points: pts('%RH', [30, 50, 70, 90]), typeB: tb('%RH', 1.0, 1, [{ source: 'Chamber uniformity', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%RH' }]) },
  { id: 'th-datalogger', label: 'Temperature Data Logger', discipline: 'Thermal', subDiscipline: 'Temperature — Contact', unit: '°C', points: pts('°C', [0, 25, 50]), typeB: tb('°C', 0.2, 0.1, [thermalExtra('°C')]) },
];

// ───────────────────────── MASS & VOLUME ───────────────────────────
const MASS_VOLUME: Procedure[] = [
  { id: 'mv-balance', label: 'Electronic Weighing Balance', discipline: 'Mass & Volume', subDiscipline: 'Mass', unit: 'g', points: pts('g', [0, 100, 200, 500, 1000]), typeB: tb('g', 0.001, 0.001, [{ source: 'Eccentricity / air buoyancy', value: 0.0005, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'g' }]) },
  { id: 'mv-analytical', label: 'Analytical Balance', discipline: 'Mass & Volume', subDiscipline: 'Mass', unit: 'g', points: pts('g', [0, 10, 50, 100, 200]), typeB: tb('g', 0.00005, 0.0001, [{ source: 'Eccentricity / air buoyancy', value: 0.00002, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'g' }]) },
  { id: 'mv-platform', label: 'Platform Scale', discipline: 'Mass & Volume', subDiscipline: 'Mass', unit: 'kg', points: pts('kg', [0, 10, 50, 100, 200]), typeB: tb('kg', 0.01, 0.05) },
  { id: 'mv-weights', label: 'Standard Weights / Weight Box', discipline: 'Mass & Volume', subDiscipline: 'Mass', unit: 'g', points: pts('g', [1, 10, 100, 500, 1000]), typeB: tb('g', 0.0005, 0.0001) },
  { id: 'mv-micropipette', label: 'Micropipette', discipline: 'Mass & Volume', subDiscipline: 'Volume', unit: 'µL', points: pts('µL', [10, 50, 100, 200, 1000]), typeB: tb('µL', 0.1, 0.1, [{ source: 'Evaporation / temperature of water', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'µL' }]) },
  { id: 'mv-burette', label: 'Burette', discipline: 'Mass & Volume', subDiscipline: 'Volume', unit: 'mL', points: pts('mL', [5, 10, 25, 50]), typeB: tb('mL', 0.01, 0.05) },
  { id: 'mv-pipette', label: 'Volumetric Pipette', discipline: 'Mass & Volume', subDiscipline: 'Volume', unit: 'mL', points: pts('mL', [1, 5, 10, 25]), typeB: tb('mL', 0.01, 0.02) },
  { id: 'mv-flask', label: 'Volumetric Flask', discipline: 'Mass & Volume', subDiscipline: 'Volume', unit: 'mL', points: pts('mL', [25, 50, 100, 250, 500]), typeB: tb('mL', 0.02, 0.05) },
  { id: 'mv-cylinder', label: 'Measuring Cylinder', discipline: 'Mass & Volume', subDiscipline: 'Volume', unit: 'mL', points: pts('mL', [10, 50, 100, 250]), typeB: tb('mL', 0.05, 0.5) },
];

// ───────────────────────── FORCE & TORQUE ──────────────────────────
const FORCE_TORQUE: Procedure[] = [
  { id: 'ft-force-gauge', label: 'Force Gauge / Push-Pull Gauge', discipline: 'Force & Torque', subDiscipline: 'Force', unit: 'N', points: pts('N', [10, 50, 100, 200, 500]), typeB: tb('N', 0.1, 0.1, [hysteresisExtra('N', 0.1)]) },
  { id: 'ft-load-cell', label: 'Load Cell', discipline: 'Force & Torque', subDiscipline: 'Force', unit: 'kN', points: pts('kN', [1, 5, 10, 25]), typeB: tb('kN', 0.005, 0.001, [hysteresisExtra('kN', 0.002)]) },
  { id: 'ft-utm', label: 'Universal Testing Machine (UTM)', discipline: 'Force & Torque', subDiscipline: 'Force', unit: 'kN', points: pts('kN', [5, 25, 50, 100]), typeB: tb('kN', 0.05, 0.01, [hysteresisExtra('kN', 0.02)]) },
  { id: 'ft-compression', label: 'Compression Testing Machine', discipline: 'Force & Torque', subDiscipline: 'Force', unit: 'kN', points: pts('kN', [50, 100, 500, 1000]), typeB: tb('kN', 0.5, 0.1, [hysteresisExtra('kN', 0.2)]) },
  { id: 'ft-torque-wrench', label: 'Torque Wrench', discipline: 'Force & Torque', subDiscipline: 'Torque', unit: 'N·m', points: pts('N·m', [10, 25, 50, 100, 200]), typeB: tb('N·m', 0.1, 0.1, [hysteresisExtra('N·m', 0.1)]) },
  { id: 'ft-torque-screwdriver', label: 'Torque Screwdriver', discipline: 'Force & Torque', subDiscipline: 'Torque', unit: 'N·m', points: pts('N·m', [0.5, 1, 2, 5]), typeB: tb('N·m', 0.01, 0.01, [hysteresisExtra('N·m', 0.01)]) },
  { id: 'ft-torque-tester', label: 'Torque Tester / Transducer', discipline: 'Force & Torque', subDiscipline: 'Torque', unit: 'N·m', points: pts('N·m', [5, 10, 25, 50]), typeB: tb('N·m', 0.05, 0.01, [hysteresisExtra('N·m', 0.02)]) },
  { id: 'ft-hardness-rockwell', label: 'Hardness Tester — Rockwell', discipline: 'Force & Torque', subDiscipline: 'Hardness', unit: 'HRC', points: pts('HRC', [20, 40, 60]), typeB: tb('HRC', 0.4, 0.5) },
  { id: 'ft-hardness-brinell', label: 'Hardness Tester — Brinell', discipline: 'Force & Torque', subDiscipline: 'Hardness', unit: 'HB', points: pts('HB', [100, 200, 400]), typeB: tb('HB', 2, 1) },
];

// ───────────────────────────── PRESSURE ────────────────────────────
const PRESSURE: Procedure[] = [
  { id: 'pr-gauge', label: 'Pressure Gauge (Analog)', discipline: 'Pressure', subDiscipline: 'Pressure — Positive', unit: 'bar', points: pts('bar', [0, 5, 10, 15, 20, 25]), typeB: tb('bar', 0.05, 0.1, [hysteresisExtra('bar', 0.05)]) },
  { id: 'pr-digital', label: 'Digital Pressure Gauge', discipline: 'Pressure', subDiscipline: 'Pressure — Positive', unit: 'bar', points: pts('bar', [0, 10, 20, 30, 40]), typeB: tb('bar', 0.02, 0.01, [hysteresisExtra('bar', 0.01)]) },
  { id: 'pr-transmitter', label: 'Pressure Transmitter', discipline: 'Pressure', subDiscipline: 'Pressure — Positive', unit: 'bar', points: pts('bar', [0, 2, 4, 6, 10]), typeB: tb('bar', 0.01, 0.01, [hysteresisExtra('bar', 0.005)]) },
  { id: 'pr-vacuum', label: 'Vacuum Gauge', discipline: 'Pressure', subDiscipline: 'Vacuum', unit: 'mbar', points: pts('mbar', [-800, -600, -400, -200, 0]), typeB: tb('mbar', 1, 1, [hysteresisExtra('mbar', 0.5)]) },
  { id: 'pr-compound', label: 'Compound Gauge', discipline: 'Pressure', subDiscipline: 'Vacuum', unit: 'bar', points: pts('bar', [-1, 0, 1, 5, 10]), typeB: tb('bar', 0.05, 0.1, [hysteresisExtra('bar', 0.05)]) },
  { id: 'pr-manometer', label: 'Manometer', discipline: 'Pressure', subDiscipline: 'Differential', unit: 'mmHg', points: pts('mmHg', [0, 100, 300, 500, 760]), typeB: tb('mmHg', 0.5, 1) },
  { id: 'pr-magnehelic', label: 'Magnehelic / Differential Gauge', discipline: 'Pressure', subDiscipline: 'Differential', unit: 'Pa', points: pts('Pa', [0, 250, 500, 750, 1000]), typeB: tb('Pa', 2, 5, [hysteresisExtra('Pa', 2)]) },
  { id: 'pr-dwt', label: 'Dead Weight Tester (verification)', discipline: 'Pressure', subDiscipline: 'Pressure — Positive', unit: 'bar', points: pts('bar', [0, 50, 100, 200, 500]), typeB: tb('bar', 0.02, 0.01) },
];

// ────────────────────────────── SPEED ──────────────────────────────
const SPEED: Procedure[] = [
  { id: 'sp-tacho-noncontact', label: 'Tachometer — Non-contact', discipline: 'Speed', subDiscipline: 'Rotational Speed', unit: 'rpm', points: pts('rpm', [100, 500, 1000, 5000, 10000]), typeB: tb('rpm', 0.5, 1) },
  { id: 'sp-tacho-contact', label: 'Tachometer — Contact', discipline: 'Speed', subDiscipline: 'Rotational Speed', unit: 'rpm', points: pts('rpm', [100, 500, 1000, 3000]), typeB: tb('rpm', 0.5, 1) },
  { id: 'sp-stroboscope', label: 'Stroboscope', discipline: 'Speed', subDiscipline: 'Rotational Speed', unit: 'rpm', points: pts('rpm', [500, 1000, 3000, 6000]), typeB: tb('rpm', 1, 1) },
  { id: 'sp-rpm-indicator', label: 'RPM Indicator', discipline: 'Speed', subDiscipline: 'Rotational Speed', unit: 'rpm', points: pts('rpm', [100, 1000, 5000]), typeB: tb('rpm', 0.5, 1) },
  { id: 'sp-centrifuge', label: 'Centrifuge (RPM)', discipline: 'Speed', subDiscipline: 'Rotational Speed', unit: 'rpm', points: pts('rpm', [1000, 3000, 5000, 10000]), typeB: tb('rpm', 2, 10) },
  { id: 'sp-speedometer', label: 'Speedometer', discipline: 'Speed', subDiscipline: 'Linear Speed', unit: 'km/h', points: pts('km/h', [20, 40, 60, 80, 100]), typeB: tb('km/h', 0.2, 1) },
  { id: 'sp-stopwatch', label: 'Stopwatch / Timer', discipline: 'Speed', subDiscipline: 'Time', unit: 's', points: pts('s', [10, 30, 60, 300]), typeB: tb('s', 0.01, 0.01) },
];

export const PROCEDURES: Procedure[] = [
  ...MECHANICAL, ...ELECTRO, ...THERMAL, ...MASS_VOLUME, ...FORCE_TORQUE, ...PRESSURE, ...SPEED,
];

export const findProcedure = (idOrLabel?: string) =>
  PROCEDURES.find((p) => p.id === idOrLabel || p.label === idOrLabel);

/** Procedures grouped by discipline → sub-discipline, preserving discipline order. */
export function groupedProcedures() {
  const byDiscipline: Record<string, Record<string, Procedure[]>> = {};
  for (const d of DISCIPLINES) byDiscipline[d] = {};
  for (const p of PROCEDURES) {
    (byDiscipline[p.discipline][p.subDiscipline] ??= []).push(p);
  }
  return byDiscipline;
}
