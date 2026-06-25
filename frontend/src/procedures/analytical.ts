// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: ANALYTICAL / ELECTRO-CHEMICAL
// ─────────────────────────────────────────────────────────────────
// Methods follow NABL-126 (Specific Criteria — Chemical / Electro-Chemical),
// ISO/IEC 17025 and EURAMET cg-19 (pH measurement). Calibration is performed
// using Certified Reference Materials (CRMs) — buffer solutions, conductivity
// standards, turbidity (formazin) standards and reference gas mixtures —
// traceable to national / international standards. Type-B contributors per
// range are the CRM/reference-standard uncertainty (from certificate) plus
// the UUC resolution, with temperature and drift added where significant.

import { Procedure, pts, tb, range, R3 } from './types';

const DISC = 'Analytical / Electro-Chemical' as const;

export const ANALYTICAL: Procedure[] = [
  // ── pH Meter ──────────────────────────────────────────────────────
  {
    id: 'an-ph-meter',
    label: 'pH Meter',
    discipline: DISC,
    subDiscipline: 'pH & ORP',
    unit: 'pH',
    points: pts('pH', [4.0, 7.0, 9.2, 10.01]),
    typeB: tb('pH', 0.01, 0.01, [
      { source: 'Temperature effect on buffer (± buffer dpH/dT)', value: 0.01, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'pH' },
      { source: 'Drift / repeatability of electrode', value: 0.01, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'pH' },
    ]),
    units: ['pH', 'mV'],
    ranges: [
      range('pH', 'pH', [4.0, 7.0, 9.2, 10.01], tb('pH', 0.01, 0.01), { altUnits: ['mV'], rangeText: '0 – 14 pH' }),
      range('Potential (mV)', 'mV', [-1000, -500, 0, 500, 1000], tb('mV', 0.2, 0.1), { rangeText: '−1000 – +1000 mV' }),
    ],
    procedureText:
      'The pH meter with its electrode is calibrated using certified pH buffer solutions (CRM) at nominal pH 4.00, 7.00, 9.20 and 10.01, all maintained at the reference temperature (25 °C) in a controlled bath. The electrode is rinsed with distilled water and blotted between buffers. After a 2-point/3-point calibration the UUC reading in each buffer is recorded after stabilisation; error = UUC reading − certified buffer value at measurement temperature. Uncertainty is evaluated per EURAMET cg-19 combining buffer certificate uncertainty, UUC resolution, temperature coefficient of the buffer and electrode repeatability/drift.',
    nablReference: 'EURAMET cg-19 / NABL 126',
    referenceStandard: 'Certified pH buffer solutions (CRM, NIST-traceable), precision thermometer',
  },

  // ── ORP Meter ─────────────────────────────────────────────────────
  {
    id: 'an-orp-meter',
    label: 'ORP / Redox Meter',
    discipline: DISC,
    subDiscipline: 'pH & ORP',
    unit: 'mV',
    points: pts('mV', [-200, 0, 200, 470, 600]),
    typeB: tb('mV', 0.5, 0.1, [
      { source: 'Temperature effect on redox standard', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mV' },
      { source: 'Drift / repeatability of electrode', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mV' },
    ]),
    units: ['mV'],
    ranges: [
      range('ORP (Redox potential)', 'mV', [-200, 0, 200, 470, 600], tb('mV', 0.5, 0.1), { rangeText: '−1500 – +1500 mV' }),
    ],
    procedureText:
      'The ORP meter and its platinum/Ag-AgCl electrode are calibrated using certified redox (ORP) standard solutions — typically a 220 mV and a 470 mV reference solution (CRM) — at the reference temperature. The electrode is rinsed and blotted between solutions; the UUC indication is recorded after stabilisation and error = UUC reading − certified standard value corrected to measurement temperature. Uncertainty combines the redox-standard certificate uncertainty, UUC resolution, temperature dependence and electrode repeatability.',
    nablReference: 'NABL 126 / ISO/IEC 17025',
    referenceStandard: 'Certified ORP / redox standard solutions (220 mV, 470 mV CRM)',
  },

  // ── Conductivity Meter ────────────────────────────────────────────
  {
    id: 'an-conductivity-meter',
    label: 'Conductivity Meter',
    discipline: DISC,
    subDiscipline: 'Conductivity & TDS',
    unit: 'µS/cm',
    points: pts('µS/cm', [84, 1413, 12880]),
    typeB: tb('µS/cm', 0.5, 0.1, [
      { source: 'Temperature effect on KCl standard', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'µS/cm' },
      { source: 'Cell-constant / drift of standard', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'µS/cm' },
    ]),
    units: ['µS/cm', 'mS/cm'],
    ranges: [
      range('Conductivity (low)', 'µS/cm', [84, 1413], tb('µS/cm', 0.5, 0.1), { altUnits: ['mS/cm'], rangeText: '84 – 1413 µS/cm' }),
      range('Conductivity (high)', 'mS/cm', [12.88], tb('mS/cm', 0.05, 0.01), { altUnits: ['µS/cm'], rangeText: '12.88 mS/cm' }),
    ],
    procedureText:
      'The conductivity meter and cell are calibrated using certified KCl conductivity standard solutions (CRM) of 84 µS/cm, 1413 µS/cm and 12.88 mS/cm at the reference temperature (25 °C). The cell is rinsed with the standard before measurement to avoid dilution. The UUC reading is recorded after stabilisation with the meter set to no temperature compensation (or 2 %/°C reference) and error = UUC reading − certified value at measurement temperature. Uncertainty combines the standard-solution certificate uncertainty, UUC resolution, temperature coefficient (~2 %/°C) and cell-constant drift.',
    nablReference: 'OIML R 56 / NABL 126',
    referenceStandard: 'Certified KCl conductivity standards (84 µS/cm, 1413 µS/cm, 12.88 mS/cm CRM)',
  },

  // ── TDS Meter ─────────────────────────────────────────────────────
  {
    id: 'an-tds-meter',
    label: 'TDS Meter',
    discipline: DISC,
    subDiscipline: 'Conductivity & TDS',
    unit: 'ppm',
    points: pts('ppm', [342, 707, 1000]),
    typeB: tb('ppm', 1.0, 1.0, [
      { source: 'Temperature effect / conversion factor', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Drift of standard solution', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', 'mg/L'],
    ranges: [
      range('Total Dissolved Solids', 'ppm', [342, 707, 1000, 1500], tb('ppm', 1.0, 1.0), { altUnits: ['mg/L'], rangeText: '0 – 2000 ppm' }),
    ],
    procedureText:
      'The TDS meter is calibrated using certified TDS / NaCl (or 442-type) standard solutions (CRM) traceable to national standards at the reference temperature. The probe is rinsed with the standard prior to measurement. The UUC reading is recorded after stabilisation and error = UUC reading − certified TDS value (at the meter\'s declared conversion factor). Uncertainty combines the standard certificate uncertainty, UUC resolution, the TDS conversion-factor/temperature contribution and drift.',
    nablReference: 'NABL 126 / ISO/IEC 17025',
    referenceStandard: 'Certified TDS standard solutions (e.g. 342 ppm, 1000 ppm NaCl CRM)',
  },

  // ── Dissolved Oxygen (DO) Meter ───────────────────────────────────
  {
    id: 'an-do-meter',
    label: 'Dissolved Oxygen (DO) Meter',
    discipline: DISC,
    subDiscipline: 'Dissolved Gases',
    unit: 'mg/L',
    points: pts('mg/L', [0, 4, 8, 9.09]),
    typeB: tb('mg/L', 0.05, 0.01, [
      { source: 'Temperature / barometric pressure correction', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mg/L' },
      { source: 'Drift / repeatability of probe', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mg/L' },
    ]),
    units: ['mg/L', '%'],
    ranges: [
      range('Dissolved Oxygen', 'mg/L', [0, 4, 8, 9.09], tb('mg/L', 0.05, 0.01), { altUnits: ['%'], rangeText: '0 – 20 mg/L' }),
      range('Oxygen Saturation', '%', [0, 50, 100], tb('%', 0.5, 0.1), { rangeText: '0 – 100 % saturation' }),
    ],
    procedureText:
      'The DO meter is calibrated using a zero-oxygen reference (freshly prepared sodium-sulfite solution as CRM, 0 mg/L) and a 100 %-saturation (water-saturated air) reference. The barometric pressure, temperature and salinity are recorded and the saturation DO value derived from certified solubility tables. The UUC reading is recorded after stabilisation; error = UUC reading − reference DO value. Uncertainty combines the reference-value uncertainty, UUC resolution, temperature/pressure correction and probe repeatability/drift.',
    nablReference: 'NABL 126 / ISO/IEC 17025',
    referenceStandard: 'Zero-oxygen sodium-sulfite solution (CRM), water-saturated air, barometer & thermometer',
  },

  // ── Ion Selective Meter ───────────────────────────────────────────
  {
    id: 'an-ion-selective-meter',
    label: 'Ion Selective (ISE) Meter',
    discipline: DISC,
    subDiscipline: 'pH & ORP',
    unit: 'mV',
    points: pts('mV', [-300, -150, 0, 150, 300]),
    typeB: tb('mV', 0.2, 0.1, [
      { source: 'Temperature effect on ion standard', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mV' },
      { source: 'Drift / repeatability of ISE electrode', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mV' },
    ]),
    units: ['mV', 'ppm', 'mg/L'],
    ranges: [
      range('Electrode Potential', 'mV', [-300, -150, 0, 150, 300], tb('mV', 0.2, 0.1), { rangeText: '−1000 – +1000 mV' }),
      range('Ion Concentration', 'ppm', [1, 10, 100, 1000], tb('ppm', 0.5, 0.1), { altUnits: ['mg/L'], rangeText: '0.1 – 1000 ppm' }),
    ],
    procedureText:
      'The ion-selective meter is calibrated using certified ion standard solutions (CRM) prepared by serial dilution covering the working range (e.g. for fluoride, nitrate, sodium ISEs). Ionic-strength adjustor (ISAB/TISAB) is added where specified. The electrode slope (mV/decade) is verified against the Nernstian response and each standard is measured after stabilisation; error = UUC reading − certified concentration. Uncertainty combines the standard certificate uncertainty, UUC resolution, temperature dependence and electrode drift/repeatability.',
    nablReference: 'NABL 126 / ISO/IEC 17025',
    referenceStandard: 'Certified ion standard solutions (CRM) + ionic-strength adjustor',
  },

  // ── Turbidity Meter (Nephelometer) ────────────────────────────────
  {
    id: 'an-turbidity-meter',
    label: 'Turbidity Meter (Nephelometer)',
    discipline: DISC,
    subDiscipline: 'Turbidity & Moisture',
    unit: 'NTU',
    points: pts('NTU', [0.1, 10, 100, 800]),
    typeB: tb('NTU', 0.05, 0.01, [
      { source: 'Stray light / cuvette positioning', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'NTU' },
      { source: 'Drift / repeatability of UUC', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'NTU' },
    ]),
    units: ['NTU'],
    ranges: [
      range('Turbidity', 'NTU', [0.1, 10, 100, 800], tb('NTU', 0.05, 0.01), { rangeText: '0 – 1000 NTU' }),
    ],
    procedureText:
      'The nephelometric turbidity meter is calibrated using certified formazin / stabilised formazin (StablCal) turbidity standards (CRM) at nominal 0.1, 10, 100 and 800 NTU. Standard cuvettes are wiped clean, indexed and silicone-oiled to suppress stray light. Each standard is measured after the lamp/detector stabilises; error = UUC reading − certified turbidity value. Uncertainty combines the formazin-standard certificate uncertainty, UUC resolution, stray-light/cuvette positioning and instrument repeatability.',
    nablReference: 'ISO 7027 / NABL 126',
    referenceStandard: 'Certified formazin / StablCal turbidity standards (0.1, 10, 100, 800 NTU CRM)',
  },

  // ── Gas Analyzer (O2 / CO / CO2) ──────────────────────────────────
  {
    id: 'an-gas-analyzer',
    label: 'Gas Analyzer (O2 / CO / CO2)',
    discipline: DISC,
    subDiscipline: 'Gas Analysis',
    unit: 'ppm',
    points: pts('ppm', [0, 50, 100, 500, 1000]),
    typeB: tb('ppm', 1.0, 1.0, [
      { source: 'Reference gas mixture tolerance', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Drift / repeatability of analyzer', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', '%vol'],
    ranges: [
      range('Carbon Monoxide (CO)', 'ppm', [0, 50, 100, 500, 1000], tb('ppm', 1.0, 1.0), { altUnits: ['%vol'], rangeText: '0 – 2000 ppm CO' }),
      range('Oxygen (O2)', '%vol', [0, 10, 20.9], tb('%vol', 0.05, 0.01), { rangeText: '0 – 25 %vol O2' }),
      range('Carbon Dioxide (CO2)', '%vol', [0, 5, 10, 20], tb('%vol', 0.1, 0.01), { altUnits: ['ppm'], rangeText: '0 – 20 %vol CO2' }),
    ],
    procedureText:
      'The gas analyzer is calibrated using certified reference gas mixtures (CRM, traceable to national gas-metrology standards) for zero (N2 / pure synthetic air) and span at known concentrations of O2, CO and CO2. Gas is supplied at the specified flow and the UUC reading recorded after stabilisation; error = UUC reading − certified gas concentration. Uncertainty combines the gas-mixture certificate tolerance, UUC resolution, flow/temperature effects and analyzer drift/repeatability.',
    nablReference: 'NABL 126 / ISO 6141',
    referenceStandard: 'Certified reference gas mixtures (zero & span CRM), mass-flow controller',
  },

  // ── Flue Gas Analyzer ─────────────────────────────────────────────
  {
    id: 'an-flue-gas-analyzer',
    label: 'Flue Gas Analyzer',
    discipline: DISC,
    subDiscipline: 'Gas Analysis',
    unit: 'ppm',
    points: pts('ppm', [0, 100, 500, 1000, 2000]),
    typeB: tb('ppm', 2.0, 1.0, [
      { source: 'Reference gas mixture tolerance', value: 2.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Drift / repeatability of analyzer', value: 2.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', '%vol'],
    ranges: [
      range('Carbon Monoxide (CO)', 'ppm', [0, 100, 500, 1000, 2000], tb('ppm', 2.0, 1.0), { altUnits: ['%vol'], rangeText: '0 – 4000 ppm CO' }),
      range('Nitric Oxide (NO)', 'ppm', [0, 100, 500, 1000], tb('ppm', 2.0, 1.0), { rangeText: '0 – 2000 ppm NO' }),
      range('Sulphur Dioxide (SO2)', 'ppm', [0, 100, 500, 1000], tb('ppm', 2.0, 1.0), { rangeText: '0 – 2000 ppm SO2' }),
      range('Oxygen (O2)', '%vol', [0, 10, 20.9], tb('%vol', 0.05, 0.01), { rangeText: '0 – 21 %vol O2' }),
    ],
    procedureText:
      'The flue gas analyzer is calibrated using certified reference gas mixtures (CRM) for zero and span on each measured species (CO, NO, SO2, O2, CO2). The probe/sample line is purged; zero gas (N2) and span gases are applied in turn and the UUC reading recorded after stabilisation; error = UUC reading − certified concentration. Uncertainty combines the gas-mixture certificate tolerance, UUC resolution, cross-interference/temperature effects and analyzer drift.',
    nablReference: 'NABL 126 / ISO 6141',
    referenceStandard: 'Certified flue-gas reference mixtures (CO/NO/SO2/O2 CRM)',
  },

  // ── Breath Alcohol Analyzer ───────────────────────────────────────
  {
    id: 'an-breath-alcohol-analyzer',
    label: 'Breath Alcohol Analyzer',
    discipline: DISC,
    subDiscipline: 'Gas Analysis',
    unit: 'ppm',
    points: pts('ppm', [0, 100, 250, 500]),
    typeB: tb('ppm', 2.0, 1.0, [
      { source: 'Ethanol reference standard tolerance', value: 2.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Drift / repeatability of analyzer', value: 2.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', '%vol'],
    ranges: [
      range('Breath Alcohol (BrAC)', 'ppm', [0, 100, 250, 500], tb('ppm', 2.0, 1.0), { altUnits: ['%vol'], rangeText: '0 – 1000 ppm (0 – 2.0 mg/L)' }),
    ],
    procedureText:
      'The breath alcohol analyzer is calibrated using a certified ethanol-in-air reference standard, generated either from a certified ethanol wet-bath simulator (certified ethanol solution as CRM at a known target, e.g. 0.10 mg/L) or a certified dry-gas ethanol standard. Zero is set on alcohol-free air. The simulator/gas is delivered to the mouthpiece and the UUC reading recorded after stabilisation; error = UUC reading − certified BrAC value. Uncertainty combines the ethanol-standard certificate tolerance, simulator temperature, UUC resolution and analyzer drift.',
    nablReference: 'OIML R 126 / NABL 126',
    referenceStandard: 'Certified ethanol wet-bath simulator solution / dry-gas ethanol standard (CRM)',
  },

  // ── Moisture Analyzer (Karl Fischer) ──────────────────────────────
  {
    id: 'an-moisture-analyzer-kf',
    label: 'Moisture Analyzer (Karl Fischer)',
    discipline: DISC,
    subDiscipline: 'Turbidity & Moisture',
    unit: 'ppm',
    points: pts('ppm', [100, 1000, 10000]),
    typeB: tb('ppm', 5.0, 1.0, [
      { source: 'Water-content CRM tolerance', value: 5.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Titrant factor drift / repeatability', value: 5.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', '%'],
    ranges: [
      range('Water Content', 'ppm', [100, 1000, 10000], tb('ppm', 5.0, 1.0), { altUnits: ['%'], rangeText: '10 ppm – 5 % water' }),
    ],
    procedureText:
      'The Karl Fischer moisture analyzer is verified using certified water-content reference standards (CRM) — e.g. di-sodium tartrate dihydrate (15.66 % water) or certified liquid water-standards at 100 / 1000 / 10000 ppm. The titrant factor is first standardised against a primary water standard, then the CRM is titrated and error = measured water content − certified value. Uncertainty combines the CRM certificate tolerance, titrant-factor drift, UUC resolution and repeatability of titration.',
    nablReference: 'ISO 760 / NABL 126',
    referenceStandard: 'Certified water-content standards (di-sodium tartrate dihydrate, liquid water CRM)',
  },

  // ── Salinity Meter ────────────────────────────────────────────────
  {
    id: 'an-salinity-meter',
    label: 'Salinity Meter',
    discipline: DISC,
    subDiscipline: 'Conductivity & TDS',
    unit: 'ppm',
    points: pts('ppm', [0, 5000, 35000]),
    typeB: tb('ppm', 5.0, 1.0, [
      { source: 'Temperature effect on salinity standard', value: 5.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Drift / repeatability of probe', value: 5.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', 'mg/L', 'PSU'],
    ranges: [
      range('Salinity', 'ppm', [0, 5000, 35000], tb('ppm', 5.0, 1.0), { altUnits: ['mg/L', 'PSU'], rangeText: '0 – 70000 ppm' }),
    ],
    procedureText:
      'The salinity meter is calibrated using certified seawater / NaCl salinity standards (CRM, e.g. IAPSO standard seawater at 35 PSU) traceable to national standards at the reference temperature. The probe is rinsed with the standard before measurement; the UUC reading is recorded after stabilisation and error = UUC reading − certified salinity. Uncertainty combines the salinity-standard certificate uncertainty, UUC resolution, temperature dependence and probe drift.',
    nablReference: 'NABL 126 / ISO/IEC 17025',
    referenceStandard: 'Certified salinity / standard seawater (IAPSO 35 PSU CRM)',
  },

  // ── Free Chlorine Meter ───────────────────────────────────────────
  {
    id: 'an-free-chlorine-meter',
    label: 'Free Chlorine Meter',
    discipline: DISC,
    subDiscipline: 'Dissolved Gases',
    unit: 'ppm',
    points: pts('ppm', [0, 0.5, 1.0, 2.0, 5.0]),
    typeB: tb('ppm', 0.02, 0.01, [
      { source: 'Chlorine standard / colour-disc tolerance', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Drift / repeatability of UUC', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', 'mg/L'],
    ranges: [
      range('Free Chlorine', 'ppm', [0, 0.5, 1.0, 2.0, 5.0], tb('ppm', 0.02, 0.01), { altUnits: ['mg/L'], rangeText: '0 – 5 ppm Cl2' }),
    ],
    procedureText:
      'The free chlorine meter (DPD colorimetric) is calibrated using certified chlorine reference standards (CRM) — secondary chlorine standard solutions or certified Gelex/colour-reference discs — covering 0 to 5 ppm. A reagent blank sets the zero; each certified standard is measured after the DPD colour develops and error = UUC reading − certified chlorine value. Uncertainty combines the standard certificate tolerance, UUC resolution, reagent/temperature effects and repeatability.',
    nablReference: 'ISO 7393 / NABL 126',
    referenceStandard: 'Certified chlorine standard solutions / Gelex secondary standards (CRM)',
  },

  // ── COD Analyzer ──────────────────────────────────────────────────
  {
    id: 'an-cod-analyzer',
    label: 'COD Analyzer',
    discipline: DISC,
    subDiscipline: 'Dissolved Gases',
    unit: 'ppm',
    points: pts('ppm', [0, 100, 500, 1000]),
    typeB: tb('ppm', 5.0, 1.0, [
      { source: 'KHP / COD standard CRM tolerance', value: 5.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Digestion / photometric repeatability', value: 5.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', 'mg/L'],
    ranges: [
      range('Chemical Oxygen Demand', 'ppm', [0, 100, 500, 1000, 1500], tb('ppm', 5.0, 1.0), { altUnits: ['mg/L'], rangeText: '0 – 1500 ppm COD' }),
    ],
    procedureText:
      'The COD analyzer (colorimetric / digestion) is calibrated using certified potassium hydrogen phthalate (KHP) COD reference standards (CRM) of known theoretical oxygen demand prepared at 100 / 500 / 1000 ppm. A reagent blank sets the zero; standards are digested and measured photometrically after cooling and error = UUC reading − certified COD value. Uncertainty combines the KHP-standard certificate tolerance, UUC resolution, digestion temperature/time and photometric repeatability.',
    nablReference: 'ISO 15705 / NABL 126',
    referenceStandard: 'Certified KHP COD standard solutions (CRM)',
  },

  // ── Spectro-colorimeter (analytical) ──────────────────────────────
  {
    id: 'an-spectro-colorimeter',
    label: 'Spectro-colorimeter (analytical)',
    discipline: DISC,
    subDiscipline: 'Turbidity & Moisture',
    unit: 'NTU',
    points: pts('NTU', [0.1, 10, 100, 800]),
    typeB: tb('NTU', 0.05, 0.01, [
      { source: 'Reference filter / standard tolerance', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'NTU' },
      { source: 'Drift / repeatability of UUC', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'NTU' },
    ]),
    units: ['NTU', 'Abs', 'ppm'],
    ranges: [
      range('Turbidity', 'NTU', [0.1, 10, 100, 800], tb('NTU', 0.05, 0.01), { rangeText: '0 – 1000 NTU' }),
      range('Absorbance', 'Abs', [0.1, 0.5, 1.0, 2.0], tb('Abs', 0.003, 0.001), { rangeText: '0 – 3 Abs' }),
      range('Concentration', 'ppm', [1, 10, 100, 1000], tb('ppm', 0.5, 0.1), { altUnits: ['mg/L'], rangeText: '0 – 1000 ppm' }),
    ],
    procedureText:
      'The analytical spectro-colorimeter is calibrated for photometric accuracy using certified neutral-density / didymium reference filters (CRM) and certified absorbance / colour standard solutions, and for wavelength accuracy using a holmium-oxide / didymium reference. Turbidity channels use certified formazin standards (0.1–800 NTU). A blank sets the baseline; each certified standard is measured and error = UUC reading − certified value. Uncertainty combines the reference-filter/standard certificate uncertainty, UUC resolution, stray light and repeatability.',
    nablReference: 'ISO 7027 / ASTM E275 / NABL 126',
    referenceStandard: 'Certified ND/didymium filters, absorbance standards & formazin standards (CRM)',
  },

  // ── Colony Counter ────────────────────────────────────────────────
  {
    id: 'an-colony-counter',
    label: 'Colony Counter',
    discipline: DISC,
    subDiscipline: 'Turbidity & Moisture',
    unit: 'count',
    points: pts('count', [10, 50, 100, 300]),
    typeB: tb('count', 0.5, 1.0, [
      { source: 'Reference plate / grid traceability', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'count' },
      { source: 'Operator / detection repeatability', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'count' },
    ]),
    units: ['count'],
    ranges: [
      range('Colony Count', 'count', [10, 50, 100, 300, 1000], tb('count', 0.5, 1.0), { rangeText: '1 – 1000 colonies' }),
      range('Magnification', 'x', [1, 1.5, 2], tb('x', 0.01, 0.01), { rangeText: 'lens magnification check' }),
    ],
    procedureText:
      'The colony counter is verified using certified reference count plates / traceable counting grids with a known number of marked spots (acting as the reference standard). The marked plates are counted by the instrument and operator and error = instrument count − certified number of spots. Magnification of the optical lens and the area-grid graticule are checked against a certified scale. Uncertainty combines the reference-plate traceability, area/magnification contribution and detection/operator repeatability.',
    nablReference: 'NABL 126 / ISO 7218',
    referenceStandard: 'Certified reference count plates / traceable counting grid & graticule',
  },
];
