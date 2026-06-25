// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: PRESSURE DISCIPLINE
// ─────────────────────────────────────────────────────────────────
// Method basis: EURAMET cg-17 (Calibration of Electromechanical and
// Mechanical Manometers), DKD-R 6-1 (Calibration of Pressure Gauges),
// and NABL 122-02 guidelines. Calibration is performed by comparison
// against a reference standard (Dead Weight Tester / Pressure Balance
// or a Digital Pressure Calibrator) over RISING (increasing) and
// FALLING (decreasing) pressure series so that hysteresis and
// repeatability can be evaluated at each nominal point.
//
// Reference-standard uncertainty (masterU) is taken realistically as
// ~0.01–0.1 % of the calibrated range, per typical DWT / DPC CMCs.
// ─────────────────────────────────────────────────────────────────

import { Procedure, pts, tb, range, hysteresisExtra, R3 } from './types';

// Pressure unit family shared by most positive-gauge instruments.
const PRESSURE_UNITS = [
  'bar', 'psi', 'kPa', 'MPa', 'kg/cm²', 'mmHg', 'mmH2O', 'Pa', 'mbar', 'inHg', 'atm',
];

// Shared NABL method text (rising & falling concept for hysteresis).
const METHOD =
  'Mount the UUC and the reference standard at the same reference height and allow ' +
  'thermal/pressure stabilisation (≥15 min) in the calibration environment ' +
  '(23 ± 2 °C). Exercise the gauge to full scale 2–3 times before recording. ' +
  'Apply pressure in ascending (RISING) steps to the selected nominal points, ' +
  'dwelling at each point, then in descending (FALLING) steps back to zero, ' +
  'recording the UUC indication against the reference standard at every point in ' +
  'both directions. The difference between rising and falling indications at a ' +
  'nominal point gives the hysteresis; repeat the cycle (typically 3 series) to ' +
  'establish repeatability. Error = UUC reading − reference (true) pressure. ' +
  'Evaluate uncertainty per EURAMET cg-17 / DKD-R 6-1, combining reference-standard ' +
  'uncertainty, UUC resolution, repeatability and hysteresis.';

const METHOD_DWT =
  'Calibration by comparison against a Dead Weight Tester / Pressure Balance. ' +
  'Float the piston with calibrated masses to generate each nominal reference ' +
  'pressure, applying head and buoyancy corrections. ' + METHOD;

const METHOD_VAC =
  'Vacuum / negative-gauge calibration: evacuate to the selected nominal points in ' +
  'a DESCENDING (toward full vacuum) series and an ASCENDING (toward atmosphere) ' +
  'series, recording UUC vs reference vacuum standard at each point in both ' +
  'directions to evaluate hysteresis and repeatability. ' + METHOD;

const NABL_REF = 'NABL 122-02 / EURAMET cg-17 / DKD-R 6-1';
const NABL_REF_BAL = 'NABL 122-02 / EURAMET cg-3 (Pressure Balances) / DKD-R 6-1';

export const PRESSURE: Procedure[] = [
  // ── 1. Analog Pressure Gauge (Bourdon) ───────────────────────────
  {
    id: 'pr-analog-bourdon-gauge',
    label: 'Analog Pressure Gauge (Bourdon Tube)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 1, 2, 4, 6]),
    typeB: tb('bar', 0.002, 0.1, [hysteresisExtra('bar', 0.05)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure (rising & falling)', 'bar', [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        tb('bar', 0.0005, 0.02, [hysteresisExtra('bar', 0.01)]), { rangeText: '0 – 1 bar' }),
      range('Pressure (rising & falling)', 'bar', [0, 1, 2, 4, 6],
        tb('bar', 0.002, 0.1, [hysteresisExtra('bar', 0.05)]), { rangeText: '0 – 6 bar' }),
      range('Pressure (rising & falling)', 'bar', [0, 5, 10, 15, 20, 25],
        tb('bar', 0.008, 0.5, [hysteresisExtra('bar', 0.2)]), { rangeText: '0 – 25 bar' }),
    ],
    procedureText: METHOD_DWT,
    nablReference: NABL_REF,
    referenceStandard: 'Dead Weight Tester (Pressure Balance)',
  },

  // ── 2. Digital Pressure Gauge ────────────────────────────────────
  {
    id: 'pr-digital-pressure-gauge',
    label: 'Digital Pressure Gauge',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 20, 40, 60, 80, 100]),
    typeB: tb('bar', 0.01, 0.01, [hysteresisExtra('bar', 0.02)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure (rising & falling)', 'bar', [0, 20, 40, 60, 80, 100],
        tb('bar', 0.01, 0.01, [hysteresisExtra('bar', 0.02)]), { rangeText: '0 – 100 bar' }),
      range('Pressure (rising & falling)', 'bar', [0, 100, 200, 300, 400],
        tb('bar', 0.04, 0.1, [hysteresisExtra('bar', 0.08)]), { rangeText: '0 – 400 bar' }),
    ],
    procedureText: METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator / Dead Weight Tester',
  },

  // ── 3. Pressure Transmitter ──────────────────────────────────────
  {
    id: 'pr-pressure-transmitter',
    label: 'Pressure Transmitter (4–20 mA / HART)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 1.5, 3, 4.5, 6]),
    typeB: tb('bar', 0.002, 0.001, [hysteresisExtra('bar', 0.01)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure → current output (rising & falling)', 'bar', [0, 1.5, 3.0, 4.5, 6.0],
        tb('bar', 0.002, 0.001, [hysteresisExtra('bar', 0.01)]), { altUnits: ['mA'], rangeText: '0 – 6 bar (4–20 mA)' }),
      range('Pressure → current output (rising & falling)', 'bar', [0, 6.25, 12.5, 18.75, 25],
        tb('bar', 0.006, 0.005, [hysteresisExtra('bar', 0.02)]), { altUnits: ['mA'], rangeText: '0 – 25 bar (4–20 mA)' }),
    ],
    procedureText: METHOD +
      ' Record the corresponding 4–20 mA (or digital) output at each nominal point and ' +
      'evaluate span/zero error and linearity.',
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator + reference multimeter (mA)',
  },

  // ── 4. Pressure Transducer ───────────────────────────────────────
  {
    id: 'pr-pressure-transducer',
    label: 'Pressure Transducer (mV / V output)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 175, 350, 525, 700]),
    typeB: tb('bar', 0.07, 0.01, [hysteresisExtra('bar', 0.1)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure → electrical output (rising & falling)', 'bar', [0, 175, 350, 525, 700],
        tb('bar', 0.07, 0.01, [hysteresisExtra('bar', 0.1)]), { altUnits: ['mV', 'V'], rangeText: '0 – 700 bar' }),
    ],
    procedureText: METHOD +
      ' Capture the transducer electrical output (mV/V or V) at each rising and falling ' +
      'point against the reference pressure to derive sensitivity, linearity and hysteresis.',
    nablReference: NABL_REF,
    referenceStandard: 'Dead Weight Tester + reference DMM',
  },

  // ── 5. Pressure Switch (setpoint) ────────────────────────────────
  {
    id: 'pr-pressure-switch',
    label: 'Pressure Switch (Setpoint / Deadband)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [2, 4, 6]),
    typeB: tb('bar', 0.004, 0.01, [hysteresisExtra('bar', 0.02)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Set / Reset point (cut-out & cut-in)', 'bar', [2, 4, 6],
        tb('bar', 0.004, 0.01, [hysteresisExtra('bar', 0.02)]), { rangeText: '0 – 6 bar setpoint' }),
    ],
    procedureText:
      'Slowly RAISE the applied pressure until the switch trips (cut-out / set point) and ' +
      'record the reference pressure; then slowly LOWER the pressure until the switch resets ' +
      '(cut-in / reset point). The difference is the deadband. Repeat 3 times to assess ' +
      'repeatability. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator with continuity detection',
  },

  // ── 6. Differential Pressure Gauge ───────────────────────────────
  {
    id: 'pr-differential-pressure-gauge',
    label: 'Differential Pressure Gauge',
    discipline: 'Pressure',
    subDiscipline: 'Differential',
    unit: 'kPa',
    points: pts('kPa', [0, 25, 50, 75, 100]),
    typeB: tb('kPa', 0.02, 0.1, [hysteresisExtra('kPa', 0.05)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Differential pressure (rising & falling)', 'kPa', [0, 25, 50, 75, 100],
        tb('kPa', 0.02, 0.1, [hysteresisExtra('kPa', 0.05)]), { rangeText: '0 – 100 kPa ΔP' }),
    ],
    procedureText:
      'Apply the reference pressure to the high (H) port with the low (L) port vented (or at ' +
      'the defined line pressure), generating the differential. Take RISING and FALLING ΔP ' +
      'series and record UUC vs reference at each point to evaluate hysteresis. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator (low-range / ΔP module)',
  },

  // ── 7. Magnehelic Gauge ──────────────────────────────────────────
  {
    id: 'pr-magnehelic-gauge',
    label: 'Magnehelic Gauge (Low Differential)',
    discipline: 'Pressure',
    subDiscipline: 'Differential',
    unit: 'Pa',
    points: pts('Pa', [0, 250, 500, 750, 1000]),
    typeB: tb('Pa', 0.5, 10, [hysteresisExtra('Pa', 5)]),
    units: ['Pa', 'mmH2O', 'inH2O', 'mbar', 'kPa', 'mmHg'],
    ranges: [
      range('Differential pressure (rising & falling)', 'Pa', [0, 250, 500, 750, 1000],
        tb('Pa', 0.5, 10, [hysteresisExtra('Pa', 5)]), { altUnits: ['mmH2O'], rangeText: '0 – 1000 Pa' }),
      range('Differential pressure (rising & falling)', 'mmH2O', [0, 25, 50, 75, 100],
        tb('mmH2O', 0.05, 1, [hysteresisExtra('mmH2O', 0.5)]), { altUnits: ['Pa'], rangeText: '0 – 100 mmH2O' }),
    ],
    procedureText:
      'Calibrate against a low-pressure micromanometer / digital calibrator. Apply small ' +
      'differentials in RISING and FALLING series; record UUC vs reference at each point. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Micromanometer (low-pressure reference)',
  },

  // ── 8. Manometer (U-tube / digital) ──────────────────────────────
  {
    id: 'pr-manometer',
    label: 'Manometer (U-tube / Digital)',
    discipline: 'Pressure',
    subDiscipline: 'Differential',
    unit: 'kPa',
    points: pts('kPa', [0, 5, 10, 15, 20]),
    typeB: tb('kPa', 0.005, 0.01, [hysteresisExtra('kPa', 0.02)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure (rising & falling)', 'kPa', [0, 5, 10, 15, 20],
        tb('kPa', 0.005, 0.01, [hysteresisExtra('kPa', 0.02)]), { altUnits: ['mmHg', 'mmH2O'], rangeText: '0 – 20 kPa' }),
    ],
    procedureText:
      'For U-tube types apply head and density corrections to the liquid column. Take RISING ' +
      'and FALLING series against the reference standard. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator',
  },

  // ── 9. Vacuum Gauge ──────────────────────────────────────────────
  {
    id: 'pr-vacuum-gauge',
    label: 'Vacuum Gauge',
    discipline: 'Pressure',
    subDiscipline: 'Vacuum',
    unit: 'mbar',
    points: pts('mbar', [0, -250, -500, -750, -1000]),
    typeB: tb('mbar', 0.5, 1, [hysteresisExtra('mbar', 2)]),
    units: ['mbar', 'bar', 'torr', 'mmHg', 'kPa', 'Pa', 'inHg', 'psi'],
    ranges: [
      range('Vacuum (descending & ascending)', 'mbar', [0, -250, -500, -750, -1000],
        tb('mbar', 0.5, 1, [hysteresisExtra('mbar', 2)]), { altUnits: ['torr', 'mmHg'], rangeText: '0 to −1000 mbar' }),
      range('Vacuum (descending & ascending)', 'bar', [0, -0.25, -0.5, -0.75, -1.0],
        tb('bar', 0.0005, 0.01, [hysteresisExtra('bar', 0.002)]), { rangeText: '−1 to 0 bar' }),
    ],
    procedureText: METHOD_VAC,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Vacuum Calibrator (reference vacuum standard)',
  },

  // ── 10. Compound Gauge ───────────────────────────────────────────
  {
    id: 'pr-compound-gauge',
    label: 'Compound Gauge (Vacuum + Pressure)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [-1, 0, 2, 4, 6]),
    typeB: tb('bar', 0.003, 0.1, [hysteresisExtra('bar', 0.05)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Vacuum branch (descending & ascending)', 'bar', [0, -0.25, -0.5, -0.75, -1.0],
        tb('bar', 0.0008, 0.05, [hysteresisExtra('bar', 0.01)]), { rangeText: '−1 to 0 bar' }),
      range('Pressure branch (rising & falling)', 'bar', [0, 1.5, 3, 4.5, 6],
        tb('bar', 0.003, 0.1, [hysteresisExtra('bar', 0.05)]), { rangeText: '0 – 6 bar' }),
    ],
    procedureText:
      'Calibrate the vacuum branch (negative gauge) and the pressure branch (positive gauge) ' +
      'separately, each over rising/falling (or descending/ascending) series. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure/Vacuum Calibrator',
  },

  // ── 11. Absolute Pressure Gauge ──────────────────────────────────
  {
    id: 'pr-absolute-pressure-gauge',
    label: 'Absolute Pressure Gauge',
    discipline: 'Pressure',
    subDiscipline: 'Absolute',
    unit: 'kPa',
    points: pts('kPa', [0, 100, 200, 300, 400]),
    typeB: tb('kPa', 0.05, 0.1, [hysteresisExtra('kPa', 0.1)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Absolute pressure (rising & falling)', 'kPa', [0, 100, 200, 300, 400],
        tb('kPa', 0.05, 0.1, [hysteresisExtra('kPa', 0.1)]), { altUnits: ['bar', 'mbar'], rangeText: '0 – 400 kPa abs' }),
    ],
    procedureText:
      'Reference the calibration to absolute (zero = perfect vacuum). Generate absolute ' +
      'pressures with an absolute reference standard / barometric correction and take RISING ' +
      'and FALLING series. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Absolute Digital Pressure Calibrator + reference barometer',
  },

  // ── 12. Barometer ────────────────────────────────────────────────
  {
    id: 'pr-barometer',
    label: 'Barometer',
    discipline: 'Pressure',
    subDiscipline: 'Absolute',
    unit: 'hPa',
    points: pts('hPa', [800, 900, 1000, 1050, 1100]),
    typeB: tb('hPa', 0.05, 0.1, [hysteresisExtra('hPa', 0.1)]),
    units: ['hPa', 'mbar', 'kPa', 'mmHg', 'inHg', 'Pa', 'atm', 'psi'],
    ranges: [
      range('Barometric pressure (rising & falling)', 'hPa', [800, 900, 1000, 1050, 1100],
        tb('hPa', 0.05, 0.1, [hysteresisExtra('hPa', 0.1)]), { altUnits: ['mbar'], rangeText: '800 – 1100 hPa' }),
    ],
    procedureText:
      'Compare against a reference barometric standard at the same elevation. Generate ' +
      'pressures over the atmospheric range in rising and falling series; apply temperature ' +
      'and altitude corrections. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Reference Barometer / Absolute Digital Calibrator',
  },

  // ── 13. Dead Weight Tester (verification) ────────────────────────
  {
    id: 'pr-dead-weight-tester',
    label: 'Dead Weight Tester (Verification)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 100, 200, 350, 500, 700]),
    typeB: tb('bar', 0.07, 0.01, [hysteresisExtra('bar', 0.05)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Generated pressure (rising & falling)', 'bar', [0, 100, 200, 350, 500, 700],
        tb('bar', 0.07, 0.01, [hysteresisExtra('bar', 0.05)]), { rangeText: '0 – 700 bar' }),
    ],
    procedureText:
      'Verify the DWT against a higher-order pressure balance / reference DWT by cross-floating. ' +
      'Determine effective area, mass set value and head corrections. Compare generated ' +
      'pressures over rising and falling series. ' + METHOD_DWT,
    nablReference: NABL_REF_BAL,
    referenceStandard: 'Higher-order Pressure Balance (reference DWT) by cross-floating',
  },

  // ── 14. Pressure Calibrator (handheld) ───────────────────────────
  {
    id: 'pr-pressure-calibrator-handheld',
    label: 'Pressure Calibrator (Handheld)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 5, 10, 15, 20, 25]),
    typeB: tb('bar', 0.005, 0.001, [hysteresisExtra('bar', 0.01)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Measure / source pressure (rising & falling)', 'bar', [0, 5, 10, 15, 20, 25],
        tb('bar', 0.005, 0.001, [hysteresisExtra('bar', 0.01)]), { rangeText: '0 – 25 bar' }),
    ],
    procedureText:
      'Calibrate both the MEASURE and SOURCE functions of the handheld calibrator against the ' +
      'reference standard over rising and falling series. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Dead Weight Tester / higher-accuracy Pressure Controller',
  },

  // ── 15. Pressure Recorder ────────────────────────────────────────
  {
    id: 'pr-pressure-recorder',
    label: 'Pressure Recorder (Chart / Data)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 2.5, 5, 7.5, 10]),
    typeB: tb('bar', 0.005, 0.05, [hysteresisExtra('bar', 0.05)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Recorded pressure (rising & falling)', 'bar', [0, 2.5, 5, 7.5, 10],
        tb('bar', 0.005, 0.05, [hysteresisExtra('bar', 0.05)]), { rangeText: '0 – 10 bar' }),
    ],
    procedureText:
      'Apply stable reference pressures at each nominal point in rising and falling series and ' +
      'compare the recorded (charted / logged) value against the reference. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator',
  },

  // ── 16. Test Gauge (master) ──────────────────────────────────────
  {
    id: 'pr-test-gauge-master',
    label: 'Test Gauge (Master / Reference)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [0, 100, 200, 300, 400]),
    typeB: tb('bar', 0.02, 0.05, [hysteresisExtra('bar', 0.04)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure (rising & falling)', 'bar', [0, 100, 200, 300, 400],
        tb('bar', 0.02, 0.05, [hysteresisExtra('bar', 0.04)]), { rangeText: '0 – 400 bar' }),
    ],
    procedureText:
      'High-accuracy master test gauge calibrated against a Dead Weight Tester over rising and ' +
      'falling series with full hysteresis and repeatability evaluation. ' + METHOD_DWT,
    nablReference: NABL_REF,
    referenceStandard: 'Dead Weight Tester (Pressure Balance)',
  },

  // ── 17. Capsule / Diaphragm Gauge (low pressure) ─────────────────
  {
    id: 'pr-capsule-diaphragm-gauge',
    label: 'Capsule / Diaphragm Gauge (Low Pressure)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'mbar',
    points: pts('mbar', [0, 100, 200, 300, 400]),
    typeB: tb('mbar', 0.2, 5, [hysteresisExtra('mbar', 2)]),
    units: ['mbar', 'Pa', 'kPa', 'mmH2O', 'mmHg', 'inH2O', 'psi'],
    ranges: [
      range('Low pressure (rising & falling)', 'mbar', [0, 100, 200, 300, 400],
        tb('mbar', 0.2, 5, [hysteresisExtra('mbar', 2)]), { altUnits: ['mmH2O'], rangeText: '0 – 400 mbar' }),
    ],
    procedureText:
      'Low-pressure capsule/diaphragm gauges are calibrated against a low-pressure digital ' +
      'calibrator/micromanometer over rising and falling series. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Low-pressure Digital Calibrator / Micromanometer',
  },

  // ── 18. Tyre Pressure Gauge ──────────────────────────────────────
  {
    id: 'pr-tyre-pressure-gauge',
    label: 'Tyre Pressure Gauge',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'psi',
    points: pts('psi', [0, 20, 40, 60, 80, 100]),
    typeB: tb('psi', 0.05, 1, [hysteresisExtra('psi', 0.5)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Pressure (rising & falling)', 'psi', [0, 20, 40, 60, 80, 100],
        tb('psi', 0.05, 1, [hysteresisExtra('psi', 0.5)]), { altUnits: ['bar', 'kPa', 'kg/cm²'], rangeText: '0 – 100 psi' }),
    ],
    procedureText:
      'Apply reference pressures (held by the gauge if max-retaining type) at each nominal point ' +
      'in rising and falling series and compare against the reference standard. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator',
  },

  // ── 19. Pressure Relief Valve test (setpoint) ────────────────────
  {
    id: 'pr-pressure-relief-valve',
    label: 'Pressure Relief / Safety Valve (Setpoint Test)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'bar',
    points: pts('bar', [5, 10, 16]),
    typeB: tb('bar', 0.01, 0.05, [hysteresisExtra('bar', 0.1)]),
    units: PRESSURE_UNITS,
    ranges: [
      range('Set / cracking pressure', 'bar', [5, 10, 16],
        tb('bar', 0.01, 0.05, [hysteresisExtra('bar', 0.1)]), { rangeText: '0 – 16 bar setpoint' }),
    ],
    procedureText:
      'Slowly RAISE the pressure on the inlet of the relief/safety valve until it lifts ' +
      '(set / cracking pressure) and record the reference pressure; note reseat pressure on ' +
      'FALLING pressure. Repeat to assess repeatability of the set point. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Dead Weight Tester / Digital Pressure Calibrator with high-accuracy master gauge',
  },

  // ── 20. Sphygmomanometer (pressure-only) ─────────────────────────
  {
    id: 'pr-sphygmomanometer-pressure',
    label: 'Sphygmomanometer (Pressure Channel Only)',
    discipline: 'Pressure',
    subDiscipline: 'Pressure — Positive (Gauge)',
    unit: 'mmHg',
    points: pts('mmHg', [0, 50, 100, 150, 200, 250, 300]),
    typeB: tb('mmHg', 0.3, 1, [hysteresisExtra('mmHg', 1)]),
    units: ['mmHg', 'kPa', 'mbar', 'Pa', 'inHg', 'psi'],
    ranges: [
      range('Cuff pressure (rising & falling)', 'mmHg', [0, 50, 100, 150, 200, 250, 300],
        tb('mmHg', 0.3, 1, [hysteresisExtra('mmHg', 1)]), { altUnits: ['kPa'], rangeText: '0 – 300 mmHg' }),
    ],
    procedureText:
      'NOTE: This procedure covers the PRESSURE channel only; full blood-pressure (NIBP) ' +
      'simulation/performance is covered under the Medical / Bio-Medical discipline. ' +
      'Connect the sphygmomanometer cuff/manometer to a reference pressure standard via a tee, ' +
      'apply pressures in rising and falling series at each nominal point and compare. ' + METHOD,
    nablReference: NABL_REF,
    referenceStandard: 'Digital Pressure Calibrator / NIBP analyser (pressure mode)',
  },
];
