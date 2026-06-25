// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: MASS & VOLUME
// ─────────────────────────────────────────────────────────────────
// References:
//   OIML R 111-1   — Weights of classes E1, E2, F1, F2, M1, M2, M3
//   EURAMET cg-18  — Non-Automatic Weighing Instruments (balances/scales)
//   ISO 8655       — Piston-operated volumetric apparatus (pipettes, burettes,
//                    dispensers) — gravimetric method
//   ISO 4787       — Laboratory glassware: volumetric instruments (gravimetric)
//   OIML R 76      — Non-automatic weighing instruments (high-capacity scales)
//   NABL 122       — Specific criteria for calibration laboratories (Mass & Volume)
//
// Type-B notes:
//   - Balance Type-B includes eccentricity & repeatability as inline sources.
//   - Volume (gravimetric) Type-B includes water density, evaporation, air
//     buoyancy (Z-factor) and meniscus reading.

import { Procedure, pts, tb, range, R3 } from './types';

// Inline Type-B helpers specific to Mass & Volume ────────────────────
const eccentricity = (unit: string, v: number) =>
  ({ source: 'Eccentricity error of balance', value: v, distribution: 'rectangular' as const, divisor: R3, sensitivity: 1, unit });

const repeatability = (unit: string, v: number) =>
  ({ source: 'Repeatability (std dev of balance indication)', value: v, distribution: 'normal' as const, divisor: 1, sensitivity: 1, unit });

const airBuoyancy = (unit: string, v: number) =>
  ({ source: 'Air buoyancy correction (OIML R111)', value: v, distribution: 'rectangular' as const, divisor: R3, sensitivity: 1, unit });

const waterDensity = (unit: string, v: number) =>
  ({ source: 'Water density & temperature (Z-factor)', value: v, distribution: 'rectangular' as const, divisor: R3, sensitivity: 1, unit });

const evaporation = (unit: string, v: number) =>
  ({ source: 'Evaporation loss during weighing', value: v, distribution: 'rectangular' as const, divisor: R3, sensitivity: 1, unit });

const meniscus = (unit: string, v: number) =>
  ({ source: 'Meniscus / reading error of UUC', value: v, distribution: 'triangular' as const, divisor: Math.sqrt(6), sensitivity: 1, unit });

const driftStd = (unit: string, v: number) =>
  ({ source: 'Drift / stability of reference standard', value: v, distribution: 'rectangular' as const, divisor: R3, sensitivity: 1, unit });

const tempVar = (unit: string, v: number) =>
  ({ source: 'Temperature variation of standard', value: v, distribution: 'rectangular' as const, divisor: R3, sensitivity: 1, unit });

// ── Procedure texts ─────────────────────────────────────────────────
const BALANCE_METHOD =
  'Calibration per EURAMET cg-18. Allow balance to stabilise at reference ' +
  'conditions (20±2 °C, 50±10 %RH). Tests performed using calibrated ' +
  'standard weights (OIML class as per balance class):\n' +
  '1) REPEATABILITY: load a test weight (≈50–100 % of capacity) ten times, ' +
  'record indications, compute standard deviation.\n' +
  '2) ECCENTRICITY: place ~⅓ capacity weight at centre then at four quadrant ' +
  'positions of the pan; record max deviation from centre reading.\n' +
  '3) LINEARITY / WEIGHING (indication error): load standard weights in ' +
  'increasing then decreasing steps (0, 20, 40, 60, 80, 100 % of capacity), ' +
  'record indications, evaluate error = indication − conventional mass.\n' +
  'Apply air-buoyancy correction where required. Uncertainty per EURAMET ' +
  'cg-18 combining repeatability, eccentricity, resolution, standard weight ' +
  'uncertainty and buoyancy.';

const WEIGHT_METHOD =
  'Calibration of standard weights per OIML R 111-1 by subdivision / direct ' +
  'comparison (ABBA or ABA cycle) against reference weights of one class ' +
  'higher on a calibrated comparator balance. Conventional mass reported at ' +
  'reference density 8000 kg/m³, 20 °C. Air-buoyancy correction applied from ' +
  'measured air density. Uncertainty includes comparator repeatability, ' +
  'reference weight uncertainty, buoyancy and instability of air.';

const GRAVIMETRIC_METHOD =
  'Gravimetric method per ISO 8655-6 / ISO 4787. Dispense/contain distilled ' +
  'water of known temperature onto a calibrated analytical balance. Convert ' +
  'weighed mass to volume using the Z-factor (water density, air buoyancy, ' +
  'temperature). At each test volume make ten determinations; compute mean ' +
  'volume (systematic error) and standard deviation (random error). Correct ' +
  'for evaporation and meniscus. Uncertainty combines balance uncertainty, ' +
  'Z-factor (water density & temperature), evaporation, repeatability and ' +
  'reading/meniscus.';

const DENSITY_METHOD =
  'Density/relative-density calibration by comparison with reference density ' +
  'standards (certified density reference liquids) and/or by gravimetric ' +
  'pycnometry. Temperature controlled to 20.0±0.1 °C. For digital density ' +
  'meters, calibrate with air and degassed water then verify with reference ' +
  'liquids across the range. Uncertainty includes reference liquid ' +
  'uncertainty, temperature, repeatability and resolution.';

// Standard fractional capacity points
const capPts = (cap: number) => [0, 0.2 * cap, 0.4 * cap, 0.6 * cap, 0.8 * cap, cap];

export const MASS_VOLUME: Procedure[] = [
  // ───────────────────────── MASS — Balances ─────────────────────────
  {
    id: 'mv-electronic-weighing-balance',
    label: 'Electronic Weighing Balance',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(200)),
    typeB: tb('g', 0.0002, 0.001, [
      repeatability('g', 0.0005),
      eccentricity('g', 0.0005),
      airBuoyancy('g', 0.0002),
    ]),
    units: ['g', 'mg', 'kg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(200),
        tb('g', 0.0002, 0.001, [repeatability('g', 0.0005), eccentricity('g', 0.0005)]),
        { altUnits: ['mg', 'kg'], rangeText: '0 – 200 g' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class F1 / E2 standard weights',
  },
  {
    id: 'mv-analytical-balance',
    label: 'Analytical Balance',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(220)),
    typeB: tb('g', 0.00005, 0.0001, [
      repeatability('g', 0.0001),
      eccentricity('g', 0.0002),
      airBuoyancy('g', 0.00005),
    ]),
    units: ['g', 'mg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(220),
        tb('g', 0.00005, 0.0001, [repeatability('g', 0.0001), eccentricity('g', 0.0002)]),
        { altUnits: ['mg'], rangeText: '0 – 220 g' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class E2 standard weights',
  },
  {
    id: 'mv-micro-balance',
    label: 'Micro Balance',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(5)),
    typeB: tb('g', 0.000001, 0.000001, [
      repeatability('g', 0.000002),
      eccentricity('g', 0.000003),
      airBuoyancy('g', 0.000001),
    ]),
    units: ['g', 'mg', 'µg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(5),
        tb('g', 0.000001, 0.000001, [repeatability('g', 0.000002), eccentricity('g', 0.000003)]),
        { altUnits: ['mg', 'µg'], rangeText: '0 – 5 g' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class E1 standard weights',
  },
  {
    id: 'mv-semi-micro-balance',
    label: 'Semi-micro Balance',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(120)),
    typeB: tb('g', 0.00001, 0.00001, [
      repeatability('g', 0.00002),
      eccentricity('g', 0.00003),
      airBuoyancy('g', 0.00001),
    ]),
    units: ['g', 'mg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(120),
        tb('g', 0.00001, 0.00001, [repeatability('g', 0.00002), eccentricity('g', 0.00003)]),
        { altUnits: ['mg'], rangeText: '0 – 120 g' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class E1 / E2 standard weights',
  },
  {
    id: 'mv-precision-balance',
    label: 'Precision Balance',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(2000)),
    typeB: tb('g', 0.002, 0.01, [
      repeatability('g', 0.005),
      eccentricity('g', 0.005),
      airBuoyancy('g', 0.002),
    ]),
    units: ['g', 'kg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(2000),
        tb('g', 0.002, 0.01, [repeatability('g', 0.005), eccentricity('g', 0.005)]),
        { altUnits: ['kg'], rangeText: '0 – 2000 g' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class F1 / F2 standard weights',
  },
  {
    id: 'mv-platform-scale',
    label: 'Platform Scale',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'kg',
    points: pts('kg', capPts(300)),
    typeB: tb('kg', 0.005, 0.01, [
      repeatability('kg', 0.01),
      eccentricity('kg', 0.02),
    ]),
    units: ['kg', 't'],
    ranges: [
      range('Weighing (indication error)', 'kg', capPts(300),
        tb('kg', 0.005, 0.01, [repeatability('kg', 0.01), eccentricity('kg', 0.02)]),
        { altUnits: ['t'], rangeText: '0 – 300 kg' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18 / OIML R 76',
    referenceStandard: 'OIML class M1 standard weights',
  },
  {
    id: 'mv-bench-scale',
    label: 'Bench Scale',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'kg',
    points: pts('kg', capPts(30)),
    typeB: tb('kg', 0.001, 0.005, [
      repeatability('kg', 0.002),
      eccentricity('kg', 0.003),
    ]),
    units: ['kg', 'g'],
    ranges: [
      range('Weighing (indication error)', 'kg', capPts(30),
        tb('kg', 0.001, 0.005, [repeatability('kg', 0.002), eccentricity('kg', 0.003)]),
        { altUnits: ['g'], rangeText: '0 – 30 kg' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18 / OIML R 76',
    referenceStandard: 'OIML class M1 / F2 standard weights',
  },
  {
    id: 'mv-weighbridge',
    label: 'Weighbridge',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'kg',
    points: pts('kg', capPts(60000)),
    typeB: tb('kg', 5, 10, [
      repeatability('kg', 10),
      eccentricity('kg', 20),
    ]),
    units: ['kg', 't'],
    ranges: [
      range('Weighing (indication error)', 'kg', capPts(60000),
        tb('kg', 5, 10, [repeatability('kg', 10), eccentricity('kg', 20)]),
        { altUnits: ['t'], rangeText: '0 – 60000 kg' }),
    ],
    procedureText: BALANCE_METHOD +
      '\nBuild-up (substitution) method used above the available standard-weight ' +
      'mass per OIML R 76 / EURAMET cg-18.',
    nablReference: 'EURAMET cg-18 / OIML R 76',
    referenceStandard: 'OIML class M1 / M2 standard weights (build-up)',
  },
  {
    id: 'mv-crane-scale',
    label: 'Crane Scale',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'kg',
    points: pts('kg', capPts(5000)),
    typeB: tb('kg', 0.5, 1, [
      repeatability('kg', 1),
      eccentricity('kg', 2),
    ]),
    units: ['kg', 't'],
    ranges: [
      range('Weighing (indication error)', 'kg', capPts(5000),
        tb('kg', 0.5, 1, [repeatability('kg', 1), eccentricity('kg', 2)]),
        { altUnits: ['t'], rangeText: '0 – 5000 kg' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18 / OIML R 76',
    referenceStandard: 'OIML class M1 / M2 standard weights',
  },
  {
    id: 'mv-counting-scale',
    label: 'Counting Scale',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'kg',
    points: pts('kg', capPts(6)),
    typeB: tb('kg', 0.0005, 0.001, [
      repeatability('kg', 0.001),
      eccentricity('kg', 0.001),
    ]),
    units: ['kg', 'g'],
    ranges: [
      range('Weighing (indication error)', 'kg', capPts(6),
        tb('kg', 0.0005, 0.001, [repeatability('kg', 0.001), eccentricity('kg', 0.001)]),
        { altUnits: ['g'], rangeText: '0 – 6 kg' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class F2 / M1 standard weights',
  },
  {
    id: 'mv-moisture-balance',
    label: 'Moisture Balance (mass part)',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(110)),
    typeB: tb('g', 0.0005, 0.001, [
      repeatability('g', 0.001),
      eccentricity('g', 0.001),
    ]),
    units: ['g', 'mg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(110),
        tb('g', 0.0005, 0.001, [repeatability('g', 0.001), eccentricity('g', 0.001)]),
        { altUnits: ['mg'], rangeText: '0 – 110 g' }),
    ],
    procedureText: BALANCE_METHOD +
      '\nOnly the mass-weighing function is calibrated; the heating/drying ' +
      'function is verified separately.',
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class F1 standard weights',
  },
  {
    id: 'mv-single-pan-balance',
    label: 'Single Pan Balance',
    discipline: 'Mass & Volume',
    subDiscipline: 'Mass',
    unit: 'g',
    points: pts('g', capPts(200)),
    typeB: tb('g', 0.0002, 0.0001, [
      repeatability('g', 0.0002),
      eccentricity('g', 0.0003),
    ]),
    units: ['g', 'mg'],
    ranges: [
      range('Weighing (indication error)', 'g', capPts(200),
        tb('g', 0.0002, 0.0001, [repeatability('g', 0.0002), eccentricity('g', 0.0003)]),
        { altUnits: ['mg'], rangeText: '0 – 200 g' }),
    ],
    procedureText: BALANCE_METHOD,
    nablReference: 'EURAMET cg-18',
    referenceStandard: 'OIML class E2 / F1 standard weights',
  },

  // ───────────────────────── WEIGHTS ─────────────────────────
  {
    id: 'mv-standard-weights-weight-box',
    label: 'Standard Weights / Weight Box (E2/F1/F2/M1)',
    discipline: 'Mass & Volume',
    subDiscipline: 'Weights',
    unit: 'g',
    points: pts('g', [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]),
    typeB: tb('g', 0.0001, 0.00001, [
      repeatability('g', 0.0001),
      airBuoyancy('g', 0.00005),
      tempVar('g', 0.00002),
      driftStd('g', 0.00005),
    ]),
    units: ['g', 'mg', 'kg'],
    ranges: [
      range('Conventional mass (mg sub-set)', 'mg', [1, 2, 5, 10, 20, 50, 100, 200, 500],
        tb('mg', 0.001, 0.0001, [repeatability('mg', 0.001), airBuoyancy('mg', 0.0005)]),
        { rangeText: '1 – 500 mg' }),
      range('Conventional mass (g sub-set)', 'g', [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
        tb('g', 0.0001, 0.00001, [repeatability('g', 0.0001), airBuoyancy('g', 0.00005)]),
        { altUnits: ['mg'], rangeText: '1 g – 1 kg' }),
      range('Conventional mass (kg sub-set)', 'kg', [2, 5, 10, 20],
        tb('kg', 0.0002, 0.0001, [repeatability('kg', 0.0002), airBuoyancy('kg', 0.0001)]),
        { rangeText: '2 – 20 kg' }),
    ],
    procedureText: WEIGHT_METHOD,
    nablReference: 'OIML R 111-1',
    referenceStandard: 'OIML class E1 / E2 reference weights + mass comparator',
  },

  // ───────────────────────── VOLUME — POVA (ISO 8655) ─────────────────
  {
    id: 'mv-micropipette',
    label: 'Micropipette (single channel)',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'µL',
    points: pts('µL', [100, 500, 1000]), // 10%, 50%, 100% of 1000 µL nominal
    typeB: tb('µL', 0.05, 0.1, [
      repeatability('µL', 0.3),
      waterDensity('µL', 0.02),
      evaporation('µL', 0.05),
    ]),
    units: ['µL', 'mL'],
    ranges: [
      range('Delivered volume (ISO 8655 test volumes)', 'µL', [100, 500, 1000],
        tb('µL', 0.05, 0.1, [repeatability('µL', 0.3), waterDensity('µL', 0.02), evaporation('µL', 0.05)]),
        { rangeText: '10 % – 100 % of nominal' }),
    ],
    procedureText: GRAVIMETRIC_METHOD,
    nablReference: 'ISO 8655-2 / ISO 8655-6',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-multichannel-pipette',
    label: 'Multichannel Pipette',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'µL',
    points: pts('µL', [30, 150, 300]), // 10%, 50%, 100% of 300 µL nominal
    typeB: tb('µL', 0.03, 0.05, [
      repeatability('µL', 0.2),
      waterDensity('µL', 0.01),
      evaporation('µL', 0.03),
    ]),
    units: ['µL', 'mL'],
    ranges: [
      range('Delivered volume per channel (ISO 8655)', 'µL', [30, 150, 300],
        tb('µL', 0.03, 0.05, [repeatability('µL', 0.2), waterDensity('µL', 0.01), evaporation('µL', 0.03)]),
        { rangeText: '10 % – 100 % of nominal, all channels' }),
    ],
    procedureText: GRAVIMETRIC_METHOD +
      '\nEach channel evaluated independently per ISO 8655-2.',
    nablReference: 'ISO 8655-2 / ISO 8655-6',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-bottle-top-dispenser',
    label: 'Auto-dispenser / Bottle-top Dispenser',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'mL',
    points: pts('mL', [5, 25, 50]), // 10%, 50%, 100% of 50 mL nominal
    typeB: tb('mL', 0.01, 0.05, [
      repeatability('mL', 0.02),
      waterDensity('mL', 0.005),
      evaporation('mL', 0.005),
    ]),
    units: ['mL', 'L'],
    ranges: [
      range('Delivered volume (ISO 8655-5)', 'mL', [5, 25, 50],
        tb('mL', 0.01, 0.05, [repeatability('mL', 0.02), waterDensity('mL', 0.005)]),
        { rangeText: '10 % – 100 % of nominal' }),
    ],
    procedureText: GRAVIMETRIC_METHOD,
    nablReference: 'ISO 8655-5 / ISO 8655-6',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-burette',
    label: 'Burette',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'mL',
    points: pts('mL', [5, 10, 25, 50]),
    typeB: tb('mL', 0.01, 0.05, [
      repeatability('mL', 0.01),
      waterDensity('mL', 0.005),
      meniscus('mL', 0.02),
    ]),
    units: ['mL'],
    ranges: [
      range('Delivered volume (ISO 385 / gravimetric)', 'mL', [5, 10, 25, 50],
        tb('mL', 0.01, 0.05, [repeatability('mL', 0.01), waterDensity('mL', 0.005), meniscus('mL', 0.02)]),
        { rangeText: '0 – 50 mL' }),
    ],
    procedureText: GRAVIMETRIC_METHOD +
      '\nDelivery (Ex) instrument: account for drainage waiting time per ISO 4787.',
    nablReference: 'ISO 4787 / ISO 385',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-volumetric-pipette',
    label: 'Volumetric Pipette',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'mL',
    points: pts('mL', [1, 5, 10, 25]),
    typeB: tb('mL', 0.005, 0.01, [
      repeatability('mL', 0.005),
      waterDensity('mL', 0.003),
      meniscus('mL', 0.01),
    ]),
    units: ['mL'],
    ranges: [
      range('Delivered volume (ISO 648 / gravimetric)', 'mL', [1, 5, 10, 25],
        tb('mL', 0.005, 0.01, [repeatability('mL', 0.005), waterDensity('mL', 0.003), meniscus('mL', 0.01)]),
        { rangeText: '1 – 25 mL' }),
    ],
    procedureText: GRAVIMETRIC_METHOD,
    nablReference: 'ISO 4787 / ISO 648',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-volumetric-flask',
    label: 'Volumetric Flask',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'mL',
    points: pts('mL', [10, 25, 50, 100, 250, 500, 1000]),
    typeB: tb('mL', 0.02, 0.05, [
      repeatability('mL', 0.01),
      waterDensity('mL', 0.01),
      meniscus('mL', 0.03),
    ]),
    units: ['mL', 'L'],
    ranges: [
      range('Contained volume (ISO 1042 / gravimetric)', 'mL', [10, 25, 50, 100, 250, 500, 1000],
        tb('mL', 0.02, 0.05, [repeatability('mL', 0.01), waterDensity('mL', 0.01), meniscus('mL', 0.03)]),
        { altUnits: ['L'], rangeText: '10 – 1000 mL' }),
    ],
    procedureText: GRAVIMETRIC_METHOD +
      '\nContain (In) instrument calibrated to the graduation line per ISO 4787.',
    nablReference: 'ISO 4787 / ISO 1042',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-measuring-cylinder',
    label: 'Measuring Cylinder',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'mL',
    points: pts('mL', [10, 25, 50, 100, 250, 500, 1000]),
    typeB: tb('mL', 0.1, 0.5, [
      repeatability('mL', 0.05),
      waterDensity('mL', 0.02),
      meniscus('mL', 0.2),
    ]),
    units: ['mL', 'L'],
    ranges: [
      range('Volume (ISO 4788 / gravimetric)', 'mL', [10, 25, 50, 100, 250, 500, 1000],
        tb('mL', 0.1, 0.5, [repeatability('mL', 0.05), waterDensity('mL', 0.02), meniscus('mL', 0.2)]),
        { altUnits: ['L'], rangeText: '10 – 1000 mL' }),
    ],
    procedureText: GRAVIMETRIC_METHOD,
    nablReference: 'ISO 4787 / ISO 4788',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-conical-flask',
    label: 'Measuring / Conical Flask',
    discipline: 'Mass & Volume',
    subDiscipline: 'Volume',
    unit: 'mL',
    points: pts('mL', [25, 50, 100, 250, 500]),
    typeB: tb('mL', 0.2, 1, [
      repeatability('mL', 0.1),
      waterDensity('mL', 0.05),
      meniscus('mL', 0.3),
    ]),
    units: ['mL', 'L'],
    ranges: [
      range('Volume (gravimetric)', 'mL', [25, 50, 100, 250, 500],
        tb('mL', 0.2, 1, [repeatability('mL', 0.1), waterDensity('mL', 0.05), meniscus('mL', 0.3)]),
        { altUnits: ['L'], rangeText: '25 – 500 mL' }),
    ],
    procedureText: GRAVIMETRIC_METHOD,
    nablReference: 'ISO 4787',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },

  // ───────────────────────── DENSITY ─────────────────────────
  {
    id: 'mv-density-meter',
    label: 'Density Meter',
    discipline: 'Mass & Volume',
    subDiscipline: 'Density',
    unit: 'g/cm³',
    points: pts('g/cm³', [0.6, 0.8, 1.0, 1.2, 1.5]),
    typeB: tb('g/cm³', 0.00005, 0.00001, [
      repeatability('g/cm³', 0.00002),
      tempVar('g/cm³', 0.00003),
    ]),
    units: ['g/cm³', 'kg/m³'],
    ranges: [
      range('Density', 'g/cm³', [0.6, 0.8, 1.0, 1.2, 1.5],
        tb('g/cm³', 0.00005, 0.00001, [repeatability('g/cm³', 0.00002), tempVar('g/cm³', 0.00003)]),
        { altUnits: ['kg/m³'], rangeText: '0.6 – 1.5 g/cm³' }),
    ],
    procedureText: DENSITY_METHOD,
    nablReference: 'NABL 122 / OIML R 111 (buoyancy)',
    referenceStandard: 'Certified density reference liquids + degassed water',
  },
  {
    id: 'mv-hydrometer',
    label: 'Hydrometer',
    discipline: 'Mass & Volume',
    subDiscipline: 'Density',
    unit: 'g/cm³',
    points: pts('g/cm³', [0.7, 0.8, 0.9, 1.0, 1.1]),
    typeB: tb('g/cm³', 0.0002, 0.0005, [
      repeatability('g/cm³', 0.0001),
      tempVar('g/cm³', 0.0001),
      meniscus('g/cm³', 0.0002),
    ]),
    units: ['g/cm³', 'kg/m³'],
    ranges: [
      range('Density (Cuckow / comparison method)', 'g/cm³', [0.7, 0.8, 0.9, 1.0, 1.1],
        tb('g/cm³', 0.0002, 0.0005, [repeatability('g/cm³', 0.0001), meniscus('g/cm³', 0.0002)]),
        { altUnits: ['kg/m³'], rangeText: '0.7 – 1.1 g/cm³' }),
    ],
    procedureText: DENSITY_METHOD +
      '\nCalibrated by Cuckow method (hydrostatic weighing) or by comparison ' +
      'against a reference hydrometer in liquids of known density at 20 °C.',
    nablReference: 'OIML R 44 / NABL 122',
    referenceStandard: 'Reference hydrometer / Cuckow standard',
  },
  {
    id: 'mv-pycnometer',
    label: 'Specific Gravity Bottle (Pycnometer)',
    discipline: 'Mass & Volume',
    subDiscipline: 'Density',
    unit: 'g/cm³',
    points: pts('g/cm³', [0.8, 1.0, 1.2]),
    typeB: tb('g/cm³', 0.0001, 0.0001, [
      repeatability('g/cm³', 0.00005),
      tempVar('g/cm³', 0.00005),
      airBuoyancy('g/cm³', 0.00003),
    ]),
    units: ['g/cm³', 'kg/m³'],
    ranges: [
      range('Volume / density (gravimetric)', 'g/cm³', [0.8, 1.0, 1.2],
        tb('g/cm³', 0.0001, 0.0001, [repeatability('g/cm³', 0.00005), airBuoyancy('g/cm³', 0.00003)]),
        { altUnits: ['kg/m³'], rangeText: '0.8 – 1.2 g/cm³' }),
    ],
    procedureText: DENSITY_METHOD +
      '\nVolume of the pycnometer determined gravimetrically with water; density ' +
      'of a test liquid then derived from weighed mass at 20 °C.',
    nablReference: 'ISO 4787 / NABL 122',
    referenceStandard: 'Calibrated analytical balance + distilled water',
  },
  {
    id: 'mv-lactometer',
    label: 'Lactometer',
    discipline: 'Mass & Volume',
    subDiscipline: 'Density',
    unit: 'g/cm³',
    points: pts('g/cm³', [1.015, 1.025, 1.035]),
    typeB: tb('g/cm³', 0.0002, 0.0005, [
      repeatability('g/cm³', 0.0001),
      tempVar('g/cm³', 0.0001),
      meniscus('g/cm³', 0.0002),
    ]),
    units: ['g/cm³', 'kg/m³'],
    ranges: [
      range('Milk density', 'g/cm³', [1.015, 1.025, 1.035],
        tb('g/cm³', 0.0002, 0.0005, [repeatability('g/cm³', 0.0001), meniscus('g/cm³', 0.0002)]),
        { altUnits: ['kg/m³'], rangeText: '1.015 – 1.035 g/cm³' }),
    ],
    procedureText: DENSITY_METHOD +
      '\nLactometer (a special-scale hydrometer) calibrated by comparison ' +
      'against a reference hydrometer in liquids of known density at the ' +
      'reference temperature.',
    nablReference: 'OIML R 44 / NABL 122',
    referenceStandard: 'Reference hydrometer + certified liquids',
  },
];
