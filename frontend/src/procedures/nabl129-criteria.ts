/**
 * NABL 129 Calibration Criteria Library
 * Per-instrument chapters, MPE, minimum readings, calibration intervals,
 * and accuracy classes as defined in NABL 129 (Edition 7).
 */

export interface Nabl129Criteria {
  nablChapter: string;
  minReadings: number;
  calibrationIntervalMonths: number;
  mpe: string;
  mpeNumeric?: number;
  mpeIsPercent?: boolean;
  accuracyClasses?: { class: string; mpe: string; mpeNumeric?: number; mpeIsPercent?: boolean }[];
  keyRequirements?: string[];
}

// ── MPE helpers ──────────────────────────────────────────────────────────────

export function parseMpe(c: Nabl129Criteria): { value: number; isPercent: boolean } | null {
  if (c.mpeNumeric != null) return { value: c.mpeNumeric, isPercent: c.mpeIsPercent ?? false };
  return null;
}

export function checkMpe(
  error: number,
  nominal: number,
  criteria: Nabl129Criteria,
): 'pass' | 'fail' | null {
  if (criteria.mpeNumeric == null) return null;
  const absErr = Math.abs(error);
  const limit = criteria.mpeIsPercent
    ? (criteria.mpeNumeric / 100) * Math.abs(nominal)
    : criteria.mpeNumeric;
  return absErr <= limit ? 'pass' : 'fail';
}

// ── Criteria map ─────────────────────────────────────────────────────────────

export const NABL129_MAP: Record<string, Nabl129Criteria> = {
  // ── MECHANICAL ──
  VERNIER_CALIPER: {
    nablChapter: 'NABL 129 §3.1.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.02 mm', mpeNumeric: 0.02,
    accuracyClasses: [
      { class: 'Grade I', mpe: '±0.02 mm', mpeNumeric: 0.02 },
      { class: 'Grade II', mpe: '±0.05 mm', mpeNumeric: 0.05 },
    ],
  },
  MICROMETER: {
    nablChapter: 'NABL 129 §3.1.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.004 mm', mpeNumeric: 0.004,
  },
  DIAL_GAUGE: {
    nablChapter: 'NABL 129 §3.1.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.005 mm', mpeNumeric: 0.005,
  },
  GAUGE_BLOCK: {
    nablChapter: 'NABL 129 §3.1.4', minReadings: 5, calibrationIntervalMonths: 24,
    mpe: '±0.0002 mm', mpeNumeric: 0.0002,
    accuracyClasses: [
      { class: 'Grade K', mpe: '±0.0002 mm', mpeNumeric: 0.0002 },
      { class: 'Grade 0', mpe: '±0.0005 mm', mpeNumeric: 0.0005 },
      { class: 'Grade 1', mpe: '±0.001 mm', mpeNumeric: 0.001 },
      { class: 'Grade 2', mpe: '±0.003 mm', mpeNumeric: 0.003 },
    ],
  },
  HEIGHT_GAUGE: {
    nablChapter: 'NABL 129 §3.1.5', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.02 mm', mpeNumeric: 0.02,
  },
  THREAD_GAUGE: {
    nablChapter: 'NABL 129 §3.1.6', minReadings: 3, calibrationIntervalMonths: 12,
    mpe: '±0.005 mm', mpeNumeric: 0.005,
  },
  SURFACE_ROUGHNESS: {
    nablChapter: 'NABL 129 §3.1.7', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±10%', mpeNumeric: 10, mpeIsPercent: true,
  },
  BEVEL_PROTRACTOR: {
    nablChapter: 'NABL 129 §3.2.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: "±5'", mpeNumeric: 0.0833,
  },
  SINE_BAR: {
    nablChapter: 'NABL 129 §3.2.2', minReadings: 3, calibrationIntervalMonths: 24,
    mpe: "±2'", mpeNumeric: 0.0333,
  },
  HARDNESS_TESTER_ROCKWELL: {
    nablChapter: 'NABL 129 §3.3.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1 HRC', mpeNumeric: 1,
    accuracyClasses: [
      { class: 'HRC', mpe: '±1 HRC', mpeNumeric: 1 },
      { class: 'HRB', mpe: '±2 HRB', mpeNumeric: 2 },
      { class: 'HV', mpe: '±5 HV', mpeNumeric: 5 },
    ],
  },
  HARDNESS_TESTER_VICKERS: {
    nablChapter: 'NABL 129 §3.3.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5 HV', mpeNumeric: 5,
  },
  HARDNESS_TESTER_BRINELL: {
    nablChapter: 'NABL 129 §3.3.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5 HB', mpeNumeric: 5,
  },
  DUROMETER: {
    nablChapter: 'NABL 129 §3.3.4', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1 Shore', mpeNumeric: 1,
  },
  SURFACE_PLATE: {
    nablChapter: 'NABL 129 §3.4.1', minReadings: 9, calibrationIntervalMonths: 12,
    mpe: '±0.003 mm', mpeNumeric: 0.003,
  },
  CMM: {
    nablChapter: 'NABL 129 §3.5.1', minReadings: 7, calibrationIntervalMonths: 12,
    mpe: '±0.005 mm', mpeNumeric: 0.005,
  },

  // ── FORCE / TORQUE ──
  FORCE_PROVING: {
    nablChapter: 'NABL 129 §5.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true,
    accuracyClasses: [
      { class: 'Class 00', mpe: '±0.1%', mpeNumeric: 0.1, mpeIsPercent: true },
      { class: 'Class 0', mpe: '±0.2%', mpeNumeric: 0.2, mpeIsPercent: true },
      { class: 'Class 0.5', mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true },
      { class: 'Class 1', mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true },
    ],
  },
  UTM: {
    nablChapter: 'NABL 129 §5.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true,
  },
  TORQUE_MEASURING: {
    nablChapter: 'NABL 129 §5.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true,
    accuracyClasses: [
      { class: 'Class 0.5', mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true },
      { class: 'Class 1', mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true },
      { class: 'Class 2', mpe: '±2%', mpeNumeric: 2, mpeIsPercent: true },
    ],
  },

  // ── PRESSURE ──
  PRESSURE_GAUGE: {
    nablChapter: 'NABL 129 §6.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1%', mpeNumeric: 0.1, mpeIsPercent: true,
    accuracyClasses: [
      { class: 'Class 0.1', mpe: '±0.1%', mpeNumeric: 0.1, mpeIsPercent: true },
      { class: 'Class 0.25', mpe: '±0.25%', mpeNumeric: 0.25, mpeIsPercent: true },
      { class: 'Class 0.6', mpe: '±0.6%', mpeNumeric: 0.6, mpeIsPercent: true },
      { class: 'Class 1', mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true },
    ],
  },
  DEAD_WEIGHT_TESTER: {
    nablChapter: 'NABL 129 §6.2', minReadings: 5, calibrationIntervalMonths: 24,
    mpe: '±0.01%', mpeNumeric: 0.01, mpeIsPercent: true,
  },
  PRESSURE_TRANSDUCER: {
    nablChapter: 'NABL 129 §6.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.25%', mpeNumeric: 0.25, mpeIsPercent: true,
  },
  VACUUM_GAUGE: {
    nablChapter: 'NABL 129 §6.4', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±2%', mpeNumeric: 2, mpeIsPercent: true,
  },

  // ── MASS / VOLUME ──
  BALANCE: {
    nablChapter: 'NABL 129 §7.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.01 g', mpeNumeric: 0.01,
    accuracyClasses: [
      { class: 'Class E1', mpe: '±0.0001 g', mpeNumeric: 0.0001 },
      { class: 'Class E2', mpe: '±0.0003 g', mpeNumeric: 0.0003 },
      { class: 'Class F1', mpe: '±0.001 g', mpeNumeric: 0.001 },
      { class: 'Class F2', mpe: '±0.003 g', mpeNumeric: 0.003 },
    ],
  },
  WEIGHTS: {
    nablChapter: 'NABL 129 §7.2', minReadings: 3, calibrationIntervalMonths: 24,
    mpe: '±0.5 mg', mpeNumeric: 0.0005,
  },
  PIPETTE: {
    nablChapter: 'NABL 129 §7.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true,
  },
  BURETTE: {
    nablChapter: 'NABL 129 §7.4', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.05 mL', mpeNumeric: 0.05,
  },

  // ── THERMAL ──
  THERMAL_SPRT: {
    nablChapter: 'NABL 129 §4.1.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.005 °C', mpeNumeric: 0.005,
  },
  THERMAL_RTD: {
    nablChapter: 'NABL 129 §4.1.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5 °C', mpeNumeric: 0.5,
    accuracyClasses: [
      { class: 'Class AA', mpe: '±0.1 °C', mpeNumeric: 0.1 },
      { class: 'Class A', mpe: '±0.15 °C', mpeNumeric: 0.15 },
      { class: 'Class B', mpe: '±0.3 °C', mpeNumeric: 0.3 },
    ],
  },
  THERMAL_THERMOCOUPLE: {
    nablChapter: 'NABL 129 §4.1.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1.5 °C', mpeNumeric: 1.5,
    accuracyClasses: [
      { class: 'Type K Class 1', mpe: '±1.5 °C', mpeNumeric: 1.5 },
      { class: 'Type K Class 2', mpe: '±2.5 °C', mpeNumeric: 2.5 },
      { class: 'Type J Class 1', mpe: '±1.5 °C', mpeNumeric: 1.5 },
      { class: 'Type T Class 1', mpe: '±0.5 °C', mpeNumeric: 0.5 },
    ],
  },
  THERMAL_LIG: {
    nablChapter: 'NABL 129 §4.1.4', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5 °C', mpeNumeric: 0.5,
  },
  THERMAL_HUMIDITY: {
    nablChapter: 'NABL 129 §4.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±2 %RH', mpeNumeric: 2,
  },
  FURNACE: {
    nablChapter: 'NABL 129 §4.3', minReadings: 9, calibrationIntervalMonths: 6,
    mpe: '±3 °C', mpeNumeric: 3,
  },
  AUTOCLAVE: {
    nablChapter: 'NABL 129 §4.4', minReadings: 5, calibrationIntervalMonths: 6,
    mpe: '±2 °C', mpeNumeric: 2,
  },

  // ── ELECTRO-TECHNICAL ──
  DIGITAL_MULTIMETER: {
    nablChapter: 'NABL 129 §8.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1%', mpeNumeric: 0.1, mpeIsPercent: true,
    accuracyClasses: [
      { class: '3.5 digit', mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true },
      { class: '4.5 digit', mpe: '±0.1%', mpeNumeric: 0.1, mpeIsPercent: true },
      { class: '5.5 digit', mpe: '±0.01%', mpeNumeric: 0.01, mpeIsPercent: true },
    ],
  },
  CLAMP_METER: {
    nablChapter: 'NABL 129 §8.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±2%', mpeNumeric: 2, mpeIsPercent: true,
  },
  OSCILLOSCOPE: {
    nablChapter: 'NABL 129 §8.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±3%', mpeNumeric: 3, mpeIsPercent: true,
  },
  POWER_ANALYZER: {
    nablChapter: 'NABL 129 §8.4', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1%', mpeNumeric: 0.1, mpeIsPercent: true,
  },
  INSULATION_TESTER: {
    nablChapter: 'NABL 129 §8.5', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5%', mpeNumeric: 5, mpeIsPercent: true,
  },
  LCR_METER: {
    nablChapter: 'NABL 129 §8.6', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true,
  },
  EARTH_TESTER: {
    nablChapter: 'NABL 129 §8.7', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5%', mpeNumeric: 5, mpeIsPercent: true,
  },
  ENERGY_METER: {
    nablChapter: 'NABL 129 §8.8', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true,
  },
  FUNCTION_GENERATOR: {
    nablChapter: 'NABL 129 §8.9', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true,
  },

  // ── FLUID FLOW ──
  FLOW_METER: {
    nablChapter: 'NABL 129 §9.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true,
  },
  FLOW_CALIBRATOR: {
    nablChapter: 'NABL 129 §9.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.5%', mpeNumeric: 0.5, mpeIsPercent: true,
  },

  // ── SPEED / TIME ──
  TACHOMETER: {
    nablChapter: 'NABL 129 §10.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.02%', mpeNumeric: 0.02, mpeIsPercent: true,
  },
  STOPWATCH: {
    nablChapter: 'NABL 129 §10.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1 s', mpeNumeric: 0.1,
  },
  FREQUENCY_COUNTER: {
    nablChapter: 'NABL 129 §10.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.001%', mpeNumeric: 0.001, mpeIsPercent: true,
  },

  // ── OPTICAL ──
  LUX_METER: {
    nablChapter: 'NABL 129 §11.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5%', mpeNumeric: 5, mpeIsPercent: true,
  },
  UV_METER: {
    nablChapter: 'NABL 129 §11.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5%', mpeNumeric: 5, mpeIsPercent: true,
  },
  SPECTROMETER: {
    nablChapter: 'NABL 129 §11.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1 nm', mpeNumeric: 1,
  },

  // ── ACOUSTICS ──
  SOUND_LEVEL_METER: {
    nablChapter: 'NABL 129 §12.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1.5 dB', mpeNumeric: 1.5,
  },
  VIBRATION_METER: {
    nablChapter: 'NABL 129 §12.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±5%', mpeNumeric: 5, mpeIsPercent: true,
  },

  // ── ANALYTICAL ──
  PH_METER: {
    nablChapter: 'NABL 129 §13.1', minReadings: 5, calibrationIntervalMonths: 6,
    mpe: '±0.02 pH', mpeNumeric: 0.02,
  },
  CONDUCTIVITY_METER: {
    nablChapter: 'NABL 129 §13.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±1%', mpeNumeric: 1, mpeIsPercent: true,
  },
  DISSOLVED_OXYGEN: {
    nablChapter: 'NABL 129 §13.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1 mg/L', mpeNumeric: 0.1,
  },

  // ── MEDICAL ──
  SPHYGMOMANOMETER: {
    nablChapter: 'NABL 129 §14.1', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±3 mmHg', mpeNumeric: 3,
  },
  THERMOMETER_CLINICAL: {
    nablChapter: 'NABL 129 §14.2', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1 °C', mpeNumeric: 0.1,
  },
  WEIGHING_SCALE_MEDICAL: {
    nablChapter: 'NABL 129 §14.3', minReadings: 5, calibrationIntervalMonths: 12,
    mpe: '±0.1 kg', mpeNumeric: 0.1,
  },
};

export function getNabl129(procedureId?: string | null): Nabl129Criteria | null {
  if (!procedureId) return null;
  // Exact match first
  if (NABL129_MAP[procedureId]) return NABL129_MAP[procedureId];
  // Partial key match for compound IDs
  const key = Object.keys(NABL129_MAP).find((k) =>
    procedureId.toUpperCase().includes(k) || k.includes(procedureId.toUpperCase()),
  );
  return key ? NABL129_MAP[key] : null;
}
