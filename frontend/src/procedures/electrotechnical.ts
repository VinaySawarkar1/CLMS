// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: ELECTRO-TECHNICAL
// ─────────────────────────────────────────────────────────────────
// Methods follow NABL-122-02 (Specific Criteria — Electro-Technical),
// EA-4/02 (uncertainty evaluation) and EURAMET cg-15 (multimeters /
// calibrators). Type-B contributors per range are the reference-standard
// (multifunction calibrator / standard) uncertainty plus UUC resolution,
// with drift added where the standard's stability is significant.

import { Procedure, pts, tb, range, R3 } from './types';

const DISC = 'Electro Technical' as const;

export const ELECTRO_TECHNICAL: Procedure[] = [
  // ── Digital Multimeter (multi-function, 7 ranges) ────────────────
  {
    id: 'et-dmm',
    label: 'Digital Multimeter (DMM)',
    discipline: DISC,
    subDiscipline: 'DC Voltage',
    unit: 'V',
    points: pts('V', [0.1, 1, 10, 100, 1000]),
    typeB: tb('V', 0.00005, 0.0001),
    units: ['V', 'mV', 'A', 'mA', 'Ω', 'kΩ', 'MΩ', 'Hz', 'kHz', 'F', 'µF', 'nF'],
    ranges: [
      range('DC Voltage', 'V', [0.1, 1, 10, 100, 1000], tb('V', 0.00005, 0.0001), { altUnits: ['mV', 'µV'], rangeText: '0 – 1000 V DC' }),
      range('AC Voltage', 'V', [0.1, 1, 10, 100, 750], tb('V', 0.0003, 0.0001), { altUnits: ['mV'], rangeText: '0 – 750 V AC (45 Hz – 1 kHz)' }),
      range('DC Current', 'A', [0.001, 0.01, 0.1, 1, 10], tb('A', 0.00002, 0.00001), { altUnits: ['mA', 'µA'], rangeText: '0 – 10 A DC' }),
      range('AC Current', 'A', [0.001, 0.01, 0.1, 1, 10], tb('A', 0.0001, 0.00001), { altUnits: ['mA', 'µA'], rangeText: '0 – 10 A AC (45 Hz – 1 kHz)' }),
      range('Resistance', 'Ω', [10, 100, 1000, 10000, 100000, 1000000], tb('Ω', 0.001, 0.01), { altUnits: ['kΩ', 'MΩ'], rangeText: '0 Ω – 100 MΩ' }),
      range('Frequency', 'Hz', [10, 100, 1000, 10000, 100000], tb('Hz', 0.001, 0.001), { altUnits: ['kHz', 'MHz'], rangeText: '10 Hz – 1 MHz' }),
      range('Capacitance', 'F', [1e-9, 1e-8, 1e-7, 1e-6, 1e-5], tb('F', 1e-11, 1e-12), { altUnits: ['µF', 'nF', 'pF'], rangeText: '1 nF – 10 µF' }),
    ],
    procedureText:
      'The DMM is calibrated against a multifunction calibrator traceable to national standards on each function and range at 5 points covering 10–100 % of span. The calibrator is set to nominal values and the UUC indication recorded after stabilisation; error = UUC reading − applied value. AC functions are verified at reference frequency (1 kHz) and selected spot frequencies. Uncertainty is evaluated per EA-4/02 combining calibrator uncertainty, UUC resolution and repeatability.',
    nablReference: 'EURAMET cg-15 / NABL 122-02',
    referenceStandard: 'Multifunction calibrator (e.g. Fluke 5522A) with 8.5-digit reference DMM',
  },

  // ── Bench / System Multimeter ────────────────────────────────────
  {
    id: 'et-bench-dmm',
    label: 'Bench / System Multimeter (6.5–8.5 digit)',
    discipline: DISC,
    subDiscipline: 'DC Voltage',
    unit: 'V',
    points: pts('V', [0.1, 1, 10, 100, 1000]),
    typeB: tb('V', 0.000005, 0.00001),
    units: ['V', 'mV', 'A', 'mA', 'Ω', 'kΩ', 'MΩ'],
    ranges: [
      range('DC Voltage', 'V', [0.1, 1, 10, 100, 1000], tb('V', 0.000005, 0.00001), { altUnits: ['mV', 'µV'] }),
      range('DC Current', 'A', [0.001, 0.01, 0.1, 1, 3], tb('A', 0.00001, 0.000001), { altUnits: ['mA', 'µA'] }),
      range('Resistance', 'Ω', [100, 1000, 10000, 100000, 1000000, 10000000], tb('Ω', 0.0005, 0.001), { altUnits: ['kΩ', 'MΩ', 'GΩ'], rangeText: '100 Ω – 100 MΩ (4-wire)' }),
    ],
    procedureText:
      'The bench multimeter is calibrated using a high-accuracy multifunction calibrator and reference standards, employing 4-wire (Kelvin) connection for resistance ranges to eliminate lead error. Each range is verified at multiple points with the instrument in its specified integration / NPLC setting. Errors and uncertainties are reported per EA-4/02 with traceability to national DC voltage and resistance standards.',
    nablReference: 'EURAMET cg-15 / NABL 122-02',
    referenceStandard: 'Fluke 5522A / 5730A calibrator, standard resistors',
  },

  // ── Multifunction Calibrator (source) ────────────────────────────
  {
    id: 'et-mf-calibrator',
    label: 'Multifunction Calibrator (source)',
    discipline: DISC,
    subDiscipline: 'DC Voltage',
    unit: 'V',
    points: pts('V', [1, 10, 100, 1000]),
    typeB: tb('V', 0.0000015, 0.000001, [{ source: '1-year stability of calibrator', value: 0.000003, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'V' }]),
    units: ['V', 'mV', 'A', 'mA', 'Ω', 'kΩ', 'MΩ', 'Hz'],
    ranges: [
      range('DC Voltage', 'V', [0.1, 1, 10, 100, 1000], tb('V', 0.0000015, 0.000001), { altUnits: ['mV', 'µV'] }),
      range('AC Voltage', 'V', [0.1, 1, 10, 100, 750], tb('V', 0.0001, 0.00001)),
      range('DC Current', 'A', [0.001, 0.01, 0.1, 1, 10, 20], tb('A', 0.00005, 0.000001), { altUnits: ['mA', 'µA'] }),
      range('AC Current', 'A', [0.001, 0.01, 0.1, 1, 10], tb('A', 0.0002, 0.000001), { altUnits: ['mA', 'µA'] }),
      range('Resistance', 'Ω', [1, 10, 100, 1000, 10000, 100000, 1000000], tb('Ω', 0.00005, 0.0001), { altUnits: ['kΩ', 'MΩ'] }),
    ],
    procedureText:
      'The calibrator is calibrated in SOURCE mode by measuring its output with reference standards: an 8.5-digit DMM and Josephson-traceable DC voltage references, standard resistors and AC measurement standards. Output is set to nominal and the true value measured; deviation and uncertainty are computed per EA-4/02 including the reference uncertainty and the calibrator short-term stability. Traceability is maintained to national electrical standards.',
    nablReference: 'EURAMET cg-15 / NABL 122-02',
    referenceStandard: 'Reference 8.5-digit DMM, standard cells, standard resistors',
  },

  // ── Clamp Meter (AC/DC current) ──────────────────────────────────
  {
    id: 'et-clamp-meter',
    label: 'Clamp Meter (AC/DC Current)',
    discipline: DISC,
    subDiscipline: 'AC Current',
    unit: 'A',
    points: pts('A', [1, 10, 100, 600, 1000]),
    typeB: tb('A', 0.05, 0.1, [{ source: 'Conductor position in jaw', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'A' }]),
    units: ['A', 'mA'],
    ranges: [
      range('AC Current', 'A', [1, 10, 100, 600, 1000], tb('A', 0.05, 0.1), { rangeText: '1 – 1000 A AC (50 Hz)' }),
      range('DC Current', 'A', [1, 10, 100, 600, 1000], tb('A', 0.05, 0.1), { rangeText: '1 – 1000 A DC' }),
    ],
    procedureText:
      'The clamp meter is calibrated using a current coil / loop fed from a calibrated AC-DC current source, with the conductor centred in the jaw to minimise position error. For high currents a 10- or 50-turn coil multiplies the source current; applied value = source current × turns. Errors are recorded at several points and uncertainty includes source uncertainty, resolution and conductor-position effect per EA-4/02.',
    nablReference: 'NABL 122-02 / EURAMET cg-15',
    referenceStandard: 'Calibrated current source with multi-turn coil, reference current shunt',
  },

  // ── Insulation Tester / Megger ───────────────────────────────────
  {
    id: 'et-insulation-tester',
    label: 'Insulation Resistance Tester (Megger)',
    discipline: DISC,
    subDiscipline: 'Insulation & High Voltage',
    unit: 'MΩ',
    points: pts('MΩ', [1, 10, 100, 1000, 10000]),
    typeB: tb('MΩ', 0.2, 0.1),
    units: ['MΩ', 'GΩ', 'kΩ', 'V'],
    ranges: [
      range('Insulation Resistance', 'MΩ', [1, 10, 100, 1000, 10000], tb('MΩ', 0.2, 0.1), { altUnits: ['GΩ', 'kΩ'], rangeText: '1 MΩ – 10 GΩ' }),
      range('Test Voltage (output)', 'V', [250, 500, 1000, 2500, 5000], tb('V', 1.5, 1), { altUnits: ['kV'], rangeText: '250 V – 5 kV DC' }),
    ],
    procedureText:
      'The insulation tester is calibrated for indicated resistance using a high-resistance standard / decade box at the rated test voltage of each range, and the open-circuit output (test) voltage is measured with a high-voltage divider and reference DMM. Resistance points are applied and the UUC indication recorded; output voltage is checked at no-load. Uncertainty per EA-4/02 includes standard-resistor uncertainty, voltage divider ratio uncertainty and UUC resolution.',
    nablReference: 'NABL 122-02 / EURAMET',
    referenceStandard: 'High-resistance standard / decade box, HV divider, reference DMM',
  },

  // ── Earth / Ground Resistance Tester ─────────────────────────────
  {
    id: 'et-earth-resistance-tester',
    label: 'Earth / Ground Resistance Tester',
    discipline: DISC,
    subDiscipline: 'Resistance',
    unit: 'Ω',
    points: pts('Ω', [1, 10, 100, 1000, 2000]),
    typeB: tb('Ω', 0.05, 0.01),
    units: ['Ω', 'kΩ'],
    ranges: [
      range('Earth Resistance', 'Ω', [1, 10, 100, 1000, 2000], tb('Ω', 0.05, 0.01), { altUnits: ['kΩ'], rangeText: '0.1 Ω – 2 kΩ' }),
    ],
    procedureText:
      'The earth resistance tester is calibrated by connecting calibrated low-TCR standard resistors (decade box) across its C–P (potential / current) terminals simulating the earth-electrode loop. Resistance is applied at several points and the indicated value recorded; error = indication − standard value. Uncertainty per EA-4/02 includes the standard-resistor uncertainty, lead resistance and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Calibrated decade resistance box / standard resistors',
  },

  // ── Micro-ohmmeter ───────────────────────────────────────────────
  {
    id: 'et-micro-ohmmeter',
    label: 'Micro-ohmmeter / Milli-ohmmeter',
    discipline: DISC,
    subDiscipline: 'Resistance',
    unit: 'mΩ',
    points: pts('mΩ', [1, 10, 100, 1000],),
    typeB: tb('mΩ', 0.02, 0.01),
    units: ['mΩ', 'Ω', 'µΩ'],
    ranges: [
      range('Low Resistance', 'mΩ', [1, 10, 100, 1000], tb('mΩ', 0.02, 0.01), { altUnits: ['Ω', 'µΩ'], rangeText: '1 µΩ – 2 Ω (4-wire)' }),
    ],
    procedureText:
      'The micro-ohmmeter is calibrated using certified low-value standard resistors (e.g. 4-terminal Kelvin standards) connected in 4-wire configuration to eliminate lead and contact resistance. Standard resistances are applied across the decades and indications recorded; the test current is also verified. Uncertainty per EA-4/02 includes standard-resistor uncertainty, thermal EMF and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: '4-terminal standard resistors (Kelvin), reference DMM',
  },

  // ── LCR Meter ────────────────────────────────────────────────────
  {
    id: 'et-lcr-meter',
    label: 'LCR Meter',
    discipline: DISC,
    subDiscipline: 'Capacitance & Inductance',
    unit: 'F',
    points: pts('F', [1e-9, 1e-7, 1e-6, 1e-4]),
    typeB: tb('F', 1e-11, 1e-12),
    units: ['F', 'µF', 'nF', 'pF', 'H', 'mH', 'Ω', 'kΩ'],
    ranges: [
      range('Capacitance', 'F', [1e-10, 1e-9, 1e-8, 1e-7, 1e-6, 1e-4], tb('F', 1e-12, 1e-13), { altUnits: ['µF', 'nF', 'pF'], rangeText: '100 pF – 100 µF' }),
      range('Inductance', 'H', [1e-3, 1e-2, 1e-1, 1, 10], tb('H', 5e-6, 1e-6), { altUnits: ['mH'], rangeText: '1 mH – 10 H' }),
      range('Resistance', 'Ω', [1, 10, 100, 1000, 10000, 100000], tb('Ω', 0.005, 0.001), { altUnits: ['kΩ'], rangeText: '1 Ω – 100 kΩ' }),
    ],
    procedureText:
      'The LCR meter is calibrated against certified standard capacitors, inductors and resistors at the instrument\'s test frequencies (e.g. 100 Hz, 1 kHz, 10 kHz) and test signal level. Each standard is connected and the measured value compared at several decades; open/short compensation is performed before measurement. Uncertainty per EA-4/02 includes standard-component uncertainty, frequency effect and UUC resolution.',
    nablReference: 'NABL 122-02 / EURAMET',
    referenceStandard: 'Standard capacitors, inductors and AC resistors',
  },

  // ── Decade Resistance Box ────────────────────────────────────────
  {
    id: 'et-decade-resistance-box',
    label: 'Decade Resistance Box',
    discipline: DISC,
    subDiscipline: 'Resistance',
    unit: 'Ω',
    points: pts('Ω', [1, 10, 100, 1000, 10000, 100000, 1000000]),
    typeB: tb('Ω', 0.001, 0.0001),
    units: ['Ω', 'kΩ', 'MΩ'],
    ranges: [
      range('Resistance', 'Ω', [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000], tb('Ω', 0.001, 0.0001), { altUnits: ['kΩ', 'MΩ'], rangeText: '0.1 Ω – 1 MΩ' }),
    ],
    procedureText:
      'Each decade and selected combination settings of the resistance box are measured with a reference DMM / resistance bridge in 4-wire connection traceable to national standards. The nominal value is selected and the true resistance measured; residual / zero resistance of the box is also recorded. Uncertainty per EA-4/02 includes reference-measurement uncertainty, temperature coefficient and switch contact resistance.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Reference resistance bridge / 8.5-digit DMM, standard resistors',
  },

  // ── Decade Capacitance Box ───────────────────────────────────────
  {
    id: 'et-decade-capacitance-box',
    label: 'Decade Capacitance Box',
    discipline: DISC,
    subDiscipline: 'Capacitance & Inductance',
    unit: 'F',
    points: pts('F', [1e-9, 1e-8, 1e-7, 1e-6, 1e-5]),
    typeB: tb('F', 5e-12, 1e-12),
    units: ['F', 'µF', 'nF', 'pF'],
    ranges: [
      range('Capacitance', 'F', [1e-10, 1e-9, 1e-8, 1e-7, 1e-6, 1e-5], tb('F', 5e-12, 1e-12), { altUnits: ['µF', 'nF', 'pF'], rangeText: '100 pF – 10 µF' }),
    ],
    procedureText:
      'Each decade setting of the capacitance box is measured with a precision LCR meter / capacitance bridge at a defined test frequency (typically 1 kHz) traceable to standard capacitors. Settings are applied and the measured capacitance compared to nominal; residual capacitance is recorded. Uncertainty per EA-4/02 includes reference-bridge uncertainty, frequency dependence and switch effects.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Precision capacitance bridge, standard capacitors',
  },

  // ── Oscilloscope (Voltage / Time) ────────────────────────────────
  {
    id: 'et-oscilloscope',
    label: 'Oscilloscope (Voltage & Time base)',
    discipline: DISC,
    subDiscipline: 'Frequency & Time',
    unit: 'V',
    points: pts('V', [0.01, 0.1, 1, 5, 40]),
    typeB: tb('V', 0.002, 0.001),
    units: ['V', 'mV', 'Hz', 'MHz'],
    ranges: [
      range('DC / Amplitude (Vertical)', 'V', [0.01, 0.1, 1, 5, 40], tb('V', 0.002, 0.001), { altUnits: ['mV'], rangeText: '1 mV/div – 10 V/div' }),
      range('Time base / Frequency', 'Hz', [1000, 10000, 100000, 1000000, 100000000], tb('Hz', 0.5, 0.1), { altUnits: ['kHz', 'MHz'], rangeText: '1 kHz – 1 GHz (timebase)' }),
    ],
    procedureText:
      'The oscilloscope is calibrated using an oscilloscope calibrator providing traceable DC / square-wave amplitude and precise timebase markers / sinewave frequencies. Vertical deflection accuracy is checked per division at several settings, bandwidth and rise-time verified, and timebase accuracy measured against the calibrator markers. Uncertainty per EA-4/02 includes calibrator uncertainty, cursor / readout resolution and UUC repeatability.',
    nablReference: 'EURAMET cg / NABL 122-02',
    referenceStandard: 'Oscilloscope calibrator (e.g. Fluke 9500B with active head)',
  },

  // ── Frequency Counter ────────────────────────────────────────────
  {
    id: 'et-frequency-counter',
    label: 'Frequency Counter',
    discipline: DISC,
    subDiscipline: 'Frequency & Time',
    unit: 'Hz',
    points: pts('Hz', [10, 1000, 100000, 10000000, 100000000]),
    typeB: tb('Hz', 0.0001, 0.001, [{ source: 'Reference oscillator drift / aging', value: 0.001, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'Hz' }]),
    units: ['Hz', 'kHz', 'MHz'],
    ranges: [
      range('Frequency', 'Hz', [10, 1000, 100000, 10000000, 100000000], tb('Hz', 0.0001, 0.001), { altUnits: ['kHz', 'MHz'], rangeText: '10 Hz – 100 MHz' }),
    ],
    procedureText:
      'The frequency counter is calibrated against a Rubidium / GPS-disciplined frequency reference standard. Reference frequencies are applied at several points and the counter reading compared, and the internal timebase offset is measured by direct comparison. Uncertainty per EA-4/02 is dominated by the reference standard accuracy, counter resolution (±1 count) and timebase aging.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Rubidium / GPS-disciplined frequency standard',
  },

  // ── Function / Signal Generator ──────────────────────────────────
  {
    id: 'et-function-generator',
    label: 'Function / Signal Generator',
    discipline: DISC,
    subDiscipline: 'Frequency & Time',
    unit: 'Hz',
    points: pts('Hz', [10, 1000, 100000, 1000000, 20000000]),
    typeB: tb('Hz', 0.0005, 0.01),
    units: ['Hz', 'kHz', 'MHz', 'V', 'mV'],
    ranges: [
      range('Output Frequency', 'Hz', [10, 1000, 100000, 1000000, 20000000], tb('Hz', 0.0005, 0.01), { altUnits: ['kHz', 'MHz'], rangeText: '1 Hz – 20 MHz' }),
      range('Output Amplitude', 'V', [0.01, 0.1, 1, 5, 10], tb('V', 0.002, 0.001), { altUnits: ['mV'], rangeText: '10 mV – 10 Vpp' }),
    ],
    procedureText:
      'The generator output frequency is measured with a traceable frequency counter and the output amplitude / level measured with a reference DMM (true-RMS) or power sensor at defined frequencies. Nominal settings are commanded and the actual output measured at several points; flatness across frequency is checked. Uncertainty per EA-4/02 includes counter / level-meter uncertainty, load mismatch and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Frequency counter (Rb-referenced), reference RMS voltmeter / power sensor',
  },

  // ── DC Power Supply ──────────────────────────────────────────────
  {
    id: 'et-dc-power-supply',
    label: 'DC Power Supply',
    discipline: DISC,
    subDiscipline: 'DC Voltage',
    unit: 'V',
    points: pts('V', [1, 5, 12, 30, 60]),
    typeB: tb('V', 0.0001, 0.001),
    units: ['V', 'A'],
    ranges: [
      range('Output Voltage', 'V', [1, 5, 12, 30, 60], tb('V', 0.0001, 0.001), { rangeText: '0 – 60 V DC' }),
      range('Output Current', 'A', [0.1, 0.5, 1, 5, 10], tb('A', 0.0005, 0.001), { altUnits: ['mA'], rangeText: '0 – 10 A DC' }),
    ],
    procedureText:
      'The DC power supply is calibrated in constant-voltage and constant-current modes by measuring the actual output with a reference DMM (voltage) and a calibrated current shunt / DMM (current) under appropriate load. Setpoints are commanded and the true output measured at several points; line / load regulation and display error are recorded. Uncertainty per EA-4/02 includes reference-meter uncertainty, shunt uncertainty and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Reference DMM, precision current shunt, electronic load',
  },

  // ── Digital Wattmeter / Power Meter ──────────────────────────────
  {
    id: 'et-wattmeter',
    label: 'Digital Wattmeter / Power Meter',
    discipline: DISC,
    subDiscipline: 'Power & Energy',
    unit: 'W',
    points: pts('W', [10, 100, 1000, 5000]),
    typeB: tb('W', 0.5, 0.1, [{ source: 'Power factor / phase angle effect', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'W' }]),
    units: ['W', 'kW', 'VA', 'V', 'A'],
    ranges: [
      range('Active Power', 'W', [10, 100, 1000, 5000], tb('W', 0.5, 0.1), { altUnits: ['kW', 'VA'], rangeText: '10 W – 5 kW' }),
      range('Voltage', 'V', [60, 120, 240, 480], tb('V', 0.02, 0.01), { rangeText: '60 – 480 V' }),
      range('Current', 'A', [0.1, 1, 5, 20], tb('A', 0.002, 0.001), { rangeText: '0.1 – 20 A' }),
    ],
    procedureText:
      'The wattmeter is calibrated using a reference power standard / multifunction calibrator that sources phantom power (independent V and I channels) at defined voltage, current and power factor (cos φ). Power points are applied at several PF values (1.0, 0.5L, 0.5C) and the UUC indication compared. Uncertainty per EA-4/02 includes the power-standard uncertainty, phase-angle effect and UUC resolution.',
    nablReference: 'NABL 122-02 / EURAMET',
    referenceStandard: 'Reference power standard / phantom-power source (e.g. Fluke 6105A / 5522A)',
  },

  // ── Power / Energy Analyzer ──────────────────────────────────────
  {
    id: 'et-power-analyzer',
    label: 'Power / Energy Analyzer',
    discipline: DISC,
    subDiscipline: 'Power & Energy',
    unit: 'W',
    points: pts('W', [100, 1000, 10000, 50000]),
    typeB: tb('W', 0.3, 0.1, [{ source: 'Power factor / harmonic effect', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'W' }]),
    units: ['W', 'kW', 'VA', 'V', 'A', 'Hz'],
    ranges: [
      range('Active Power', 'W', [100, 1000, 10000, 50000], tb('W', 0.3, 0.1), { altUnits: ['kW'], rangeText: '100 W – 50 kW' }),
      range('RMS Voltage', 'V', [60, 120, 240, 480, 600], tb('V', 0.015, 0.01), { rangeText: '60 – 600 V' }),
      range('RMS Current', 'A', [0.1, 1, 5, 20, 50], tb('A', 0.0015, 0.001), { rangeText: '0.1 – 50 A' }),
      range('Frequency', 'Hz', [45, 50, 60, 400], tb('Hz', 0.005, 0.001), { rangeText: '45 – 400 Hz' }),
    ],
    procedureText:
      'The multi-channel power analyzer is calibrated against a reference power / energy standard sourcing traceable voltage, current, phase and frequency for single- and three-phase configurations. Active power, RMS voltage/current and frequency are verified at multiple points and power factors; harmonic response may be checked. Uncertainty per EA-4/02 includes power-standard uncertainty, phase / harmonic effects and UUC resolution.',
    nablReference: 'NABL 122-02 / EURAMET',
    referenceStandard: 'Three-phase reference power standard (e.g. Fluke 6105A / Zera)',
  },

  // ── Energy Meter (kWh) ───────────────────────────────────────────
  {
    id: 'et-energy-meter',
    label: 'Energy Meter (kWh)',
    discipline: DISC,
    subDiscipline: 'Power & Energy',
    unit: 'kWh',
    points: pts('kWh', [1, 5, 10, 50, 100]),
    typeB: tb('kWh', 0.0005, 0.0001, [{ source: 'Pulse counting / start-stop error', value: 0.0003, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'kWh' }]),
    units: ['kWh', 'W', 'kW'],
    ranges: [
      range('Energy', 'kWh', [1, 5, 10, 50, 100], tb('kWh', 0.0005, 0.0001), { rangeText: '1 – 100 kWh' }),
    ],
    procedureText:
      'The energy meter is calibrated using a reference standard meter / energy source by the comparison method: a known load (voltage × current × power factor × time) is applied and the energy registered by the UUC compared to the reference standard meter, typically via the meter\'s LED pulse output against the standard. Percentage error is computed at several loads and PFs. Uncertainty per EA-4/02 includes reference-meter uncertainty, pulse-resolution and timing.',
    nablReference: 'NABL 122-02 / IS 13779',
    referenceStandard: 'Reference standard energy meter (class 0.05), phantom load source',
  },

  // ── Panel Meters (V / A) ─────────────────────────────────────────
  {
    id: 'et-panel-meter',
    label: 'Analog / Digital Panel Meter (V / A)',
    discipline: DISC,
    subDiscipline: 'DC Voltage',
    unit: 'V',
    points: pts('V', [0, 25, 50, 75, 100]),
    typeB: tb('V', 0.01, 0.5, [{ source: 'Reading / parallax (analog scale)', value: 0.25, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'V' }]),
    units: ['V', 'A', 'mA'],
    ranges: [
      range('Voltage', 'V', [0, 25, 50, 75, 100], tb('V', 0.01, 0.5), { rangeText: '0 – 100 % of FSD' }),
      range('Current', 'A', [0, 2.5, 5, 7.5, 10], tb('A', 0.002, 0.05), { altUnits: ['mA'], rangeText: '0 – 100 % of FSD' }),
    ],
    procedureText:
      'The panel meter is calibrated by applying traceable voltage / current from a multifunction calibrator at 0, 25, 50, 75 and 100 % of full-scale deflection and recording the indicated value. For analog meters readings are taken with care for parallax and the up-scale / down-scale (hysteresis) noted. Uncertainty per EA-4/02 includes calibrator uncertainty, scale reading / parallax and friction.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Multifunction calibrator, reference DMM',
  },

  // ── High Voltage Tester ──────────────────────────────────────────
  {
    id: 'et-hv-tester',
    label: 'High Voltage Tester (Hipot)',
    discipline: DISC,
    subDiscipline: 'Insulation & High Voltage',
    unit: 'kV',
    points: pts('kV', [1, 5, 10, 20, 30]),
    typeB: tb('kV', 0.02, 0.01, [{ source: 'HV divider ratio uncertainty', value: 0.015, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'kV' }]),
    units: ['kV', 'V', 'mA'],
    ranges: [
      range('AC/DC Test Voltage', 'kV', [1, 5, 10, 20, 30], tb('kV', 0.02, 0.01), { altUnits: ['V'], rangeText: '1 – 30 kV' }),
      range('Trip / Leakage Current', 'mA', [0.5, 1, 5, 10, 20], tb('mA', 0.02, 0.01), { rangeText: '0 – 20 mA' }),
    ],
    procedureText:
      'The HV tester output voltage is measured using a calibrated high-voltage divider (resistive / capacitive) with a reference DMM, and the trip / leakage current threshold is verified with a calibrated current measurement. Output is set at several points and the true HV measured; the breakdown / trip current setting is checked. Uncertainty per EA-4/02 includes divider-ratio uncertainty, reference-meter uncertainty and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Calibrated HV divider + reference DMM, standard current meter',
  },

  // ── Tong Tester ──────────────────────────────────────────────────
  {
    id: 'et-tong-tester',
    label: 'Tong Tester (Clamp-on Ammeter)',
    discipline: DISC,
    subDiscipline: 'AC Current',
    unit: 'A',
    points: pts('A', [5, 50, 200, 600]),
    typeB: tb('A', 0.05, 0.1, [{ source: 'Conductor position in jaw', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'A' }]),
    units: ['A'],
    ranges: [
      range('AC Current', 'A', [5, 50, 200, 600], tb('A', 0.05, 0.1), { rangeText: '5 – 600 A AC (50 Hz)' }),
    ],
    procedureText:
      'The tong tester is calibrated with a calibrated AC current source feeding a single- or multi-turn coil passed through the jaw, the conductor centred to limit position error. Current is applied at several points (applied = source × turns) and the UUC indication recorded. Uncertainty per EA-4/02 includes source uncertainty, conductor-position effect and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Calibrated AC current source with multi-turn coil',
  },

  // ── RCD / ELCB Tester (trip time) ────────────────────────────────
  {
    id: 'et-rcd-tester',
    label: 'RCD / ELCB Tester (Trip Time & Current)',
    discipline: DISC,
    subDiscipline: 'Frequency & Time',
    unit: 'ms',
    points: pts('ms', [25, 40, 150, 300, 500]),
    typeB: tb('ms', 0.1, 0.5),
    units: ['ms', 'mA'],
    ranges: [
      range('Trip Time', 'ms', [25, 40, 150, 300, 500], tb('ms', 0.1, 0.5), { rangeText: '0 – 500 ms' }),
      range('Trip Current', 'mA', [10, 30, 100, 300, 500], tb('mA', 0.05, 0.1), { rangeText: '10 – 500 mA' }),
    ],
    procedureText:
      'The RCD tester is calibrated for trip-time and trip-current using a reference RCD calibration adaptor / electronic load that emulates an RCD: the tester injects its test current and the reference instrument measures the actual current and the time duration. Trip time is verified at several test multiples (½×, 1×, 5× IΔn) and currents. Uncertainty per EA-4/02 includes the reference timer / current uncertainty and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'RCD calibration standard / reference timer & current meter',
  },

  // ── Loop Impedance Tester ────────────────────────────────────────
  {
    id: 'et-loop-impedance-tester',
    label: 'Loop / Line Impedance Tester',
    discipline: DISC,
    subDiscipline: 'Resistance',
    unit: 'Ω',
    points: pts('Ω', [0.1, 1, 10, 100, 200]),
    typeB: tb('Ω', 0.02, 0.01),
    units: ['Ω'],
    ranges: [
      range('Loop Impedance', 'Ω', [0.1, 1, 10, 100, 200], tb('Ω', 0.02, 0.01), { rangeText: '0.01 – 200 Ω' }),
    ],
    procedureText:
      'The loop impedance tester is calibrated using calibrated standard impedances / resistors connected in its line-earth (loop) measurement circuit, with prospective-short-circuit current (PSC) cross-checked where applicable. Standard impedance values are applied across the range and the indication recorded. Uncertainty per EA-4/02 includes standard-impedance uncertainty, lead resistance and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Calibrated loop-impedance standard / standard resistors',
  },

  // ── PAT / Appliance Tester ───────────────────────────────────────
  {
    id: 'et-pat-tester',
    label: 'PAT / Appliance Tester',
    discipline: DISC,
    subDiscipline: 'Insulation & High Voltage',
    unit: 'Ω',
    points: pts('Ω', [0.1, 1, 5, 10]),
    typeB: tb('Ω', 0.01, 0.01),
    units: ['Ω', 'MΩ', 'V', 'mA'],
    ranges: [
      range('Earth Continuity (Bond)', 'Ω', [0.1, 0.5, 1, 5, 10], tb('Ω', 0.01, 0.01), { rangeText: '0.01 – 10 Ω' }),
      range('Insulation Resistance', 'MΩ', [1, 10, 100, 1000], tb('MΩ', 0.2, 0.1), { altUnits: ['GΩ'], rangeText: '0.1 MΩ – 1 GΩ' }),
      range('Test / Output Voltage', 'V', [250, 500], tb('V', 1.5, 1), { rangeText: '250 – 500 V DC' }),
    ],
    procedureText:
      'The PAT tester is calibrated function-by-function: earth-continuity (bond) resistance against low-value standard resistors at the rated test current, insulation resistance against high-resistance standards at the rated test voltage, and output / test voltages with a reference DMM (and HV divider where needed). Standards are applied and indications recorded per function. Uncertainty per EA-4/02 combines standard uncertainty, lead effect and UUC resolution.',
    nablReference: 'NABL 122-02',
    referenceStandard: 'Standard resistors (low & high value), reference DMM',
  },

  // ── CT / PT (Transformer ratio) ──────────────────────────────────
  {
    id: 'et-ct-pt-ratio',
    label: 'Current / Potential Transformer (Ratio)',
    discipline: DISC,
    subDiscipline: 'AC Current',
    unit: 'A',
    points: pts('A', [1, 5, 50, 100]),
    typeB: tb('A', 0.002, 0.001, [{ source: 'Ratio / phase-angle error of reference CT', value: 0.0015, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'A' }]),
    units: ['A', 'V', 'kV'],
    ranges: [
      range('CT Ratio (Current)', 'A', [1, 5, 50, 100], tb('A', 0.002, 0.001), { rangeText: 'Primary 1 – 100 A → secondary 1 / 5 A' }),
      range('PT Ratio (Voltage)', 'V', [110, 240, 415, 1100], tb('V', 0.02, 0.01), { altUnits: ['kV'], rangeText: 'Primary up to 11 kV → secondary 110 V' }),
    ],
    procedureText:
      'The instrument transformer is calibrated for ratio and phase-angle error by comparison against a reference standard CT / PT using a transformer test set (comparator / bridge) at defined burden and percentage of rated current/voltage. Ratio and phase errors are measured at standard burden and several load points (e.g. 5, 20, 100, 120 %). Uncertainty per EA-4/02 includes the reference-transformer uncertainty, burden and comparator resolution.',
    nablReference: 'NABL 122-02 / IS 2705 / IS 3156',
    referenceStandard: 'Reference standard CT/PT + transformer test set (comparator bridge)',
  },
];
