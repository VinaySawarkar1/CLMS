// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: FLUID FLOW
// ─────────────────────────────────────────────────────────────────
// Liquid flow, gas flow and air-velocity / anemometry instruments.
//
// Methods follow:
//   • ISO 4185      — Liquid flow, gravimetric (weighing) method
//   • ISO 8316      — Liquid flow, volumetric collection (volume tank) method
//   • ISO 17089     — Ultrasonic gas-flow meters
//   • ISO 9300      — Critical-flow (sonic) Venturi nozzles (gas master)
//   • ISO 3966 / 5167 — Pitot-static traverse / DP primary devices
//   • OIML R 49 / R 117 — Water meters / fuel dispensers
//   • EURAMET cg-15 — Anemometers in a wind tunnel
//
// Reference uncertainties (masterU) are entered in the SAME unit as the
// parameter and are typically 0.2–1 % of reading of a master/standard.

import { Procedure, pts, tb, range, R3 } from './types';

// Common alt-unit sets
const LIQ_ALT = ['L/h', 'm³/h', 'mL/min'];
const GAS_ALT = ['SCCM', 'm³/h', 'L/min'];
const VEL_ALT = ['ft/min', 'km/h'];

export const FLUID_FLOW: Procedure[] = [
  // ───────────────────────── LIQUID FLOW ─────────────────────────
  {
    id: 'ff-liquid-flow-meter',
    label: 'Liquid Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'L/min',
    points: pts('L/min', [5, 12.5, 25, 37.5, 50]),
    typeB: tb('L/min', 0.05, 0.01, [
      { source: 'Repeatability of flow rig (Type A pooled)', value: 0.04, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'L/min' },
      { source: 'Water temperature / density correction', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'L/min' },
    ]),
    units: ['L/min', ...LIQ_ALT],
    ranges: [
      range('Volume flow', 'L/min', [5, 12.5, 25, 37.5, 50], tb('L/min', 0.05, 0.01), { altUnits: LIQ_ALT }),
    ],
    procedureText:
      'Connect the UUC in series with the calibration rig. Establish steady flow at each set ' +
      'point (25 %, 50 %, 75 %, 100 % of range) and hold until stable. Divert flow into the ' +
      'weigh tank for a timed period (gravimetric method, ISO 4185): collected mass is converted ' +
      'to volume using water density at the measured temperature, and reference flow = collected ' +
      'volume / collection time. Compare against the UUC reading at each point with 3–5 repeat ' +
      'runs. Where a calibrated volume tank is used, apply the volumetric method (ISO 8316).',
    nablReference: 'NABL 122 / ISO 4185',
    referenceStandard: 'Gravimetric flow rig (weigh tank + timer) traceable to mass & time standards',
  },
  {
    id: 'ff-magnetic-flow-meter',
    label: 'Magnetic Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'm³/h',
    points: pts('m³/h', [3, 7.5, 15, 22.5, 30]),
    typeB: tb('m³/h', 0.04, 0.01, [
      { source: 'Repeatability of flow rig (Type A pooled)', value: 0.03, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'm³/h' },
      { source: 'Conductivity / fluid temperature effect', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm³/h' },
    ]),
    units: ['m³/h', 'L/min', 'L/h'],
    ranges: [
      range('Volume flow', 'm³/h', [3, 7.5, 15, 22.5, 30], tb('m³/h', 0.04, 0.01), { altUnits: ['L/min', 'L/h'] }),
    ],
    procedureText:
      'Install the electromagnetic flow meter full-bore in the liquid rig with adequate straight ' +
      'lengths upstream/downstream. At 25/50/75/100 % of span, divert to the weigh tank and ' +
      'compute reference flow gravimetrically (ISO 4185). Read the UUC totaliser/rate output and ' +
      'compute % error of reading. Verify zero at no-flow with the line full and static.',
    nablReference: 'NABL 122 / ISO 4185',
    referenceStandard: 'Gravimetric / master-meter liquid flow rig',
  },
  {
    id: 'ff-ultrasonic-flow-meter',
    label: 'Ultrasonic Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'm³/h',
    points: pts('m³/h', [5, 12.5, 25, 37.5, 50]),
    typeB: tb('m³/h', 0.06, 0.01, [
      { source: 'Repeatability of flow rig (Type A pooled)', value: 0.04, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'm³/h' },
      { source: 'Velocity-profile / installation effect', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm³/h' },
    ]),
    units: ['m³/h', 'L/min', 'L/h'],
    ranges: [
      range('Volume flow', 'm³/h', [5, 12.5, 25, 37.5, 50], tb('m³/h', 0.06, 0.01), { altUnits: ['L/min', 'L/h'] }),
    ],
    procedureText:
      'Clamp-on or in-line transit-time ultrasonic meter calibrated by master-meter comparison ' +
      '(or gravimetric collection per ISO 4185) at 25/50/75/100 % of range. Ensure correct pipe ' +
      'wall/liner data and full pipe. For gas service follow ISO 17089. Record path velocities ' +
      'and computed flow; compute error vs reference with repeat runs.',
    nablReference: 'NABL 122 / ISO 17089',
    referenceStandard: 'Master flow meter / gravimetric rig',
  },
  {
    id: 'ff-rotameter',
    label: 'Rotameter (Variable Area)',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'L/min',
    points: pts('L/min', [2, 5, 10, 15, 20]),
    typeB: tb('L/min', 0.04, 0.1, [
      { source: 'Float reading / parallax', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'L/min' },
      { source: 'Fluid density / temperature deviation', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'L/min' },
    ]),
    units: ['L/min', ...LIQ_ALT],
    ranges: [
      range('Volume flow', 'L/min', [2, 5, 10, 15, 20], tb('L/min', 0.04, 0.1), { altUnits: LIQ_ALT }),
    ],
    procedureText:
      'Mount the variable-area meter vertically. Set flow to each scale graduation (10/25/50/75/' +
      '100 % of range) reading the float centre/edge per the manufacturer convention. Divert to ' +
      'the weigh tank for timed gravimetric collection (ISO 4185) and compute reference flow at ' +
      'the stated reference fluid density and temperature. Report error at each indicated point.',
    nablReference: 'NABL 122 / ISO 4185',
    referenceStandard: 'Gravimetric liquid flow rig',
  },
  {
    id: 'ff-water-meter',
    label: 'Water Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'm³/h',
    points: pts('m³/h', [0.05, 0.5, 1.5, 2.5, 3]),
    typeB: tb('m³/h', 0.005, 0.0001, [
      { source: 'Repeatability of test rig (Type A pooled)', value: 0.004, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'm³/h' },
      { source: 'Start/stop timing of totaliser', value: 0.003, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm³/h' },
    ]),
    units: ['m³/h', 'L/min', 'L/h'],
    ranges: [
      range('Totalised volume / flow', 'm³/h', [0.05, 0.5, 1.5, 2.5, 3], tb('m³/h', 0.005, 0.0001), { altUnits: ['L/min', 'L/h'] }),
    ],
    procedureText:
      'Per OIML R 49 / ISO 4064 test at Q1 (minimum), Q2 (transitional), Q3 (permanent) and Q4 ' +
      '(overload) flow rates. Pass a known reference volume (calibrated proving tank or master ' +
      'meter) through the UUC and compare the totaliser increment against the reference volume; ' +
      'compute volumetric error (%) at each rate. Verify line is full and air-free before each run.',
    nablReference: 'NABL 122 / OIML R 49 / ISO 4064',
    referenceStandard: 'Calibrated proving tank / master water meter',
  },
  {
    id: 'ff-fuel-dispenser',
    label: 'Fuel Dispenser / Fuel Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'L/min',
    points: pts('L/min', [5, 15, 25, 35, 40]),
    typeB: tb('L/min', 0.02, 0.01, [
      { source: 'Proving measure / reference volume uncertainty', value: 0.03, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'L/min' },
      { source: 'Fuel temperature / volume correction', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'L/min' },
    ]),
    units: ['L/min', ...LIQ_ALT],
    ranges: [
      range('Dispensed volume / flow', 'L/min', [5, 15, 25, 35, 40], tb('L/min', 0.02, 0.01), { altUnits: LIQ_ALT }),
    ],
    procedureText:
      'Per OIML R 117: dispense a nominal quantity (e.g. 5 L / 20 L) into a calibrated metal ' +
      'proving measure at low and high delivery rates. Read the meniscus, apply temperature/' +
      'volume correction to the reference fluid, and compare delivered volume against the ' +
      'dispenser indication. Compute error (%) and check against MPE. Repeat for each rate.',
    nablReference: 'NABL 122 / OIML R 117',
    referenceStandard: 'Calibrated metal proving measure / master volumetric standard',
  },
  {
    id: 'ff-mass-flow-meter',
    label: 'Mass Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'kg/h',
    points: pts('kg/h', [50, 125, 250, 375, 500]),
    typeB: tb('kg/h', 0.5, 0.1, [
      { source: 'Repeatability of gravimetric rig (Type A pooled)', value: 0.4, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'kg/h' },
      { source: 'Weigh-tank buoyancy / timing', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'kg/h' },
    ]),
    units: ['kg/h', 'kg/min', 't/h'],
    ranges: [
      range('Mass flow', 'kg/h', [50, 125, 250, 375, 500], tb('kg/h', 0.5, 0.1), { altUnits: ['kg/min', 't/h'] }),
    ],
    procedureText:
      'Coriolis / inferential mass flow meter calibrated by the gravimetric (weigh-tank) method ' +
      '(ISO 4185): collect fluid over a timed interval, reference mass flow = collected mass / ' +
      'collection time. Compare UUC mass rate and totalised mass at 25/50/75/100 % of range with ' +
      '3–5 repeats. Verify zero at no-flow with full, pressurised, settled line.',
    nablReference: 'NABL 122 / ISO 4185',
    referenceStandard: 'Gravimetric flow rig (weigh tank + timer)',
  },

  // ───────────────────────── GAS FLOW ─────────────────────────
  {
    id: 'ff-mass-flow-controller',
    label: 'Mass Flow Controller (MFC)',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'SLPM',
    points: pts('SLPM', [1, 2.5, 5, 7.5, 10]),
    typeB: tb('SLPM', 0.02, 0.01, [
      { source: 'Repeatability (Type A pooled)', value: 0.015, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'SLPM' },
      { source: 'Gas conversion factor / reference conditions', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'SLPM' },
    ]),
    units: ['SLPM', ...GAS_ALT],
    ranges: [
      range('Standard volume flow (set & read)', 'SLPM', [1, 2.5, 5, 7.5, 10], tb('SLPM', 0.02, 0.01), { altUnits: GAS_ALT }),
    ],
    procedureText:
      'Connect the MFC outlet to a primary gas flow standard (piston-prover / DryCal or laminar ' +
      'flow element). Command set-points at 25/50/75/100 % of range, allow settling, and compare ' +
      'the standard reading (corrected to reference T,P) against both the MFC set-point and its ' +
      'read-back output. Apply the gas conversion factor when the calibration gas differs from ' +
      'the service gas. Record set-point error and read-back error.',
    nablReference: 'NABL 122 / ISO 14511',
    referenceStandard: 'Primary gas flow standard (piston prover / molbloc / DryCal)',
  },
  {
    id: 'ff-gas-flow-meter',
    label: 'Gas Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'SLPM',
    points: pts('SLPM', [10, 25, 50, 75, 100]),
    typeB: tb('SLPM', 0.2, 0.1, [
      { source: 'Repeatability (Type A pooled)', value: 0.15, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'SLPM' },
      { source: 'Reference T,P correction to standard conditions', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'SLPM' },
    ]),
    units: ['SLPM', ...GAS_ALT],
    ranges: [
      range('Standard volume flow', 'SLPM', [10, 25, 50, 75, 100], tb('SLPM', 0.2, 0.1), { altUnits: GAS_ALT }),
    ],
    procedureText:
      'Calibrate against a master gas flow standard / sonic nozzle bank (ISO 9300) or bell prover. ' +
      'Establish steady flow at 25/50/75/100 % of range; correct UUC and reference to common ' +
      'standard temperature and pressure. Compute % error of reading at each point with repeats.',
    nablReference: 'NABL 122 / ISO 9300',
    referenceStandard: 'Bell prover / sonic-nozzle master gas flow rig',
  },
  {
    id: 'ff-gas-rotameter',
    label: 'Gas Rotameter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'SLPM',
    points: pts('SLPM', [2, 5, 10, 15, 20]),
    typeB: tb('SLPM', 0.1, 0.2, [
      { source: 'Float reading / parallax', value: 0.15, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'SLPM' },
      { source: 'Gas density / inlet pressure deviation', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'SLPM' },
    ]),
    units: ['SLPM', ...GAS_ALT],
    ranges: [
      range('Standard volume flow', 'SLPM', [2, 5, 10, 15, 20], tb('SLPM', 0.1, 0.2), { altUnits: GAS_ALT }),
    ],
    procedureText:
      'Mount the gas rotameter vertically at the specified inlet pressure. Set flow to each scale ' +
      'graduation (10/25/50/75/100 %) reading the float per convention, and compare against a ' +
      'reference gas flow standard (DryCal / soap-film / mass flow standard) corrected to the ' +
      "rotameter's reference gas, temperature and pressure. Report error at each indicated point.",
    nablReference: 'NABL 122 / ISO 9300',
    referenceStandard: 'Primary gas flow standard (DryCal / mass flow standard)',
  },
  {
    id: 'ff-turbine-flow-meter',
    label: 'Turbine Flow Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'm³/h',
    points: pts('m³/h', [5, 12.5, 25, 37.5, 50]),
    typeB: tb('m³/h', 0.05, 0.01, [
      { source: 'Repeatability of rig (Type A pooled)', value: 0.04, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'm³/h' },
      { source: 'K-factor / fluid property deviation', value: 0.04, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm³/h' },
    ]),
    units: ['m³/h', 'L/min', 'SLPM'],
    ranges: [
      range('Volume flow', 'm³/h', [5, 12.5, 25, 37.5, 50], tb('m³/h', 0.05, 0.01), { altUnits: ['L/min', 'SLPM'] }),
    ],
    procedureText:
      'Install with required straight lengths and flow conditioner. At 25/50/75/100 % of range ' +
      'compare pulse output / indicated flow against a master meter or sonic-nozzle (gas) / ' +
      'gravimetric (liquid) reference. Derive K-factor (pulses per unit volume) and its linearity, ' +
      'and report error of reading at each point with repeats.',
    nablReference: 'NABL 122 / ISO 9951 / ISO 4185',
    referenceStandard: 'Master meter / sonic-nozzle or gravimetric flow rig',
  },
  {
    id: 'ff-mass-flow-controller-gas',
    label: 'Mass Flow Meter (Gas / Thermal)',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'SLPM',
    points: pts('SLPM', [5, 12.5, 25, 37.5, 50]),
    typeB: tb('SLPM', 0.1, 0.01, [
      { source: 'Repeatability (Type A pooled)', value: 0.08, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'SLPM' },
      { source: 'Gas conversion factor uncertainty', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'SLPM' },
    ]),
    units: ['SLPM', ...GAS_ALT],
    ranges: [
      range('Standard mass / volume flow', 'SLPM', [5, 12.5, 25, 37.5, 50], tb('SLPM', 0.1, 0.01), { altUnits: GAS_ALT }),
    ],
    procedureText:
      'Thermal gas mass flow meter calibrated against a primary gas flow standard (laminar flow ' +
      'element / piston prover) at 25/50/75/100 % of range. Correct to standard reference ' +
      'conditions and apply the gas conversion factor. Report error of reading at each point.',
    nablReference: 'NABL 122 / ISO 14511',
    referenceStandard: 'Primary gas flow standard (LFE / piston prover)',
  },
  {
    id: 'ff-flow-transmitter',
    label: 'Flow Transmitter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'm³/h',
    points: pts('m³/h', [0, 25, 50, 75, 100]),
    typeB: tb('m³/h', 0.1, 0.01, [
      { source: 'mA loop / readout uncertainty', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm³/h' },
      { source: 'Repeatability (Type A pooled)', value: 0.08, distribution: 'normal', divisor: 1, sensitivity: 1, unit: 'm³/h' },
    ]),
    units: ['m³/h', 'L/min', 'SLPM'],
    ranges: [
      range('Flow (4–20 mA span)', 'm³/h', [0, 25, 50, 75, 100], tb('m³/h', 0.1, 0.01), { altUnits: ['L/min', 'SLPM'] }),
    ],
    procedureText:
      'Calibrate the flow-rate-to-current transmitter end-to-end on a flow rig, or verify the ' +
      'transmitter electronics by simulating the primary signal (DP/pulse) across 0/25/50/75/' +
      '100 % of span and reading the 4–20 mA output. Compute output error (% of span) at each ' +
      'point for rising and falling sequences (hysteresis) and check zero/span.',
    nablReference: 'NABL 122 / ISO 5167',
    referenceStandard: 'Master flow rig + calibrated mA loop reference',
  },

  // ─────────────────── AIR VELOCITY / ANEMOMETRY ───────────────────
  {
    id: 'ff-vane-anemometer',
    label: 'Vane Anemometer',
    discipline: 'Fluid Flow',
    subDiscipline: 'Air Velocity / Anemometry',
    unit: 'm/s',
    points: pts('m/s', [1, 5, 10, 15, 20]),
    typeB: tb('m/s', 0.03, 0.01, [
      { source: 'Wind-tunnel reference velocity uncertainty', value: 0.04, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'm/s' },
      { source: 'Velocity-profile / positioning in tunnel', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', ...VEL_ALT],
    ranges: [
      range('Air velocity', 'm/s', [1, 5, 10, 15, 20], tb('m/s', 0.03, 0.01), { altUnits: VEL_ALT }),
    ],
    procedureText:
      'Mount the rotating-vane anemometer at the working section of a calibrated low-speed wind ' +
      'tunnel (EURAMET cg-15). Set reference velocities across the range; the tunnel reference ' +
      'is derived from a Pitot-static tube + manometer (ISO 3966) or a laser/LDA reference. ' +
      'Align the sensor with the flow, average a stable reading, and compute error at each point.',
    nablReference: 'NABL 122 / EURAMET cg-15 / ISO 3966',
    referenceStandard: 'Calibrated wind tunnel with Pitot-static reference',
  },
  {
    id: 'ff-hot-wire-anemometer',
    label: 'Hot-wire Anemometer',
    discipline: 'Fluid Flow',
    subDiscipline: 'Air Velocity / Anemometry',
    unit: 'm/s',
    points: pts('m/s', [0.2, 1, 5, 10, 20]),
    typeB: tb('m/s', 0.02, 0.01, [
      { source: 'Wind-tunnel reference velocity uncertainty', value: 0.03, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'm/s' },
      { source: 'Air temperature / density correction', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', ...VEL_ALT],
    ranges: [
      range('Air velocity', 'm/s', [0.2, 1, 5, 10, 20], tb('m/s', 0.02, 0.01), { altUnits: VEL_ALT }),
    ],
    procedureText:
      'Insert the hot-wire / thermal probe into the calibrated wind-tunnel working section. ' +
      'Establish reference velocities (low-speed emphasis) traceable to a Pitot-static or LDA ' +
      'standard, correcting for air temperature and density. Allow probe thermal settling, ' +
      'average a stable reading and compute error of indication at each velocity.',
    nablReference: 'NABL 122 / EURAMET cg-15',
    referenceStandard: 'Calibrated low-speed wind tunnel',
  },
  {
    id: 'ff-thermal-air-velocity-meter',
    label: 'Thermal Air Velocity Meter',
    discipline: 'Fluid Flow',
    subDiscipline: 'Air Velocity / Anemometry',
    unit: 'm/s',
    points: pts('m/s', [0.5, 2, 5, 10, 15]),
    typeB: tb('m/s', 0.03, 0.01, [
      { source: 'Wind-tunnel reference velocity uncertainty', value: 0.04, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'm/s' },
      { source: 'Air temperature / density correction', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', ...VEL_ALT],
    ranges: [
      range('Air velocity', 'm/s', [0.5, 2, 5, 10, 15], tb('m/s', 0.03, 0.01), { altUnits: VEL_ALT }),
    ],
    procedureText:
      'Thermal (omnidirectional) air-velocity probe calibrated in a wind tunnel per EURAMET ' +
      'cg-15. Set reference velocities across the range, correct for temperature/density, and ' +
      'compare the UUC indication against the tunnel reference at each point with repeats.',
    nablReference: 'NABL 122 / EURAMET cg-15',
    referenceStandard: 'Calibrated low-speed wind tunnel',
  },
  {
    id: 'ff-pitot-tube-manometer',
    label: 'Pitot Tube + Manometer',
    discipline: 'Fluid Flow',
    subDiscipline: 'Air Velocity / Anemometry',
    unit: 'm/s',
    points: pts('m/s', [3, 8, 15, 25, 40]),
    typeB: tb('m/s', 0.05, 0.01, [
      { source: 'Differential-pressure (manometer) uncertainty', value: 0.06, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'm/s' },
      { source: 'Pitot coefficient & air density', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', ...VEL_ALT],
    ranges: [
      range('Air velocity (DP-derived)', 'm/s', [3, 8, 15, 25, 40], tb('m/s', 0.05, 0.01), { altUnits: VEL_ALT }),
    ],
    procedureText:
      'Calibrate the Pitot-static tube + manometer combination in a wind tunnel (ISO 3966). ' +
      'At each reference velocity, read the differential pressure and compute velocity v = ' +
      'sqrt(2·ΔP/ρ) using the Pitot coefficient and measured air density. Compare against the ' +
      'tunnel reference velocity. May also be verified by calibrating the manometer (DP) and ' +
      'applying the certified Pitot coefficient.',
    nablReference: 'NABL 122 / ISO 3966',
    referenceStandard: 'Calibrated wind tunnel + reference DP standard',
  },
  {
    id: 'ff-face-velocity-meter',
    label: 'Face Velocity Meter (Fume Hood)',
    discipline: 'Fluid Flow',
    subDiscipline: 'Air Velocity / Anemometry',
    unit: 'm/s',
    points: pts('m/s', [0.3, 0.5, 0.8, 1.2, 2]),
    typeB: tb('m/s', 0.02, 0.01, [
      { source: 'Wind-tunnel reference velocity uncertainty', value: 0.02, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'm/s' },
      { source: 'Low-speed turbulence / repeatability', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', ...VEL_ALT],
    ranges: [
      range('Face velocity', 'm/s', [0.3, 0.5, 0.8, 1.2, 2], tb('m/s', 0.02, 0.01), { altUnits: VEL_ALT }),
    ],
    procedureText:
      'Calibrate the low-velocity (fume-hood / cleanroom) anemometer in a calibrated low-speed ' +
      'wind tunnel emphasising 0.3–1.0 m/s set points (typical face-velocity criteria). Reference ' +
      'velocity is traceable to a Pitot-static or LDA standard per EURAMET cg-15. Compute error ' +
      'at each point with repeats.',
    nablReference: 'NABL 122 / EURAMET cg-15',
    referenceStandard: 'Calibrated low-speed wind tunnel',
  },

  // ─────────────── GAS / PUMP VOLUMETRIC FLOW ───────────────
  {
    id: 'ff-gas-flow-calibrator-drycal',
    label: 'Gas Flow Calibrator (DryCal)',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'SLPM',
    points: pts('SLPM', [0.5, 2, 5, 10, 20]),
    typeB: tb('SLPM', 0.05, 0.001, [
      { source: 'Reference piston-prover uncertainty', value: 0.04, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'SLPM' },
      { source: 'Reference T,P correction', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'SLPM' },
    ]),
    units: ['SLPM', ...GAS_ALT],
    ranges: [
      range('Standard volume flow', 'SLPM', [0.5, 2, 5, 10, 20], tb('SLPM', 0.05, 0.001), { altUnits: GAS_ALT }),
    ],
    procedureText:
      'Verify the dry piston-prover gas flow calibrator against a higher-level primary gas flow ' +
      'standard (molbloc / reference piston prover) at 25/50/75/100 % of range, both corrected ' +
      'to common standard temperature and pressure. Compute error of reading and check the ' +
      "calibrator's stated reference conditions and internal temperature/pressure sensors.",
    nablReference: 'NABL 122 / ISO 9300',
    referenceStandard: 'Primary gas flow standard (molbloc / reference piston prover)',
  },
  {
    id: 'ff-peristaltic-pump-flow',
    label: 'Peristaltic Pump Flow',
    discipline: 'Fluid Flow',
    subDiscipline: 'Liquid Flow',
    unit: 'mL/min',
    points: pts('mL/min', [1, 5, 10, 25, 50]),
    typeB: tb('mL/min', 0.05, 0.1, [
      { source: 'Gravimetric balance / density uncertainty', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'mL/min' },
      { source: 'Pulsation / tubing occlusion variation', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mL/min' },
    ]),
    units: ['mL/min', 'L/min', 'L/h'],
    ranges: [
      range('Delivered flow', 'mL/min', [1, 5, 10, 25, 50], tb('mL/min', 0.05, 0.1), { altUnits: ['L/min', 'L/h'] }),
    ],
    procedureText:
      'Gravimetric collection method (ISO 4185, micro scale): set each pump rate, deliver into a ' +
      'tared vessel on an analytical balance over a timed interval, and compute reference flow = ' +
      'collected mass / (density × time). Use evaporation-trap / oil overlay for low rates. ' +
      'Compare against the pump set rate at 25/50/75/100 % with repeats.',
    nablReference: 'NABL 122 / ISO 4185',
    referenceStandard: 'Analytical balance + timer (gravimetric micro-flow)',
  },
  {
    id: 'ff-air-sampling-pump-flow',
    label: 'Air Sampling Pump Flow',
    discipline: 'Fluid Flow',
    subDiscipline: 'Gas Flow',
    unit: 'L/min',
    points: pts('L/min', [0.5, 1, 2, 3, 5]),
    typeB: tb('L/min', 0.02, 0.01, [
      { source: 'Primary (soap-film / DryCal) standard uncertainty', value: 0.02, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'L/min' },
      { source: 'Back-pressure / filter loading effect', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'L/min' },
    ]),
    units: ['L/min', 'mL/min', 'SLPM'],
    ranges: [
      range('Sampling flow', 'L/min', [0.5, 1, 2, 3, 5], tb('L/min', 0.02, 0.01), { altUnits: ['mL/min', 'SLPM'] }),
    ],
    procedureText:
      'Calibrate the personal / area air-sampling pump against a primary flow standard (soap-film ' +
      'bubble meter or dry piston prover) with a representative sampling train (filter cassette / ' +
      'sorbent tube) in line to reproduce back-pressure. Set each flow, allow stabilisation, and ' +
      'compute error of reading at 25/50/75/100 % of range with repeats.',
    nablReference: 'NABL 122 / ISO 9300',
    referenceStandard: 'Primary air flow standard (soap-film / DryCal piston prover)',
  },
];
