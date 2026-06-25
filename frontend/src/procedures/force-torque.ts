// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: FORCE & TORQUE (incl. Hardness)
// ─────────────────────────────────────────────────────────────────
// Method basis:
//   • Force proving / load measurement .... ISO 376, EURAMET cg-04, ASTM E74
//   • Testing machines (UTM/Tensile/Comp) . ISO 7500-1, ASTM E4
//   • Torque tools (wrench/screwdriver) ... ISO 6789, EURAMET cg-14
//   • Torque transducers / analyzers ...... ISO 6789-2, DKD-R 3-7
//   • Rockwell hardness ................... ISO 6508-2 / ASTM E18
//   • Brinell hardness .................... ISO 6506-2 / ASTM E10
//   • Vickers / Micro-Vickers ............. ISO 6507-2 / ASTM E384
//   • Shore durometer ..................... ISO 7619-1 / ASTM D2240
//   • Leeb / portable hardness ........... ISO 16859 / ASTM A956
//   • Impact (Charpy / Izod) ............. ISO 148-2 / ASTM E23
//   • Pull-off adhesion .................. ISO 4624 / ASTM D4541
//
// NABL reference: NABL 126 (Mechanical) calibration scope, ISO/IEC 17025.
// Each instrument records increasing & decreasing series, repeatability,
// reproducibility (rotated position), hysteresis and zero/return error.

import { Procedure, pts, tb, range, hysteresisExtra } from './types';

// ── Common NABL method narratives ─────────────────────────────────
const FORCE_METHOD =
  'Mount the UUC in the calibration machine / against the force-proving standard ' +
  'along the line of force. Pre-load to maximum force three times and return to ' +
  'zero. Apply at least one increasing series of forces at the standard points ' +
  '(≈20, 40, 60, 80, 100 % of range) and one decreasing series; record indicated ' +
  'vs. applied force. Repeat the increasing series in at least two rotated ' +
  'mounting positions (0°, 120°/180°, 240°) for reproducibility, and three ' +
  'repeated runs at each point for repeatability. Compute relative reproducibility, ' +
  'repeatability, interpolation/zero error and hysteresis (difference between ' +
  'increasing and decreasing readings) per ISO 376 / ISO 7500-1. Expanded ' +
  'uncertainty reported at k=2 (~95 %).';

const TORQUE_TOOL_METHOD =
  'Per ISO 6789: condition the tool by exercising it 5 times at maximum torque. ' +
  'Apply torque slowly through a calibrated torque transducer at 20 %, 60 % and ' +
  '100 % of the maximum scale value (Type I indicating / Type II setting tools). ' +
  'Take 5 (Type II) or 10 (Type I) measurements at each test torque. Compute mean ' +
  'deviation from target, relative measurement error and reproducibility b’. ' +
  'For click/setting wrenches the permissible deviation is ±6 % (≤ 10 N·m: ±6 %); ' +
  'report expanded uncertainty at k=2.';

const TORQUE_XDCR_METHOD =
  'Per ISO 6789-2 / DKD-R 3-7: mount the transducer on the reference torque ' +
  'standard machine. Pre-load to maximum torque, then apply increasing and ' +
  'decreasing series in both clockwise and (where applicable) counter-clockwise ' +
  'directions at the standard points. Determine repeatability with/without ' +
  'rotation, reproducibility, reversibility (hysteresis), interpolation and zero ' +
  'error. Expanded uncertainty at k=2.';

const HARDNESS_METHOD =
  'Indirect (performance) verification per the relevant ISO 650x-2 / ASTM ' +
  'standard using certified reference hardness blocks at low, medium and high ' +
  'levels of each scale. Level the block on the anvil; make 5 indentations per ' +
  'block spaced per standard. Compute the error (mean measured − certified value) ' +
  'and the repeatability (range of the 5 readings, or relative repeatability r). ' +
  'Direct verification of test force, indenter and measuring system performed as ' +
  'required. Expanded uncertainty at k=2 combines block certificate, machine ' +
  'repeatability and resolution.';

const IMPACT_METHOD =
  'Per ISO 148-2 / ASTM E23: indirect verification with certified reference test ' +
  'pieces (low, high absorbed-energy levels). Verify zero (free-swing) loss, ' +
  'friction and windage, pendulum geometry and striker. Break 5 reference ' +
  'specimens per energy level; compute mean absorbed energy, bias from certified ' +
  'value and repeatability. Expanded uncertainty at k=2.';

const ADHESION_METHOD =
  'Per ISO 4624 / ASTM D4541: calibrate the hydraulic/spring pull-off tester as a ' +
  'force/stress source against a reference load cell. Apply increasing pull-off ' +
  'load at the standard points, record indicated vs. reference. Determine error, ' +
  'repeatability and hysteresis; report expanded uncertainty at k=2.';

const SPRING_METHOD =
  'Per ISO 7500-1 force-verification of the spring-testing machine using a ' +
  'force-proving instrument (load cell). Apply increasing and decreasing series at ' +
  'the standard points; for combined load/displacement also verify the ' +
  'displacement scale. Compute relative error, repeatability and hysteresis; ' +
  'expanded uncertainty at k=2.';

// Common alt-unit sets
const FORCE_ALT = ['kN', 'kgf', 'lbf'];
const TORQUE_ALT = ['kgf·cm', 'lbf·ft', 'N·cm'];

export const FORCE_TORQUE: Procedure[] = [
  // ───────────────────────── FORCE ─────────────────────────
  {
    id: 'ft-force-gauge',
    label: 'Force Gauge / Push-Pull Gauge',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'N',
    points: pts('N', [100, 200, 300, 400, 500]),
    typeB: tb('N', 0.1, 0.1, [hysteresisExtra('N', 0.15)]),
    units: ['N', ...FORCE_ALT],
    ranges: [
      range('Force (Compression / Tension)', 'N', [100, 200, 300, 400, 500],
        tb('N', 0.1, 0.1, [hysteresisExtra('N', 0.15)]),
        { altUnits: FORCE_ALT, rangeText: '0 – 500 N' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / EURAMET cg-04',
    referenceStandard: 'Class 1 reference load cell with indicator (ISO 376)',
  },
  {
    id: 'ft-digital-force-gauge',
    label: 'Digital Force Gauge',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'N',
    points: pts('N', [200, 400, 600, 800, 1000]),
    typeB: tb('N', 0.2, 0.01, [hysteresisExtra('N', 0.2)]),
    units: ['N', ...FORCE_ALT],
    ranges: [
      range('Force (CW / CCW)', 'N', [200, 400, 600, 800, 1000],
        tb('N', 0.2, 0.01, [hysteresisExtra('N', 0.2)]),
        { altUnits: FORCE_ALT, rangeText: '0 – 1000 N' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / EURAMET cg-04',
    referenceStandard: 'Class 1 force-proving instrument (load cell + indicator)',
  },
  {
    id: 'ft-load-cell',
    label: 'Load Cell',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [10, 20, 30, 40, 50]),
    typeB: tb('kN', 0.005, 0.001, [hysteresisExtra('kN', 0.008)]),
    units: ['kN', 'N', 'kgf', 'lbf'],
    ranges: [
      range('Force (Tension)', 'kN', [10, 20, 30, 40, 50],
        tb('kN', 0.005, 0.001, [hysteresisExtra('kN', 0.008)]),
        { altUnits: ['N', 'kgf', 'lbf'], rangeText: '0 – 50 kN' }),
      range('Force (Compression)', 'kN', [10, 20, 30, 40, 50],
        tb('kN', 0.005, 0.001, [hysteresisExtra('kN', 0.008)]),
        { altUnits: ['N', 'kgf', 'lbf'], rangeText: '0 – 50 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 376',
    referenceStandard: 'Dead-weight force machine / reference Class 00 load cell',
  },
  {
    id: 'ft-utm',
    label: 'Universal Testing Machine (UTM)',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [20, 40, 60, 80, 100]),
    typeB: tb('kN', 0.02, 0.01, [hysteresisExtra('kN', 0.05)]),
    units: ['kN', 'N', 'kgf'],
    ranges: [
      range('Force (Tension)', 'kN', [20, 40, 60, 80, 100],
        tb('kN', 0.02, 0.01, [hysteresisExtra('kN', 0.05)]),
        { altUnits: ['N', 'kgf'], rangeText: '0 – 100 kN' }),
      range('Force (Compression)', 'kN', [20, 40, 60, 80, 100],
        tb('kN', 0.02, 0.01, [hysteresisExtra('kN', 0.05)]),
        { altUnits: ['N', 'kgf'], rangeText: '0 – 100 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 7500-1 / ASTM E4',
    referenceStandard: 'Class 0.5 reference force-proving instrument (ISO 376)',
  },
  {
    id: 'ft-tensile-testing-machine',
    label: 'Tensile Testing Machine',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [10, 20, 30, 40, 50]),
    typeB: tb('kN', 0.015, 0.01, [hysteresisExtra('kN', 0.04)]),
    units: ['kN', 'N', 'kgf'],
    ranges: [
      range('Force (Tension)', 'kN', [10, 20, 30, 40, 50],
        tb('kN', 0.015, 0.01, [hysteresisExtra('kN', 0.04)]),
        { altUnits: ['N', 'kgf'], rangeText: '0 – 50 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 7500-1',
    referenceStandard: 'Class 0.5 force-proving load cell (ISO 376)',
  },
  {
    id: 'ft-compression-testing-machine',
    label: 'Compression Testing Machine',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [400, 800, 1200, 1600, 2000]),
    typeB: tb('kN', 0.5, 0.1, [hysteresisExtra('kN', 1.0)]),
    units: ['kN', 'N', 'kgf'],
    ranges: [
      range('Force (Compression)', 'kN', [400, 800, 1200, 1600, 2000],
        tb('kN', 0.5, 0.1, [hysteresisExtra('kN', 1.0)]),
        { altUnits: ['N', 'kgf'], rangeText: '0 – 2000 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 7500-1 / ASTM E4',
    referenceStandard: 'Class 1 reference load cell / proving ring (ISO 376)',
  },
  {
    id: 'ft-proving-ring',
    label: 'Proving Ring',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [5, 10, 15, 20, 25]),
    typeB: tb('kN', 0.003, 0.0005, [hysteresisExtra('kN', 0.004)]),
    units: ['kN', 'N', 'kgf'],
    ranges: [
      range('Force (Compression)', 'kN', [5, 10, 15, 20, 25],
        tb('kN', 0.003, 0.0005, [hysteresisExtra('kN', 0.004)]),
        { altUnits: ['N', 'kgf'], rangeText: '0 – 25 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 376 / ASTM E74',
    referenceStandard: 'Dead-weight force standard machine',
  },
  {
    id: 'ft-dynamometer',
    label: 'Dynamometer',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [10, 20, 30, 40, 50]),
    typeB: tb('kN', 0.02, 0.01, [hysteresisExtra('kN', 0.03)]),
    units: ['kN', 'N', 'kgf', 'lbf'],
    ranges: [
      range('Force (Tension / Compression)', 'kN', [10, 20, 30, 40, 50],
        tb('kN', 0.02, 0.01, [hysteresisExtra('kN', 0.03)]),
        { altUnits: ['N', 'kgf', 'lbf'], rangeText: '0 – 50 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 376',
    referenceStandard: 'Reference force-proving instrument (ISO 376)',
  },
  {
    id: 'ft-crane-scale',
    label: 'Crane Scale (force mode)',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'kN',
    points: pts('kN', [20, 40, 60, 80, 100]),
    typeB: tb('kN', 0.05, 0.05, [hysteresisExtra('kN', 0.1)]),
    units: ['kN', 'N', 'kgf'],
    ranges: [
      range('Force (Tension / Load)', 'kN', [20, 40, 60, 80, 100],
        tb('kN', 0.05, 0.05, [hysteresisExtra('kN', 0.1)]),
        { altUnits: ['N', 'kgf'], rangeText: '0 – 100 kN' }),
    ],
    procedureText: FORCE_METHOD,
    nablReference: 'NABL 126 / ISO 7500-1',
    referenceStandard: 'Reference tension load cell (ISO 376)',
  },

  // ───────────────────── SPRING & IMPACT ─────────────────────
  {
    id: 'ft-spring-testing-machine',
    label: 'Spring Testing Machine',
    discipline: 'Force & Torque',
    subDiscipline: 'Spring & Impact',
    unit: 'N',
    points: pts('N', [200, 400, 600, 800, 1000]),
    typeB: tb('N', 0.2, 0.1, [hysteresisExtra('N', 0.3)]),
    units: ['N', 'kN', 'kgf'],
    ranges: [
      range('Force (Spring load)', 'N', [200, 400, 600, 800, 1000],
        tb('N', 0.2, 0.1, [hysteresisExtra('N', 0.3)]),
        { altUnits: ['kN', 'kgf'], rangeText: '0 – 1000 N' }),
      range('Displacement', 'mm', [20, 40, 60, 80, 100],
        tb('mm', 0.01, 0.01, [hysteresisExtra('mm', 0.02)]),
        { rangeText: '0 – 100 mm' }),
    ],
    procedureText: SPRING_METHOD,
    nablReference: 'NABL 126 / ISO 7500-1',
    referenceStandard: 'Class 1 force-proving load cell + gauge blocks / scale',
  },
  {
    id: 'ft-impact-testing-machine',
    label: 'Impact Testing Machine (Charpy / Izod)',
    discipline: 'Force & Torque',
    subDiscipline: 'Spring & Impact',
    unit: 'J',
    points: pts('J', [50, 150, 300]),
    typeB: tb('J', 0.5, 0.5, [hysteresisExtra('J', 1.0)]),
    units: ['J'],
    ranges: [
      range('Absorbed Energy (Charpy)', 'J', [50, 150, 300],
        tb('J', 0.5, 0.5, [hysteresisExtra('J', 1.0)]),
        { rangeText: '0 – 300 J (low / medium / high reference)' }),
      range('Absorbed Energy (Izod)', 'J', [20, 80, 160],
        tb('J', 0.4, 0.5, [hysteresisExtra('J', 0.8)]),
        { rangeText: '0 – 160 J' }),
    ],
    procedureText: IMPACT_METHOD,
    nablReference: 'NABL 126 / ISO 148-2 / ASTM E23',
    referenceStandard: 'Certified reference Charpy V-notch test pieces (NIST/IRMM)',
  },

  // ───────────────────────── TORQUE ─────────────────────────
  {
    id: 'ft-torque-wrench',
    label: 'Torque Wrench (click / dial / digital)',
    discipline: 'Force & Torque',
    subDiscipline: 'Torque',
    unit: 'N·m',
    points: pts('N·m', [40, 120, 200]),
    typeB: tb('N·m', 0.2, 0.1, [hysteresisExtra('N·m', 0.4)]),
    units: ['N·m', ...TORQUE_ALT],
    ranges: [
      range('Torque (20 / 60 / 100 % per ISO 6789)', 'N·m', [40, 120, 200],
        tb('N·m', 0.2, 0.1, [hysteresisExtra('N·m', 0.4)]),
        { altUnits: TORQUE_ALT, rangeText: '40 – 200 N·m' }),
    ],
    procedureText: TORQUE_TOOL_METHOD,
    nablReference: 'NABL 126 / ISO 6789-1/-2 / EURAMET cg-14',
    referenceStandard: 'Reference torque transducer + calibration bench (Class A)',
  },
  {
    id: 'ft-torque-screwdriver',
    label: 'Torque Screwdriver',
    discipline: 'Force & Torque',
    subDiscipline: 'Torque',
    unit: 'N·m',
    points: pts('N·m', [1, 3, 5]),
    typeB: tb('N·m', 0.01, 0.01, [hysteresisExtra('N·m', 0.02)]),
    units: ['N·m', 'N·cm', 'kgf·cm', 'lbf·ft'],
    ranges: [
      range('Torque (20 / 60 / 100 % per ISO 6789)', 'N·m', [1, 3, 5],
        tb('N·m', 0.01, 0.01, [hysteresisExtra('N·m', 0.02)]),
        { altUnits: ['N·cm', 'kgf·cm', 'lbf·ft'], rangeText: '1 – 5 N·m' }),
    ],
    procedureText: TORQUE_TOOL_METHOD,
    nablReference: 'NABL 126 / ISO 6789-1/-2',
    referenceStandard: 'Reference torque transducer bench (low range)',
  },
  {
    id: 'ft-torque-tester-transducer',
    label: 'Torque Tester / Transducer',
    discipline: 'Force & Torque',
    subDiscipline: 'Torque',
    unit: 'N·m',
    points: pts('N·m', [20, 40, 60, 80, 100]),
    typeB: tb('N·m', 0.02, 0.01, [hysteresisExtra('N·m', 0.03)]),
    units: ['N·m', ...TORQUE_ALT],
    ranges: [
      range('Torque (CW)', 'N·m', [20, 40, 60, 80, 100],
        tb('N·m', 0.02, 0.01, [hysteresisExtra('N·m', 0.03)]),
        { altUnits: TORQUE_ALT, rangeText: '0 – 100 N·m' }),
      range('Torque (CCW)', 'N·m', [20, 40, 60, 80, 100],
        tb('N·m', 0.02, 0.01, [hysteresisExtra('N·m', 0.03)]),
        { altUnits: TORQUE_ALT, rangeText: '0 – 100 N·m' }),
    ],
    procedureText: TORQUE_XDCR_METHOD,
    nablReference: 'NABL 126 / ISO 6789-2 / DKD-R 3-7',
    referenceStandard: 'Reference torque standard machine (Class 0.1)',
  },
  {
    id: 'ft-torque-analyzer',
    label: 'Torque Analyzer',
    discipline: 'Force & Torque',
    subDiscipline: 'Torque',
    unit: 'N·m',
    points: pts('N·m', [50, 100, 150, 200, 250]),
    typeB: tb('N·m', 0.05, 0.01, [hysteresisExtra('N·m', 0.05)]),
    units: ['N·m', ...TORQUE_ALT],
    ranges: [
      range('Torque (CW / CCW)', 'N·m', [50, 100, 150, 200, 250],
        tb('N·m', 0.05, 0.01, [hysteresisExtra('N·m', 0.05)]),
        { altUnits: TORQUE_ALT, rangeText: '0 – 250 N·m' }),
    ],
    procedureText: TORQUE_XDCR_METHOD,
    nablReference: 'NABL 126 / ISO 6789-2 / DKD-R 3-7',
    referenceStandard: 'Reference torque standard machine (Class 0.1)',
  },
  {
    id: 'ft-torque-multiplier',
    label: 'Torque Multiplier',
    discipline: 'Force & Torque',
    subDiscipline: 'Torque',
    unit: 'N·m',
    points: pts('N·m', [400, 800, 1200, 1600, 2000]),
    typeB: tb('N·m', 1.0, 0.5, [hysteresisExtra('N·m', 2.0)]),
    units: ['N·m', 'kgf·cm', 'lbf·ft'],
    ranges: [
      range('Output Torque (CW)', 'N·m', [400, 800, 1200, 1600, 2000],
        tb('N·m', 1.0, 0.5, [hysteresisExtra('N·m', 2.0)]),
        { altUnits: ['kgf·cm', 'lbf·ft'], rangeText: '0 – 2000 N·m' }),
    ],
    procedureText:
      'Per ISO 6789-2: apply input torque and measure the multiplied output torque ' +
      'on a high-capacity reference torque standard machine at the standard points ' +
      'in increasing and decreasing series. Determine the actual multiplication ' +
      'ratio, its deviation from nominal, repeatability and hysteresis; expanded ' +
      'uncertainty at k=2.',
    nablReference: 'NABL 126 / ISO 6789-2',
    referenceStandard: 'High-capacity reference torque standard machine',
  },

  // ──────────────────────── HARDNESS ────────────────────────
  {
    id: 'ft-rockwell-hardness-tester',
    label: 'Rockwell Hardness Tester',
    discipline: 'Force & Torque',
    subDiscipline: 'Hardness',
    unit: 'HRC',
    points: pts('HRC', [25, 45, 63]),
    typeB: tb('HRC', 0.3, 0.1, [hysteresisExtra('HRC', 0.4)]),
    units: ['HRC', 'HRB'],
    ranges: [
      range('Hardness (HRC scale, low/med/high blocks)', 'HRC', [25, 45, 63],
        tb('HRC', 0.3, 0.1, [hysteresisExtra('HRC', 0.4)]),
        { rangeText: '20 – 65 HRC' }),
      range('Hardness (HRB scale, low/med/high blocks)', 'HRB', [30, 65, 95],
        tb('HRB', 0.4, 0.1, [hysteresisExtra('HRB', 0.5)]),
        { rangeText: '20 – 100 HRB' }),
    ],
    procedureText: HARDNESS_METHOD,
    nablReference: 'NABL 126 / ISO 6508-2 / ASTM E18',
    referenceStandard: 'Certified Rockwell reference hardness blocks (HRC / HRB)',
  },
  {
    id: 'ft-brinell-hardness-tester',
    label: 'Brinell Hardness Tester',
    discipline: 'Force & Torque',
    subDiscipline: 'Hardness',
    unit: 'HB',
    points: pts('HB', [100, 300, 500]),
    typeB: tb('HB', 3, 1, [hysteresisExtra('HB', 4)]),
    units: ['HB'],
    ranges: [
      range('Hardness (HBW 2.5/187.5, low/med/high blocks)', 'HB', [100, 300, 500],
        tb('HB', 3, 1, [hysteresisExtra('HB', 4)]),
        { rangeText: '95 – 650 HBW' }),
    ],
    procedureText: HARDNESS_METHOD,
    nablReference: 'NABL 126 / ISO 6506-2 / ASTM E10',
    referenceStandard: 'Certified Brinell reference hardness blocks (HBW)',
  },
  {
    id: 'ft-vickers-hardness-tester',
    label: 'Vickers Hardness Tester',
    discipline: 'Force & Torque',
    subDiscipline: 'Hardness',
    unit: 'HV',
    points: pts('HV', [200, 500, 800]),
    typeB: tb('HV', 4, 1, [hysteresisExtra('HV', 5)]),
    units: ['HV'],
    ranges: [
      range('Hardness (HV30, low/med/high blocks)', 'HV', [200, 500, 800],
        tb('HV', 4, 1, [hysteresisExtra('HV', 5)]),
        { rangeText: '100 – 900 HV' }),
    ],
    procedureText: HARDNESS_METHOD,
    nablReference: 'NABL 126 / ISO 6507-2 / ASTM E384',
    referenceStandard: 'Certified Vickers reference hardness blocks (HV)',
  },
  {
    id: 'ft-micro-vickers-hardness-tester',
    label: 'Micro Vickers Hardness Tester',
    discipline: 'Force & Torque',
    subDiscipline: 'Hardness',
    unit: 'HV',
    points: pts('HV', [150, 400, 700]),
    typeB: tb('HV', 6, 1, [hysteresisExtra('HV', 8)]),
    units: ['HV'],
    ranges: [
      range('Micro-hardness (HV0.5, low/med/high blocks)', 'HV', [150, 400, 700],
        tb('HV', 6, 1, [hysteresisExtra('HV', 8)]),
        { rangeText: '100 – 900 HV (micro load)' }),
    ],
    procedureText: HARDNESS_METHOD,
    nablReference: 'NABL 126 / ISO 6507-2 / ASTM E384',
    referenceStandard: 'Certified micro-Vickers reference hardness blocks',
  },
  {
    id: 'ft-shore-durometer',
    label: 'Shore Durometer',
    discipline: 'Force & Torque',
    subDiscipline: 'Hardness',
    unit: 'Shore A',
    points: pts('Shore A', [30, 60, 90]),
    typeB: tb('Shore A', 0.5, 0.5, [hysteresisExtra('Shore A', 1.0)]),
    units: ['Shore A', 'Shore D'],
    ranges: [
      range('Hardness (Shore A, low/med/high blocks)', 'Shore A', [30, 60, 90],
        tb('Shore A', 0.5, 0.5, [hysteresisExtra('Shore A', 1.0)]),
        { rangeText: '10 – 95 Shore A' }),
      range('Hardness (Shore D, low/med/high blocks)', 'Shore D', [40, 60, 80],
        tb('Shore D', 0.5, 0.5, [hysteresisExtra('Shore D', 1.0)]),
        { rangeText: '20 – 90 Shore D' }),
    ],
    procedureText:
      'Per ISO 7619-1 / ASTM D2240: verify the indenter geometry, spring force vs. ' +
      'indicated scale value, and indentation depth. Indirect verification on ' +
      'certified rubber/elastomer reference blocks at low, medium and high scale ' +
      'values; 5 readings per block. Compute error from certified value and ' +
      'repeatability; expanded uncertainty at k=2.',
    nablReference: 'NABL 126 / ISO 7619-1 / ASTM D2240',
    referenceStandard: 'Certified Shore A/D reference hardness blocks + force gauge',
  },
  {
    id: 'ft-leeb-portable-hardness-tester',
    label: 'Leeb / Portable Hardness Tester',
    discipline: 'Force & Torque',
    subDiscipline: 'Hardness',
    unit: 'HL',
    points: pts('HL', [500, 650, 800]),
    typeB: tb('HL', 4, 1, [hysteresisExtra('HL', 6)]),
    units: ['HL', 'HRC', 'HB', 'HV'],
    ranges: [
      range('Hardness (Leeb HLD, low/med/high blocks)', 'HL', [500, 650, 800],
        tb('HL', 4, 1, [hysteresisExtra('HL', 6)]),
        { altUnits: ['HRC', 'HB', 'HV'], rangeText: '300 – 900 HLD' }),
    ],
    procedureText: HARDNESS_METHOD,
    nablReference: 'NABL 126 / ISO 16859 / ASTM A956',
    referenceStandard: 'Certified Leeb (HLD) reference hardness blocks',
  },

  // ─────────────── ADHESION (force-derived) ───────────────
  {
    id: 'ft-pull-off-adhesion-tester',
    label: 'Coating Adhesion / Pull-off Tester',
    discipline: 'Force & Torque',
    subDiscipline: 'Force',
    unit: 'N',
    points: pts('N', [200, 400, 600, 800, 1000]),
    typeB: tb('N', 0.5, 0.5, [hysteresisExtra('N', 1.0)]),
    units: ['N', 'kN', 'MPa'],
    ranges: [
      range('Pull-off Force', 'N', [200, 400, 600, 800, 1000],
        tb('N', 0.5, 0.5, [hysteresisExtra('N', 1.0)]),
        { altUnits: ['kN'], rangeText: '0 – 1000 N' }),
      range('Pull-off Stress', 'MPa', [5, 10, 15, 20, 25],
        tb('MPa', 0.05, 0.1, [hysteresisExtra('MPa', 0.1)]),
        { rangeText: '0 – 25 MPa' }),
    ],
    procedureText: ADHESION_METHOD,
    nablReference: 'NABL 126 / ISO 4624 / ASTM D4541',
    referenceStandard: 'Reference load cell + indicator (ISO 376)',
  },
];
