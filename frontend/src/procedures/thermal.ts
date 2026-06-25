// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: THERMAL discipline
// ─────────────────────────────────────────────────────────────────
// Temperature (contact / non-contact / enclosure mapping) & Humidity.
// Methods follow EURAMET cg-13 (dry-block), EURAMET cg-11 (thermocouples),
// EA-4/02 (uncertainty), NABL 122-xx and ISO/IEC 17025. Engineering default
// values (master uncertainty, UUC resolution, uniformity) are editable in UI.

import { Procedure, pts, tb, range, thermalExtra, R3 } from './types';

const ALT = ['°F', 'K']; // °C equivalents for reporting

export const THERMAL: Procedure[] = [
  // ── Temperature — Contact ──────────────────────────────────────
  {
    id: 'th-rtd-pt100',
    label: 'RTD / PT100 Thermometer',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [-40, 0, 50, 100, 200, 300, 400]),
    typeB: tb('°C', 0.05, 0.01, [thermalExtra('°C', 0.03)]),
    ranges: [
      range('Temperature', '°C', [-40, 0, 50, 100, 200, 300, 400],
        tb('°C', 0.05, 0.01, [thermalExtra('°C', 0.03)]),
        { altUnits: ALT, rangeText: '-40 – 400 °C' }),
    ],
    procedureText:
      'Compare the UUC RTD/PT100 against a calibrated standard PRT in a stirred ' +
      'liquid bath / dry-block at each set point after thermal stabilisation. ' +
      'Record UUC and reference simultaneously; take a minimum of 5 readings per ' +
      'point. Evaluate corrections, repeatability, medium uniformity/stability and ' +
      'report expanded uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT + readout bridge in stirred liquid bath / dry block',
  },
  {
    id: 'th-digital-thermometer',
    label: 'Digital Thermometer',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [0, 50, 100, 150, 200, 300]),
    typeB: tb('°C', 0.1, 0.1, [thermalExtra('°C', 0.05)]),
    ranges: [
      range('Temperature', '°C', [0, 50, 100, 150, 200, 300],
        tb('°C', 0.1, 0.1, [thermalExtra('°C', 0.05)]),
        { altUnits: ALT, rangeText: '0 – 300 °C' }),
    ],
    procedureText:
      'Immerse the UUC probe and reference standard to equal depth in a stirred ' +
      'bath / dry-block. After stabilisation record paired readings (≥5) at each ' +
      'point. Determine error, resolution and repeatability contributions and ' +
      'report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT with calibrated indicator + dry block',
  },
  {
    id: 'th-thermocouple-indicator',
    label: 'Thermocouple Indicator (Type K/J/T/R/S)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [0, 200, 400, 600, 800, 1000, 1200]),
    typeB: tb('°C', 0.5, 1, [thermalExtra('°C', 0.3)]),
    ranges: [
      range('Type K/J/T (low range)', '°C', [-40, 0, 200, 400, 600],
        tb('°C', 0.3, 0.1, [thermalExtra('°C', 0.2)]),
        { altUnits: ALT, rangeText: '-40 – 600 °C' }),
      range('Type R/S (high range)', '°C', [200, 600, 1000, 1200],
        tb('°C', 0.8, 1, [thermalExtra('°C', 0.5)]),
        { altUnits: ALT, rangeText: '200 – 1200 °C' }),
    ],
    procedureText:
      'Calibrate by comparison in a horizontal/vertical tube furnace or dry block ' +
      'against a standard thermocouple / PRT, with reference-junction compensation ' +
      'verified. Apply EURAMET cg-11 immersion and inhomogeneity checks; record ' +
      'paired readings at each point and report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-11',
    referenceStandard: 'Standard Type S/R thermocouple + reference furnace / dry block',
  },
  {
    id: 'th-lig-thermometer',
    label: 'Liquid-in-Glass Thermometer',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [0, 25, 50, 75, 100]),
    typeB: tb('°C', 0.05, 0.5, [thermalExtra('°C', 0.05)]),
    ranges: [
      range('Temperature', '°C', [0, 25, 50, 75, 100],
        tb('°C', 0.05, 0.5, [thermalExtra('°C', 0.05)]),
        { altUnits: ALT, rangeText: '0 – 100 °C' }),
    ],
    procedureText:
      'Compare the LiG thermometer against a standard PRT in a stirred liquid bath ' +
      'with correct immersion (total/partial) per the thermometer marking. Read the ' +
      'meniscus with consistent parallax-free technique; estimate resolution as ' +
      'one scale division. Account for emergent-stem correction where applicable and ' +
      'report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT + stirred liquid bath',
  },
  {
    id: 'th-bimetallic-dial',
    label: 'Bimetallic Dial Thermometer',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [50, 100, 150, 200, 250, 300]),
    typeB: tb('°C', 0.2, 2, [thermalExtra('°C', 0.2)]),
    ranges: [
      range('Temperature', '°C', [50, 100, 150, 200, 250, 300],
        tb('°C', 0.2, 2, [thermalExtra('°C', 0.2)]),
        { altUnits: ALT, rangeText: '50 – 300 °C' }),
    ],
    procedureText:
      'Insert the stem to its rated immersion in a stirred bath / dry-block alongside ' +
      'a standard PRT. After stabilisation read the dial (resolution = one scale ' +
      'division), tapping lightly to release hysteresis. Take ascending and ' +
      'descending sequences and report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT + dry block / stirred bath',
  },
  {
    id: 'th-indicator-controller',
    label: 'Temperature Indicator / Controller',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [0, 100, 200, 400, 600, 800]),
    typeB: tb('°C', 0.2, 1, [thermalExtra('°C', 0.2)]),
    ranges: [
      range('Electrical simulation input (RTD/TC)', '°C', [0, 100, 200, 400, 600, 800],
        tb('°C', 0.2, 1, [thermalExtra('°C', 0.2)]),
        { altUnits: ALT, rangeText: '0 – 800 °C' }),
    ],
    procedureText:
      'Calibrate the indicating/controlling function by injecting simulated RTD ' +
      'resistance or thermocouple mV signals from a calibrated multifunction source ' +
      '(with reference-junction compensation matched to sensor type). Record ' +
      'displayed value vs nominal across the span; evaluate error and resolution and ' +
      'report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Calibrated temperature/process simulator (RTD & TC source)',
  },
  {
    id: 'th-temperature-transmitter',
    label: 'Temperature Transmitter',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [0, 100, 200, 300, 400, 500]),
    typeB: tb('°C', 0.15, 0.5, [thermalExtra('°C', 0.1)]),
    ranges: [
      range('Temperature input', '°C', [0, 100, 200, 300, 400, 500],
        tb('°C', 0.15, 0.5, [thermalExtra('°C', 0.1)]),
        { altUnits: ALT, rangeText: '0 – 500 °C' }),
      range('Current output', 'mA', [4, 8, 12, 16, 20],
        tb('mA', 0.01, 0.001),
        { rangeText: '4 – 20 mA' }),
    ],
    procedureText:
      'Apply simulated RTD/TC input from a calibrated source at 0/25/50/75/100% of ' +
      'span and measure the 4–20 mA (or digital) output with a calibrated reference ' +
      'multimeter. Compute the transfer error, linearity and resolution; report ' +
      'expanded uncertainty (k=2) referred to the temperature input.',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Calibrated RTD/TC simulator + reference DMM (loop)',
  },

  // ── Temperature — Non-contact ──────────────────────────────────
  {
    id: 'th-infrared-thermometer',
    label: 'Infrared (Non-contact) Thermometer',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Non-contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [50, 100, 200, 300, 400, 500]),
    typeB: tb('°C', 0.3, 0.1, [thermalExtra('°C', 0.3)]),
    ranges: [
      range('Radiance temperature', '°C', [50, 100, 200, 300, 400, 500],
        tb('°C', 0.3, 0.1, [thermalExtra('°C', 0.3)]),
        { altUnits: ALT, rangeText: '50 – 500 °C' }),
    ],
    procedureText:
      'Aim the UUC at a calibrated cavity / flat-plate blackbody source of known ' +
      'emissivity at the correct distance-to-spot ratio. Set the UUC emissivity to ' +
      'match the blackbody, stabilise and record paired readings. Account for ' +
      'blackbody uncertainty, emissivity, ambient/reflected radiation and distance ' +
      'effects; report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-12',
    referenceStandard: 'Calibrated blackbody radiation source + standard radiation thermometer',
  },
  {
    id: 'th-thermal-imager',
    label: 'Thermal Imager Camera',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Non-contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [40, 80, 120, 200, 300]),
    typeB: tb('°C', 0.5, 0.1, [thermalExtra('°C', 0.4)]),
    ranges: [
      range('Radiance temperature', '°C', [40, 80, 120, 200, 300],
        tb('°C', 0.5, 0.1, [thermalExtra('°C', 0.4)]),
        { altUnits: ALT, rangeText: '40 – 300 °C' }),
    ],
    procedureText:
      'Image an extended-area calibrated blackbody filling the field of view at each ' +
      'set point. Set emissivity and distance per blackbody data, then read the ' +
      'central pixel/average ROI temperature. Evaluate blackbody, emissivity, ' +
      'uniformity of detector array and ambient effects; report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-12',
    referenceStandard: 'Extended-area calibrated blackbody source',
  },

  // ── Temperature — Contact (logger) ─────────────────────────────
  {
    id: 'th-data-logger',
    label: 'Temperature Data Logger',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [-20, 0, 25, 50, 85, 120]),
    typeB: tb('°C', 0.1, 0.1, [thermalExtra('°C', 0.05)]),
    ranges: [
      range('Temperature', '°C', [-20, 0, 25, 50, 85, 120],
        tb('°C', 0.1, 0.1, [thermalExtra('°C', 0.05)]),
        { altUnits: ALT, rangeText: '-20 – 120 °C' }),
    ],
    procedureText:
      'Place the logger sensor(s) with a standard PRT in a stirred bath / climatic ' +
      'chamber at each set point. After stabilisation log simultaneously for a fixed ' +
      'interval and compare mean logged value with the reference. Evaluate error, ' +
      'resolution and medium stability; report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT + stirred bath / climatic chamber',
  },
  {
    id: 'th-thermohygrometer',
    label: 'Thermohygrometer',
    discipline: 'Thermal',
    subDiscipline: 'Humidity',
    unit: '%RH',
    units: ['%RH', '°C'],
    points: pts('%RH', [20, 40, 60, 80, 90]),
    typeB: tb('%RH', 0.8, 0.1, [thermalExtra('%RH', 0.5)]),
    ranges: [
      range('Relative humidity', '%RH', [20, 40, 60, 80, 90],
        tb('%RH', 0.8, 0.1, [thermalExtra('%RH', 0.5)]),
        { rangeText: '20 – 90 %RH' }),
      range('Temperature', '°C', [10, 20, 30, 40, 50],
        tb('°C', 0.1, 0.1, [thermalExtra('°C', 0.1)]),
        { altUnits: ALT, rangeText: '10 – 50 °C' }),
    ],
    procedureText:
      'Compare the UUC against a calibrated reference hygrometer / chilled-mirror ' +
      'dew-point standard inside a stable humidity generator/chamber. Stabilise at ' +
      'each %RH and temperature set point (≥30 min), record paired readings. ' +
      'Evaluate chamber spatial uniformity and stability and report expanded ' +
      'uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-05 / EA-4/02',
    referenceStandard: 'Reference chilled-mirror hygrometer + humidity generator',
  },

  // ── Source calibrators (contact) ───────────────────────────────
  {
    id: 'th-dry-block-calibrator',
    label: 'Dry Block Temperature Calibrator',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [50, 100, 200, 300, 400, 500, 650]),
    typeB: tb('°C', 0.1, 0.01, [
      thermalExtra('°C', 0.05),
      { source: 'Axial / radial temperature uniformity of block', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Load / well-to-well effect', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Set-point temperature', '°C', [50, 100, 200, 300, 400, 500, 650],
        tb('°C', 0.1, 0.01, [
          thermalExtra('°C', 0.05),
          { source: 'Axial / radial temperature uniformity of block', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '50 – 650 °C' }),
    ],
    procedureText:
      'Per EURAMET cg-13: characterise the dry-block at each set point using a ' +
      'calibrated standard PRT inserted in the reference well. Determine axial ' +
      '(vertical) and radial (well-to-well) temperature homogeneity, temporal ' +
      'stability, loading effect and the reference-indication error. Combine all ' +
      'contributions and report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT + readout bridge',
  },
  {
    id: 'th-temperature-bath',
    label: 'Temperature Bath (oil / water)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Contact',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [-20, 0, 25, 50, 100, 150, 200]),
    typeB: tb('°C', 0.05, 0.01, [
      thermalExtra('°C', 0.03),
      { source: 'Spatial uniformity of bath volume', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Set-point temperature', '°C', [-20, 0, 25, 50, 100, 150, 200],
        tb('°C', 0.05, 0.01, [
          thermalExtra('°C', 0.03),
          { source: 'Spatial uniformity of bath volume', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '-20 – 200 °C' }),
    ],
    procedureText:
      'Characterise the stirred liquid bath at each set point with a calibrated ' +
      'standard PRT. Map spatial uniformity across the working volume and temporal ' +
      'stability over the measurement window. Combine reference error, uniformity ' +
      'and stability contributions and report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-13',
    referenceStandard: 'Standard PRT + readout bridge in stirred liquid bath',
  },

  // ── Temperature — Enclosure / Mapping ──────────────────────────
  {
    id: 'th-hot-air-oven',
    label: 'Hot Air Oven (Mapping)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [50, 100, 150, 200, 250]),
    typeB: tb('°C', 0.2, 0.5, [
      thermalExtra('°C', 0.2),
      { source: 'Spatial temperature uniformity (9/15-point map)', value: 1.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over soak period', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Mapped temperature', '°C', [50, 100, 150, 200, 250],
        tb('°C', 0.2, 0.5, [
          thermalExtra('°C', 0.2),
          { source: 'Spatial temperature uniformity (9/15-point map)', value: 1.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
          { source: 'Temporal stability over soak period', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '50 – 250 °C' }),
    ],
    procedureText:
      'Per NABL guidelines, distribute 9 (≤2 m³) or 15 calibrated sensors at corners, ' +
      'edges and centre of the working space. At each set point soak until stable, ' +
      'then log all channels simultaneously for ≥30 min. Compute spatial gradient ' +
      '(uniformity), temporal stability, overshoot and set-point error; report ' +
      'expanded uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Multi-channel scanner + calibrated PRT/TC sensor array',
  },
  {
    id: 'th-muffle-furnace',
    label: 'Muffle Furnace (Mapping)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [300, 500, 700, 900, 1100]),
    typeB: tb('°C', 0.8, 1, [
      thermalExtra('°C', 0.5),
      { source: 'Spatial temperature uniformity of chamber', value: 5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over soak period', value: 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Mapped temperature', '°C', [300, 500, 700, 900, 1100],
        tb('°C', 0.8, 1, [
          thermalExtra('°C', 0.5),
          { source: 'Spatial temperature uniformity of chamber', value: 5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
          { source: 'Temporal stability over soak period', value: 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '300 – 1100 °C' }),
    ],
    procedureText:
      'Position calibrated Type R/S/K thermocouples at the geometric layout points of ' +
      'the chamber. At each set point soak to equilibrium and log all channels ' +
      'simultaneously. Evaluate spatial uniformity, temporal stability and set-point ' +
      'error, with thermocouple immersion/inhomogeneity per EURAMET cg-11; report ' +
      'expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EURAMET cg-11',
    referenceStandard: 'Standard Type R/S thermocouples + multi-channel scanner',
  },
  {
    id: 'th-incubator',
    label: 'Incubator (Mapping)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [25, 30, 37, 42, 45]),
    typeB: tb('°C', 0.1, 0.1, [
      thermalExtra('°C', 0.1),
      { source: 'Spatial temperature uniformity of chamber', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over soak period', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Mapped temperature', '°C', [25, 30, 37, 42, 45],
        tb('°C', 0.1, 0.1, [
          thermalExtra('°C', 0.1),
          { source: 'Spatial temperature uniformity of chamber', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
          { source: 'Temporal stability over soak period', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '25 – 45 °C' }),
    ],
    procedureText:
      'Distribute 9 calibrated sensors across the usable volume (corners + centre). ' +
      'Soak at each set point until stable and log simultaneously for ≥30 min with ' +
      'door closed. Determine spatial uniformity, temporal stability and centre-point ' +
      'set error; report expanded uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Multi-channel scanner + calibrated PRT sensor array',
  },
  {
    id: 'th-bod-incubator',
    label: 'BOD Incubator',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [5, 10, 20, 27, 37]),
    typeB: tb('°C', 0.1, 0.1, [
      thermalExtra('°C', 0.1),
      { source: 'Spatial temperature uniformity of chamber', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over soak period', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Mapped temperature', '°C', [5, 10, 20, 27, 37],
        tb('°C', 0.1, 0.1, [
          thermalExtra('°C', 0.1),
          { source: 'Spatial temperature uniformity of chamber', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
          { source: 'Temporal stability over soak period', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '5 – 37 °C' }),
    ],
    procedureText:
      'Map the refrigerated BOD incubator with 9 calibrated sensors. At each set ' +
      'point (including the typical 20/27 °C BOD points) soak to stability and log ' +
      'all channels simultaneously. Evaluate spatial uniformity, temporal stability ' +
      'and set-point error; report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Multi-channel scanner + calibrated PRT sensor array',
  },
  {
    id: 'th-autoclave',
    label: 'Autoclave (Temperature + Pressure)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [105, 115, 121, 134]),
    typeB: tb('°C', 0.1, 0.1, [
      thermalExtra('°C', 0.1),
      { source: 'Spatial temperature uniformity in load', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over sterilisation hold', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Sterilisation temperature', '°C', [105, 115, 121, 134],
        tb('°C', 0.1, 0.1, [
          thermalExtra('°C', 0.1),
          { source: 'Spatial temperature uniformity in load', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '105 – 134 °C' }),
      range('Chamber pressure', 'bar', [1.2, 1.7, 2.1, 3.0],
        tb('bar', 0.005, 0.01),
        { rangeText: '1.2 – 3.0 bar(g)' }),
    ],
    procedureText:
      'Distribute calibrated, pressure-rated sensors (and a reference pressure gauge) ' +
      'within the loaded chamber. Run sterilisation cycles at each set point and log ' +
      'temperature/pressure through the hold phase. Note: saturated-steam temperature ' +
      'is correlated with chamber pressure — verify both against their references. ' +
      'Evaluate uniformity, stability and set error; report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Pressure-rated PRT loggers + reference pressure gauge',
  },
  {
    id: 'th-deep-freezer',
    label: 'Deep Freezer / Refrigerator (Mapping)',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [-80, -40, -20, 2, 8]),
    typeB: tb('°C', 0.15, 0.1, [
      thermalExtra('°C', 0.1),
      { source: 'Spatial temperature uniformity of chamber', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over soak period', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Mapped temperature', '°C', [-80, -40, -20, 2, 8],
        tb('°C', 0.15, 0.1, [
          thermalExtra('°C', 0.1),
          { source: 'Spatial temperature uniformity of chamber', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
          { source: 'Temporal stability over soak period', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '-80 – 8 °C' }),
    ],
    procedureText:
      'Map the cold chamber with 9 calibrated low-temperature sensors at corners and ' +
      'centre. Soak at each set point with door closed and log simultaneously for ' +
      '≥30 min (longer for ultra-low freezers). Evaluate spatial uniformity, temporal ' +
      'stability and door-opening recovery; report expanded uncertainty (k=2).',
    nablReference: 'NABL 122-04 / EA-4/02',
    referenceStandard: 'Low-temperature PRT loggers + multi-channel scanner',
  },
  {
    id: 'th-environmental-chamber',
    label: 'Stability / Environmental Chamber',
    discipline: 'Thermal',
    subDiscipline: 'Temperature — Enclosure/Mapping',
    unit: '°C',
    units: ['°C', '°F', 'K', '%RH'],
    points: pts('°C', [-20, 0, 25, 40, 60, 85]),
    typeB: tb('°C', 0.1, 0.1, [
      thermalExtra('°C', 0.1),
      { source: 'Spatial temperature uniformity of chamber', value: 0.8, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
      { source: 'Temporal stability over soak period', value: 0.4, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
    ]),
    ranges: [
      range('Mapped temperature', '°C', [-20, 0, 25, 40, 60, 85],
        tb('°C', 0.1, 0.1, [
          thermalExtra('°C', 0.1),
          { source: 'Spatial temperature uniformity of chamber', value: 0.8, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' },
        ]),
        { altUnits: ALT, rangeText: '-20 – 85 °C' }),
      range('Mapped relative humidity', '%RH', [25, 40, 60, 75, 90],
        tb('%RH', 1.0, 0.1, [thermalExtra('%RH', 1.5)]),
        { rangeText: '25 – 90 %RH' }),
    ],
    procedureText:
      'Per IEC 60068-3-5 / NABL: distribute 9 (or 15) calibrated T&RH sensors through ' +
      'the working volume. At each combined T/RH set point soak to equilibrium and ' +
      'log simultaneously for ≥30 min. Determine spatial uniformity and temporal ' +
      'stability of both temperature and humidity, plus set-point error; report ' +
      'expanded uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-04 / IEC 60068-3-5',
    referenceStandard: 'Calibrated T&RH sensor array + multi-channel logger',
  },

  // ── Humidity ───────────────────────────────────────────────────
  {
    id: 'th-hygrometer',
    label: 'Hygrometer / Humidity Indicator',
    discipline: 'Thermal',
    subDiscipline: 'Humidity',
    unit: '%RH',
    units: ['%RH'],
    points: pts('%RH', [10, 30, 50, 70, 90, 95]),
    typeB: tb('%RH', 0.6, 0.1, [thermalExtra('%RH', 0.5)]),
    ranges: [
      range('Relative humidity', '%RH', [10, 30, 50, 70, 90, 95],
        tb('%RH', 0.6, 0.1, [thermalExtra('%RH', 0.5)]),
        { rangeText: '10 – 95 %RH' }),
    ],
    procedureText:
      'Compare the UUC against a calibrated reference hygrometer / chilled-mirror ' +
      'dew-point standard inside a stable two-pressure or two-temperature humidity ' +
      'generator. Stabilise ≥30 min at each %RH point at controlled temperature and ' +
      'record paired readings. Evaluate generator uniformity/stability and report ' +
      'expanded uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-05 / EA-4/02',
    referenceStandard: 'Reference chilled-mirror hygrometer + humidity generator',
  },
  {
    id: 'th-humidity-chamber',
    label: 'Humidity Chamber (Mapping)',
    discipline: 'Thermal',
    subDiscipline: 'Humidity',
    unit: '%RH',
    units: ['%RH', '°C'],
    points: pts('%RH', [20, 40, 60, 80, 95]),
    typeB: tb('%RH', 1.0, 0.1, [
      thermalExtra('%RH', 1.0),
      { source: 'Spatial humidity uniformity of chamber', value: 2.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%RH' },
      { source: 'Temporal stability over soak period', value: 1.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%RH' },
    ]),
    ranges: [
      range('Mapped relative humidity', '%RH', [20, 40, 60, 80, 95],
        tb('%RH', 1.0, 0.1, [
          thermalExtra('%RH', 1.0),
          { source: 'Spatial humidity uniformity of chamber', value: 2.0, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%RH' },
        ]),
        { rangeText: '20 – 95 %RH' }),
      range('Mapped temperature', '°C', [10, 25, 40, 60],
        tb('°C', 0.1, 0.1, [thermalExtra('°C', 0.1)]),
        { altUnits: ALT, rangeText: '10 – 60 °C' }),
    ],
    procedureText:
      'Distribute 9 calibrated T&RH sensors through the working volume. At each ' +
      'combined humidity/temperature set point soak to equilibrium and log all ' +
      'channels for ≥30 min. Determine spatial uniformity and temporal stability of ' +
      'humidity and temperature, plus set-point error; report expanded uncertainty ' +
      '(k=2) per EA-4/02.',
    nablReference: 'NABL 122-05 / EA-4/02',
    referenceStandard: 'Calibrated T&RH sensor array + reference chilled-mirror hygrometer',
  },
  {
    id: 'th-dew-point-meter',
    label: 'Dew Point Meter',
    discipline: 'Thermal',
    subDiscipline: 'Humidity',
    unit: '°C',
    units: ['°C', '°F', 'K'],
    points: pts('°C', [-60, -40, -20, 0, 10, 20]),
    typeB: tb('°C', 0.3, 0.1, [thermalExtra('°C', 0.2)]),
    ranges: [
      range('Dew-point temperature', '°C', [-60, -40, -20, 0, 10, 20],
        tb('°C', 0.3, 0.1, [thermalExtra('°C', 0.2)]),
        { altUnits: ALT, rangeText: '-60 – 20 °C (dew point)' }),
    ],
    procedureText:
      'Compare the UUC against a reference chilled-mirror hygrometer using a humidity ' +
      'generator producing known dew-point values. Stabilise at each set point and ' +
      'record paired dew-point readings. Account for reference uncertainty, flow and ' +
      'pressure effects and resolution; report expanded uncertainty (k=2) per EA-4/02.',
    nablReference: 'NABL 122-05 / EA-4/02',
    referenceStandard: 'Reference chilled-mirror dew-point hygrometer + humidity generator',
  },
];
