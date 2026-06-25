// ─────────────────────────────────────────────────────────────────
// CLMS — NABL 129 Specific Calibration Criteria
// ─────────────────────────────────────────────────────────────────
// NABL 129: Specific Criteria for Accreditation of Calibration
// Laboratories (Mechanical, Fluid Flow, Radiological,
// Electro-Technical & Thermal Calibration)
// Issue No: 01 | Amend No: 01 | Amend Date: 01-Nov-2021
//
// This file maps procedure IDs to NABL 129 chapter-specific
// requirements: minimum readings, calibration intervals, MPE
// limits, and accuracy class tables.
// ─────────────────────────────────────────────────────────────────

export interface Nabl129Criteria {
  nablChapter: string;
  minReadings: number;           // minimum observations per calibration point
  calibrationIntervalMonths: number;
  mpe: string;                   // typical class MPE description
  accuracyClasses?: { class: string; mpe: string }[];
  keyRequirements?: string[];    // notable NABL 129 requirements for this instrument
}

// ─── Chapter 1: Mechanical Calibration ───────────────────────────

// Chapter 1(A): Dimensional — Length
const DIMENSIONAL: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(A)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±(0.002 + 0.003×L) mm (Grade 1 reference)',
  accuracyClasses: [
    { class: 'Grade 0', mpe: '±0.001 mm' },
    { class: 'Grade 1', mpe: '±(0.002 + 0.003×L) mm' },
    { class: 'Grade 2', mpe: '±(0.004 + 0.006×L) mm' },
  ],
  keyRequirements: [
    'Temperature stabilisation at 20 °C ± 1 °C required',
    'Minimum 3 independent readings per calibration point',
    'Both increasing and decreasing series for hysteresis',
    'Reference: Grade K or Grade 1 gauge blocks (IS 2984)',
  ],
};

// Chapter 1(B): Surface Texture
const SURFACE_TEXTURE: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(B)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±5% of certified value',
  keyRequirements: [
    'Minimum 5 measurements per calibration location',
    'Reference: Certified surface roughness comparators',
  ],
};

// Chapter 1(C): Mass / Weights
const MASS: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(C)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±0.001% of nominal (Class E1)',
  accuracyClasses: [
    { class: 'E1', mpe: '±0.001% of nominal' },
    { class: 'E2', mpe: '±0.003% of nominal' },
    { class: 'F1', mpe: '±0.01% of nominal' },
    { class: 'F2', mpe: '±0.03% of nominal' },
    { class: 'M1', mpe: '±0.1% of nominal' },
    { class: 'M2', mpe: '±0.3% of nominal' },
  ],
  keyRequirements: [
    'Weighing by substitution or double substitution method (OIML R 111)',
    'Minimum 5 weighings per mass',
    'Air buoyancy correction required for Class E1/E2',
    'Reference: OIML R 111 Class E1/E2 standard weights',
  ],
};

// Chapter 1(F): Force Proving Instruments (Load Cells, Proving Rings)
const FORCE_PROVING: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(F)',
  minReadings: 3,
  calibrationIntervalMonths: 60,
  mpe: '±0.5% of indicated force (Class B)',
  accuracyClasses: [
    { class: 'Class A', mpe: '≤0.1% of indicated force' },
    { class: 'Class B', mpe: '≤0.5% of indicated force' },
    { class: 'Class C', mpe: '≤1.0% of indicated force' },
    { class: 'Class D', mpe: '≤2.0% of indicated force' },
    { class: 'Class E', mpe: '≤5.0% of indicated force' },
  ],
  keyRequirements: [
    'Pre-load to max force 3 times before calibration',
    'Minimum 5 calibration points from 20% to 100% of range',
    'Three series: one increasing + one decreasing + one increasing',
    'Reproducibility check at 2 rotated mounting positions (0°, 120°/180°)',
    'Reference: Dead-weight force standard machine or Class 00 force transducer (IS 4169 / ASTM E74)',
    'Minimum 3 readings per point per series',
    'Interpolation coefficient b (%) ≤ 0.5% for Class A instruments',
  ],
};

// Chapter 1(G): UTM / Tensile-Compression Testing Machine
const UTM: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(G)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±1% of applied force (Class 1 per ISO 7500-1)',
  accuracyClasses: [
    { class: 'Class 0.5', mpe: '±0.5% of applied force' },
    { class: 'Class 1', mpe: '±1.0% of applied force' },
    { class: 'Class 2', mpe: '±2.0% of applied force' },
    { class: 'Class 3', mpe: '±3.0% of applied force' },
  ],
  keyRequirements: [
    'Reference: IS 1828 (Part 1) / ISO 7500-1 / ISO 7500-2',
    'Class 1: calibration from 10%–100% of measuring range',
    'Class 2: calibration from 20%–100% of measuring range',
    'Minimum 3 readings per calibration point',
    'Both tension and compression modes must be verified',
    'Force-proving instrument (Class 0.5 or better) required as reference',
    'Resolution class must be ≤ 1/3 of force range accuracy class',
  ],
};

// Chapter 1(H): Push-Pull Gauge / Mobile Force Measuring System
const PUSH_PULL: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(H)',
  minReadings: 3,
  calibrationIntervalMonths: 60,
  mpe: '±2% of full scale',
  accuracyClasses: [
    { class: 'Class 1', mpe: '±1% of full scale' },
    { class: 'Class 2', mpe: '±2% of full scale' },
    { class: 'Class 3', mpe: '±3% of full scale' },
  ],
  keyRequirements: [
    'Reference: VD/VDE 2524 / ASTM C1161',
    'Minimum 5 calibration points from 10%–100% of range',
    'Three series of measurements (increasing)',
    'Calibrate in both compression and tension modes',
    'Minimum 3 readings per calibration point',
  ],
};

// Chapter 1(I): Hardness Testing Machines
const HARDNESS: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(I)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: 'As per scale: HRC ±2, HRB ±2, HV ±3%, HB ±3%',
  accuracyClasses: [
    { class: 'Rockwell (HRC)', mpe: 'Mean error ≤ ΔHR per IS 1586 Table 5' },
    { class: 'Vickers (HV)', mpe: 'Mean error ≤ ΔHV per IS 1500 Table 5' },
    { class: 'Brinell (HB)', mpe: 'Mean error ≤ ΔHB per IS 1500 Table 4' },
    { class: 'Knoop (HK)', mpe: 'Per ASTM E384 Table 4' },
  ],
  keyRequirements: [
    'Reference: ISO 6508-2 (Rockwell), ISO 6506-2 (Brinell), ISO 6507-2 (Vickers), ISO 1519',
    'Minimum 5 indentations per reference hardness block per load',
    'Use at least 3 reference blocks per scale (low, medium, high hardness)',
    'Spacing between indentations: ≥ 3× indentation diameter',
    'Direct verification: test force (±0.5%), indenter geometry, measuring system',
    'Indirect verification using IRMM/NPL certified reference blocks',
  ],
};

// Chapter 1(J): Torque Measuring Devices (Transducers, Analyzers)
const TORQUE_MEASURING: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(J)',
  minReadings: 3,
  calibrationIntervalMonths: 24,
  mpe: '±0.5% of indicated torque (Class 0.5)',
  accuracyClasses: [
    { class: 'Class 0.1', mpe: '±0.1% of indicated torque' },
    { class: 'Class 0.2', mpe: '±0.2% of indicated torque' },
    { class: 'Class 0.5', mpe: '±0.5% of indicated torque' },
    { class: 'Class 1', mpe: '±1.0% of indicated torque' },
    { class: 'Class 2', mpe: '±2.0% of indicated torque' },
  ],
  keyRequirements: [
    'Reference: BS 7882:2017 / ISO 6789-2 / DKD-R 3-7',
    'Minimum 5 calibration points from 20%–100% of range',
    'Three complete series: increasing CW, decreasing CW, increasing CCW (where applicable)',
    'Minimum 3 readings per calibration point per series',
    'Reproducibility check with at least 2 rotated positions (0°, 120°)',
    'Calibration torque machine must be ≥ 3× more accurate than UUC',
  ],
};

// Chapter 1(K): Torque Generating Devices (Wrenches, Screwdrivers, Multipliers)
const TORQUE_GENERATING: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(K)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±4% of set torque (Type II click wrench per ISO 6789)',
  accuracyClasses: [
    { class: 'Type I indicating (ISO 6789)', mpe: '±6% of reading (≤10 N·m: ±6%)' },
    { class: 'Type II setting (ISO 6789)', mpe: '±6% of set torque (≤10 N·m: ±6%)' },
    { class: 'Class A precision', mpe: '±4% of set torque' },
  ],
  keyRequirements: [
    'Reference: ISO 6789:2017 (Part 1 & 2)',
    'Pre-condition tool: 5 cycles at max torque before calibration',
    'Calibration at 20%, 60% and 100% of maximum torque (ISO 6789)',
    'Type I (indicating): 10 measurements per test torque, 3 test torques',
    'Type II (setting): 5 actuations per test torque, 3 test torques',
    'Reference torque transducer with calibration certificate traceable to NPL/NABL',
  ],
};

// Chapter 1(L): Pressure Indicating Devices (Gauges, Manometers)
const PRESSURE_GAUGE: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(L)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±0.1% of full scale (Class B)',
  accuracyClasses: [
    { class: 'Class A', mpe: '±0.05% of full scale' },
    { class: 'Class B', mpe: '±0.1% of full scale' },
    { class: 'Class C', mpe: '±0.25% of full scale' },
    { class: 'Class D', mpe: '±0.6% of full scale' },
    { class: 'Class E', mpe: '±1.0% of full scale' },
    { class: 'Class F', mpe: '±2.5% of full scale' },
  ],
  keyRequirements: [
    'Reference: EURAMET Cg-17 / DKD-R 6-1 / IS 3624',
    'Minimum 6 calibration points across the full scale range',
    'Both ascending (rising) and descending (falling) pressure series required',
    'Minimum 3 readings per calibration point (3 complete cycles)',
    'Hysteresis = difference between ascending and descending readings',
    'Reference: Dead Weight Tester (±0.01%) or Digital Pressure Calibrator',
    'Environmental: 23 ± 2 °C, 65 ± 5% RH during calibration',
  ],
};

// Chapter 1(M): Pressure Balance / Dead Weight Tester
const DEAD_WEIGHT_TESTER: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(M)',
  minReadings: 5,
  calibrationIntervalMonths: 24,
  mpe: '±0.01% of applied pressure',
  keyRequirements: [
    'Reference: EURAMET cg-3 / OIML R 110',
    'Mass determination traceable to national mass standard',
    'Piston-cylinder effective area determination required',
    'Buoyancy, temperature, local gravity corrections mandatory',
  ],
};

// Chapter 1(N): Impact Testing Machine (Charpy/Izod)
const IMPACT_MACHINE: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(N)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±5 J or ±5% of certified value (whichever is greater)',
  accuracyClasses: [
    { class: 'Low energy', mpe: '≤5 J absorbed energy error' },
    { class: 'High energy', mpe: '≤5% absorbed energy error' },
  ],
  keyRequirements: [
    'Reference: ISO 148-2 / ASTM E23 / IS 1598',
    'Minimum 5 reference specimens per energy level (low + high)',
    'Direct verification: pendulum geometry, striker radius, anvil spacing',
    'Zero loss (free swing) verification required',
    'Friction and windage determination per ISO 148-2',
    'Reference specimens: NIST/IRMM/NPL certified Charpy V-notch reference pieces',
  ],
};

// Chapter 1(O): Durometer (Shore Hardness Tester)
const DUROMETER: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 1(O)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±1 Shore unit (Type A/D per ISO 7619)',
  accuracyClasses: [
    { class: 'Shore A (soft rubber)', mpe: '±1 Shore A unit' },
    { class: 'Shore D (hard rubber)', mpe: '±1 Shore D unit' },
    { class: 'Shore OO (very soft)', mpe: '±2 Shore OO units' },
  ],
  keyRequirements: [
    'Reference: ISO 7619-1 / ASTM D2240 / VD/VDE 2524',
    'Calibration using certified reference rubber hardness blocks',
    'Test force verification: Shore A = 822 mN at 0 Shore = 8.064 N at 100 Shore',
    'Indenter geometry check per relevant ISO standard',
    'Minimum 5 measurements per reference block',
    'Indentor spring force calibration required as direct verification',
  ],
};

// ─── Chapter 2: Fluid Flow Calibration ────────────────────────────

const FLOW_METER: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 2',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±0.5% of reading (Coriolis) / ±1% FS (turbine/ultrasonic)',
  accuracyClasses: [
    { class: 'Coriolis / Electromagnetic', mpe: '±0.2–0.5% of reading' },
    { class: 'Turbine / Ultrasonic', mpe: '±0.5–1.0% of reading' },
    { class: 'Differential Pressure', mpe: '±0.5–2.0% of full scale' },
    { class: 'Rotameter (Variable Area)', mpe: '±2–4% of full scale' },
  ],
  keyRequirements: [
    'Flow conditions: fully developed symmetric flow profile required',
    'Straight pipe upstream ≥10D, downstream ≥5D (ISO 5167)',
    'Working liquid must be uniform in composition and temperature',
    'Density and viscosity corrections required where applicable',
    'Minimum 5 repeat measurements at each flow rate',
    'Reference: gravimetric or volumetric flow standard with ≤0.1% uncertainty',
    'CMC evaluation per EURAMET cg-relevant / NABL 129 Chapter 2',
  ],
};

const VISCOMETER: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 2 (Viscosity)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±0.3–1.0% (glass capillary) / ±1–3% (rotational)',
  keyRequirements: [
    'Reference: IS 4020 / ASTM D445 / ISO 3104',
    'Temperature control ±0.01°C during measurement',
    'Certified viscosity reference oils (NIST/PTB traceable)',
    'Kinematic viscosity = flow time × calibration constant × temperature correction',
  ],
};

// ─── Chapter 4: Electro-Technical Calibration ─────────────────────

const ELECTRO_DMM: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 4',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: 'As per manufacturer specification (typically ±(0.01%+2 counts))',
  keyRequirements: [
    'Calibrate using a traceable multifunction calibrator (Fluke 5522A or equivalent)',
    'Reference: IS 1248 (Part 1) / IEC 61010-1 / EURAMET relevant guides',
    'Calibration at 20%, 50%, 80%, 100% of each range (minimum 4 points per range)',
    'DC Voltage, AC Voltage, DC Current, AC Current, Resistance ranges to be verified',
    'Temperature and humidity stability: 23 ± 2°C, 65 ± 5% RH',
    'Warm-up time per manufacturer specification (typically 30–60 min)',
    'Uncertainty < 1/3 of DMM accuracy specification',
  ],
};

const ELEC_VOLTAGE: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 4 (Voltage)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±0.01% of reading (Class 0.1 reference)',
  accuracyClasses: [
    { class: 'Class 0.1', mpe: '±0.1% of reading' },
    { class: 'Class 0.2', mpe: '±0.2% of reading' },
    { class: 'Class 0.5', mpe: '±0.5% of reading' },
    { class: 'Class 1', mpe: '±1.0% of reading' },
  ],
  keyRequirements: [
    'Reference: Josephson array voltage standard (SI realisation) via traceable calibrator',
    'DC voltage: calibrate at 100 mV, 1 V, 10 V, 100 V, 1000 V nominal points',
    'AC voltage: frequency range 40 Hz – 10 kHz minimum',
    'Long-term stability assessment required for reference standard',
  ],
};

const ELEC_RESISTANCE: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 4 (Resistance)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±0.01% of resistance value',
  keyRequirements: [
    'Reference: Quantum Hall resistance standard via traceable transfer standards',
    '4-terminal (Kelvin) connection required for < 1 Ω',
    'Self-heating correction for precise measurements',
    'Calibration points: 1 Ω, 10 Ω, 100 Ω, 1 kΩ, 10 kΩ, 100 kΩ, 1 MΩ',
  ],
};

const POWER_ANALYZER: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 4 (Power/Energy)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±0.1% of reading (active power)',
  keyRequirements: [
    'Reference: Traceable power calibrator/standard',
    'Test at unity PF and at 0.5 PF (lag and lead) per range',
    'Frequency: 50 Hz nominal, verify at 45 Hz and 65 Hz',
    'Both single-phase and three-phase configurations (as applicable)',
  ],
};

// ─── Chapter 5: Thermal Calibration ───────────────────────────────

const THERMAL_SPRT: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 5 (SPRT/ITS-90)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±0.005 °C at fixed points',
  keyRequirements: [
    'Reference: ITS-90 fixed point cells (triple point of water, Ga, In, Sn, Zn, Al, Ag)',
    'SPRT resistance measured by AC resistance bridge',
    'Minimum 5 readings at each fixed point (plateau method)',
    'Immersion depth check required',
    'Self-heating determination at each temperature',
    'Hydrostatic head correction where applicable',
  ],
};

const THERMAL_RTD: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 5 (RTD/Thermocouple)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±0.1 °C (Class A RTD) / ±0.5 °C (Class B RTD)',
  accuracyClasses: [
    { class: 'Class AA (IEC 60751)', mpe: '±(0.1 + 0.0017×|T|) °C' },
    { class: 'Class A (IEC 60751)', mpe: '±(0.15 + 0.002×|T|) °C' },
    { class: 'Class B (IEC 60751)', mpe: '±(0.3 + 0.005×|T|) °C' },
    { class: 'Class C (IEC 60751)', mpe: '±(0.6 + 0.01×|T|) °C' },
  ],
  keyRequirements: [
    'Reference: Standard PRT (Class 1/S2) with readout bridge or calibrated ASL F250',
    'Comparison method: stirred liquid bath (±0.02°C uniformity) or dry block (±0.1°C)',
    'Minimum 5 readings per calibration point after thermal stabilisation (≥15 min)',
    'Immersion depth: ≥10× probe diameter minimum',
    'Bath temperature stability: ±0.02°C over measurement period',
    'Calibration points: -40, 0, 50, 100, 200, 300, 400 °C (adjust for range)',
    'DKD-R5-1 / EURAMET cg-13 method',
  ],
};

const THERMAL_THERMOCOUPLE: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 5 (Thermocouple)',
  minReadings: 5,
  calibrationIntervalMonths: 12,
  mpe: '±1.5 °C or ±0.4% (Type K, whichever is greater)',
  accuracyClasses: [
    { class: 'Type K, Class 1', mpe: '±1.5 °C or ±0.4% (T > 375°C)' },
    { class: 'Type K, Class 2', mpe: '±2.5 °C or ±0.75% (T > 333°C)' },
    { class: 'Type J, Class 1', mpe: '±1.5 °C or ±0.4%' },
    { class: 'Type R/S, Class 1', mpe: '±1.0 °C or ±0.25%' },
    { class: 'Type R/S, Class 2', mpe: '±1.5 °C or ±0.25%' },
  ],
  keyRequirements: [
    'Reference: EURAMET cg-11 / ASTM E220 method',
    'Calibrate by comparison in horizontal tube furnace or vertical dry block',
    'Inhomogeneity assessment: UUC must be translated through uniform temperature zone',
    'Reference junction compensation verification required',
    'Minimum 5 readings at each calibration point after stabilisation',
    'Cold junction compensation check at 0 °C ice bath',
  ],
};

const THERMAL_LIG: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 5 (Liquid-in-Glass)',
  minReadings: 3,
  calibrationIntervalMonths: 24,
  mpe: '±0.5 °C (industrial LIG) / ±0.1 °C (precision LIG)',
  accuracyClasses: [
    { class: 'ASTM General Purpose', mpe: '±0.5 to ±1.0 °C' },
    { class: 'ASTM Precision / IP', mpe: '±0.1 to ±0.2 °C' },
    { class: 'SRS/NIST thermometers', mpe: '±0.02 °C' },
  ],
  keyRequirements: [
    'Reference: ASTM E1 / IS 4S (mercury-in-glass) / ASTM E2877 (digital contact)',
    'Comparison method in stirred liquid bath (total immersion preferred)',
    'Read UUC and reference simultaneously at each calibration point',
    'Parallex correction applied when reading oblique scale',
    'Thermal immersion depth: full bulb + 5 cm of stem minimum',
    'Corrections for emergent column where partial immersion used',
  ],
};

const THERMAL_HUMIDITY: Nabl129Criteria = {
  nablChapter: 'NABL 129 Chapter 5 (Humidity)',
  minReadings: 3,
  calibrationIntervalMonths: 12,
  mpe: '±2% RH',
  accuracyClasses: [
    { class: 'Class A (reference hygrometer)', mpe: '±1% RH' },
    { class: 'Class B (working standard)', mpe: '±2% RH' },
    { class: 'Class C (field instrument)', mpe: '±3–5% RH' },
  ],
  keyRequirements: [
    'Reference: DKD-R5-7 / ASTM E337 method',
    'Calibration by comparison in a humidity generation chamber',
    'Minimum 3 calibration points (typically 30%, 55%, 75% RH)',
    'Temperature effect must be evaluated over ±5°C of test temperature',
    'Chilled mirror hygrometer or two-pressure saturation generator as reference',
  ],
};

// ─── Lookup map: procedure ID → NABL 129 criteria ─────────────────

export const NABL129_MAP: Record<string, Nabl129Criteria> = {
  // ── Dimensional / Mechanical ──
  'mech-vernier-digital-caliper': DIMENSIONAL,
  'mech-outside-micrometer': DIMENSIONAL,
  'mech-inside-micrometer': DIMENSIONAL,
  'mech-depth-micrometer': DIMENSIONAL,
  'mech-bench-micrometer': DIMENSIONAL,
  'mech-height-gauge': DIMENSIONAL,
  'mech-dial-gauge-indicator': DIMENSIONAL,
  'mech-dial-test-indicator': DIMENSIONAL,
  'mech-bore-gauge': DIMENSIONAL,
  'mech-thread-gauge': DIMENSIONAL,
  'mech-slip-gauge': DIMENSIONAL,
  'mech-ruler-steel-rule': DIMENSIONAL,
  'mech-tape-measure': DIMENSIONAL,
  'mech-radius-gauge': DIMENSIONAL,
  'mech-feeler-gauge': DIMENSIONAL,
  'mech-angle-gauge': DIMENSIONAL,
  'mech-profile-projector': DIMENSIONAL,
  'mech-optical-comparator': DIMENSIONAL,
  'mech-coordinate-measuring-machine': DIMENSIONAL,
  'mech-surface-roughness-tester': SURFACE_TEXTURE,
  'mech-profilometer': SURFACE_TEXTURE,

  // ── Force & Torque ──
  'ft-force-gauge': PUSH_PULL,
  'ft-digital-force-gauge': PUSH_PULL,
  'ft-load-cell': FORCE_PROVING,
  'ft-utm': UTM,
  'ft-tensile-testing-machine': UTM,
  'ft-compression-testing-machine': UTM,
  'ft-proving-ring': FORCE_PROVING,
  'ft-dynamometer': FORCE_PROVING,
  'ft-crane-scale': FORCE_PROVING,
  'ft-spring-testing-machine': PUSH_PULL,
  'ft-impact-testing-machine': IMPACT_MACHINE,
  'ft-torque-wrench': TORQUE_GENERATING,
  'ft-torque-screwdriver': TORQUE_GENERATING,
  'ft-torque-tester-transducer': TORQUE_MEASURING,
  'ft-torque-analyzer': TORQUE_MEASURING,
  'ft-torque-multiplier': TORQUE_GENERATING,
  'ft-rockwell-hardness-tester': HARDNESS,
  'ft-brinell-hardness-tester': HARDNESS,
  'ft-vickers-hardness-tester': HARDNESS,
  'ft-knoop-hardness-tester': HARDNESS,
  'ft-shore-durometer': DUROMETER,
  'ft-leeb-hardness-tester': HARDNESS,
  'ft-adhesion-tester': PUSH_PULL,

  // ── Pressure ──
  'pr-analog-bourdon-gauge': PRESSURE_GAUGE,
  'pr-digital-pressure-gauge': PRESSURE_GAUGE,
  'pr-pressure-transmitter': PRESSURE_GAUGE,
  'pr-pressure-calibrator': PRESSURE_GAUGE,
  'pr-dead-weight-tester': DEAD_WEIGHT_TESTER,
  'pr-differential-pressure-gauge': PRESSURE_GAUGE,
  'pr-vacuum-gauge': PRESSURE_GAUGE,
  'pr-manometer': PRESSURE_GAUGE,
  'pr-pressure-switch': PRESSURE_GAUGE,
  'pr-pressure-relief-valve': PRESSURE_GAUGE,

  // ── Mass & Volume ──
  'mv-analytical-balance': MASS,
  'mv-precision-balance': MASS,
  'mv-platform-scale': MASS,
  'mv-crane-scale-mass': MASS,
  'mv-weighbridge': MASS,
  'mv-standard-weights': MASS,

  // ── Fluid Flow ──
  'ff-coriolis-flowmeter': FLOW_METER,
  'ff-electromagnetic-flowmeter': FLOW_METER,
  'ff-turbine-flowmeter': FLOW_METER,
  'ff-ultrasonic-flowmeter': FLOW_METER,
  'ff-differential-pressure-flowmeter': FLOW_METER,
  'ff-rotameter': FLOW_METER,
  'ff-glass-capillary-viscometer': VISCOMETER,
  'ff-rotational-viscometer': VISCOMETER,

  // ── Electro-Technical ──
  'et-digital-multimeter': ELECTRO_DMM,
  'et-clamp-meter': ELECTRO_DMM,
  'et-insulation-tester': ELEC_RESISTANCE,
  'et-earth-resistance-tester': ELEC_RESISTANCE,
  'et-voltage-calibrator': ELEC_VOLTAGE,
  'et-power-analyzer': POWER_ANALYZER,
  'et-energy-meter': POWER_ANALYZER,
  'et-oscilloscope': ELEC_VOLTAGE,
  'et-signal-generator': ELEC_VOLTAGE,
  'et-lcr-meter': ELEC_RESISTANCE,
  'et-waveform-generator': ELEC_VOLTAGE,

  // ── Thermal ──
  'th-sprt': THERMAL_SPRT,
  'th-rtd-pt100': THERMAL_RTD,
  'th-digital-thermometer': THERMAL_RTD,
  'th-thermocouple-indicator': THERMAL_THERMOCOUPLE,
  'th-bare-thermocouple': THERMAL_THERMOCOUPLE,
  'th-thermocouple-calibrator': THERMAL_THERMOCOUPLE,
  'th-liquid-in-glass-thermometer': THERMAL_LIG,
  'th-glass-thermometer': THERMAL_LIG,
  'th-infrared-thermometer': THERMAL_RTD,
  'th-thermal-imaging-camera': THERMAL_RTD,
  'th-humidity-chamber': THERMAL_HUMIDITY,
  'th-humidity-sensor': THERMAL_HUMIDITY,
  'th-hygrometer': THERMAL_HUMIDITY,
  'th-environmental-chamber': THERMAL_HUMIDITY,
  'th-dry-block-calibrator': THERMAL_RTD,
  'th-furnace-temperature': THERMAL_THERMOCOUPLE,
};

/** Get NABL 129 criteria for a procedure ID (returns null if not mapped). */
export function getNabl129(procedureId: string): Nabl129Criteria | null {
  return NABL129_MAP[procedureId] ?? null;
}
