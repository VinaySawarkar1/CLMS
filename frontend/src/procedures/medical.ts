// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: MEDICAL / BIO-MEDICAL
// ─────────────────────────────────────────────────────────────────
// Methods follow NABL-126 (Specific Criteria — Medical Devices /
// Bio-Medical), IEC 60601 series (medical electrical equipment safety
// and performance) and OEM service manuals. Calibration is performed
// with patient simulators and biomedical analysers (NIBP simulators,
// SpO2 simulators, defibrillator/pacer analysers, infusion-pump
// analysers, ESU analysers, ventilator/gas-flow analysers) traceable
// to national standards. Type-B contributors per range are the
// analyser/simulator certificate uncertainty plus UUC resolution,
// with drift / repeatability added where significant. Uncertainty is
// evaluated per EA-4/02.

import { Procedure, pts, tb, range, R3 } from './types';

const DISC = 'Medical / Bio-Medical' as const;

export const MEDICAL: Procedure[] = [
  // ── NIBP / Blood Pressure Monitor (Sphygmomanometer) ─────────────
  {
    id: 'md-nibp',
    label: 'NIBP / Blood Pressure Monitor (Sphygmomanometer)',
    discipline: DISC,
    subDiscipline: 'Blood Pressure & Vital Signs',
    unit: 'mmHg',
    points: pts('mmHg', [0, 50, 150, 250]),
    typeB: tb('mmHg', 0.3, 1, [{ source: 'Leak / stability of pneumatic system', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mmHg' }]),
    units: ['mmHg', 'kPa'],
    ranges: [
      range('Static Pressure (cuff)', 'mmHg', [0, 50, 100, 150, 200, 250], tb('mmHg', 0.3, 1), { altUnits: ['kPa'], rangeText: '0 – 300 mmHg' }),
    ],
    procedureText:
      'The NIBP monitor / aneroid or digital sphygmomanometer is calibrated for static pressure against a traceable digital pressure meter (NIBP simulator in static / manometer mode) connected through a tee to the cuff port. Pressure is applied in ascending and descending steps over 0–300 mmHg; the UUC indication is recorded after stabilisation and error = UUC − reference. A leak test (≤ a few mmHg/min) and the dynamic BP simulation (systolic/diastolic/MAP playback) are verified using the NIBP simulator. Uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 80601-2-30 / IEC 60601-1',
    referenceStandard: 'NIBP simulator / digital pressure calibrator (e.g. Fluke ProSim / BP pump)',
  },

  // ── Patient Monitor (multi-parameter) ────────────────────────────
  {
    id: 'md-patient-monitor',
    label: 'Patient Monitor (multi-parameter)',
    discipline: DISC,
    subDiscipline: 'Patient Monitoring',
    unit: 'mmHg',
    points: pts('mmHg', [0, 50, 150, 250]),
    typeB: tb('mmHg', 0.3, 1),
    units: ['mmHg', 'bpm', '%SpO2', '°C', 'bpm'],
    ranges: [
      range('NIBP', 'mmHg', [0, 50, 150, 250], tb('mmHg', 0.3, 1), { rangeText: '0 – 300 mmHg' }),
      range('Heart Rate (HR / ECG)', 'bpm', [30, 60, 120, 180, 240], tb('bpm', 0.5, 1), { rangeText: '30 – 300 bpm' }),
      range('SpO2', '%SpO2', [70, 80, 90, 100], tb('%SpO2', 0.5, 1), { rangeText: '70 – 100 %SpO2' }),
      range('Temperature', '°C', [25, 30, 37, 41], tb('°C', 0.05, 0.1), { rangeText: '25 – 45 °C' }),
      range('Respiration Rate', 'bpm', [10, 20, 40, 80], tb('bpm', 0.5, 1), { rangeText: '0 – 120 breaths/min' }),
    ],
    procedureText:
      'The multi-parameter patient monitor is calibrated parameter-by-parameter using a multi-parameter patient simulator. NIBP is verified in static and dynamic modes; ECG/HR is verified by injecting normal-sinus and selectable rates; SpO2 is verified with an optical/electronic SpO2 simulator at defined saturation values; temperature channels are checked against a precision resistance/decade simulator referenced to a calibrated thermometer; respiration rate is verified by impedance simulation. Each parameter error = UUC display − simulated value; combined uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 60601-2-49 / IEC 80601-2-30 / ISO 80601-2-61',
    referenceStandard: 'Multi-parameter patient simulator (e.g. Fluke ProSim 8)',
  },

  // ── ECG Machine / ECG Simulator-Analyzer ─────────────────────────
  {
    id: 'md-ecg',
    label: 'ECG Machine / ECG Simulator-Analyzer',
    discipline: DISC,
    subDiscipline: 'Patient Monitoring',
    unit: 'bpm',
    points: pts('bpm', [30, 60, 120, 180, 240]),
    typeB: tb('bpm', 0.5, 1),
    units: ['bpm', 'mV', 'mm/s'],
    ranges: [
      range('Heart Rate', 'bpm', [30, 60, 120, 180, 240, 300], tb('bpm', 0.5, 1), { rangeText: '30 – 300 bpm' }),
      range('ECG Amplitude', 'mV', [0.5, 1.0, 2.0, 4.0, 5.0], tb('mV', 0.01, 0.01), { rangeText: '0.5 – 5 mV' }),
      range('Sweep / Paper Speed', 'mm/s', [12.5, 25, 50], tb('mm/s', 0.1, 0.5), { rangeText: '12.5 – 50 mm/s' }),
    ],
    procedureText:
      'The ECG machine is calibrated using an ECG / patient simulator that outputs calibrated rate, amplitude (1 mV standard square-wave and known waveforms) and waveform types across all leads. Heart-rate accuracy is verified at fixed simulated rates; amplitude/gain is verified using the 1 mV calibration pulse and known mV outputs; sweep speed and time-base are verified against the simulator timing. Error = UUC reading − simulated value; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 60601-2-25 / IEC 60601-2-27',
    referenceStandard: 'ECG / patient simulator (e.g. Fluke ProSim, BIO-TEK)',
  },

  // ── Defibrillator Analyzer ───────────────────────────────────────
  {
    id: 'md-defibrillator',
    label: 'Defibrillator / Defibrillator Analyzer',
    discipline: DISC,
    subDiscipline: 'Defibrillator & Energy',
    unit: 'J',
    points: pts('J', [50, 100, 200, 360]),
    typeB: tb('J', 0.5, 1, [{ source: 'Energy measurement repeatability', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'J' }]),
    units: ['J'],
    ranges: [
      range('Delivered Energy', 'J', [2, 50, 100, 200, 360], tb('J', 0.5, 1), { rangeText: '1 – 360 J (50 Ω load)' }),
    ],
    procedureText:
      'The defibrillator is calibrated/verified for delivered energy using a defibrillator analyser presenting the standard 50 Ω patient-equivalent load. The defibrillator is charged to selected energy settings and discharged into the analyser; delivered energy, charge time and (for AEDs) synchronisation/cardioversion delay are recorded. Error = analyser-measured energy − selected setting, evaluated against the IEC 60601-2-4 tolerance (typ. ±15 % or ±3 J). Pacer pulse output is verified where applicable. Uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 60601-2-4',
    referenceStandard: 'Defibrillator / pacer analyser (e.g. Fluke Impulse 7000DP) with 50 Ω load',
  },

  // ── Pacemaker Analyzer ───────────────────────────────────────────
  {
    id: 'md-pacemaker',
    label: 'Pacemaker / External Pacer Analyzer',
    discipline: DISC,
    subDiscipline: 'Defibrillator & Energy',
    unit: 'bpm',
    points: pts('bpm', [30, 60, 90, 120]),
    typeB: tb('bpm', 0.5, 1),
    units: ['bpm', 'mA', 'mV'],
    ranges: [
      range('Pace Rate', 'bpm', [30, 60, 90, 120, 180], tb('bpm', 0.5, 1), { rangeText: '30 – 180 ppm' }),
      range('Pace Current', 'mA', [10, 50, 100, 150, 200], tb('mA', 0.5, 1), { rangeText: '0 – 200 mA' }),
      range('Pulse Amplitude', 'mV', [0.5, 1, 2, 5], tb('mV', 0.02, 0.01), { rangeText: '0.5 – 5 mV' }),
    ],
    procedureText:
      'The external (transcutaneous) pacemaker is verified using a pacer/defibrillator analyser presenting the patient-equivalent load. Pace rate (ppm), output current/energy per pulse, pulse width and amplitude are measured; demand/sensitivity is verified by injecting simulated ECG and confirming inhibition. Error = analyser measurement − set value; uncertainty per EA-4/02 to IEC 60601-2-4 limits.',
    nablReference: 'NABL 126 / IEC 60601-2-4 / IEC 60601-2-31',
    referenceStandard: 'Pacer / defibrillator analyser (e.g. Fluke Impulse 7000DP)',
  },

  // ── Infusion Pump Analyzer ───────────────────────────────────────
  {
    id: 'md-infusion-pump',
    label: 'Infusion Pump / Infusion Pump Analyzer',
    discipline: DISC,
    subDiscipline: 'Infusion & Flow',
    unit: 'mL/h',
    points: pts('mL/h', [1, 25, 100, 200]),
    typeB: tb('mL/h', 0.5, 0.1, [{ source: 'Flow measurement repeatability', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mL/h' }]),
    units: ['mL/h', 'mmHg', 'mL'],
    ranges: [
      range('Flow Rate', 'mL/h', [1, 25, 100, 200, 999], tb('mL/h', 0.5, 0.1), { rangeText: '0.1 – 1000 mL/h' }),
      range('Occlusion Pressure', 'mmHg', [100, 300, 500, 750], tb('mmHg', 1, 1), { rangeText: '0 – 1000 mmHg' }),
      range('Delivered Volume (bolus)', 'mL', [1, 5, 10, 25], tb('mL', 0.05, 0.01), { rangeText: '0 – 50 mL' }),
    ],
    procedureText:
      'The infusion pump is calibrated for flow-rate accuracy, delivered volume and occlusion-alarm pressure using an infusion-pump analyser. The pump is run at set rates and the analyser measures average flow over a defined interval (per IEC 60601-2-24, typically the second-hour trumpet-curve method); occlusion pressure is measured by occluding the line until alarm. Error = analyser-measured flow/volume/pressure − set value; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 60601-2-24',
    referenceStandard: 'Infusion pump analyser (e.g. Fluke IDA-5)',
  },

  // ── Syringe Pump ─────────────────────────────────────────────────
  {
    id: 'md-syringe-pump',
    label: 'Syringe Pump',
    discipline: DISC,
    subDiscipline: 'Infusion & Flow',
    unit: 'mL/h',
    points: pts('mL/h', [1, 25, 100, 200]),
    typeB: tb('mL/h', 0.3, 0.1, [{ source: 'Flow measurement repeatability', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mL/h' }]),
    units: ['mL/h', 'mmHg'],
    ranges: [
      range('Flow Rate', 'mL/h', [0.1, 1, 25, 100, 200], tb('mL/h', 0.3, 0.1), { rangeText: '0.1 – 200 mL/h' }),
      range('Occlusion Pressure', 'mmHg', [100, 300, 500, 750], tb('mmHg', 1, 1), { rangeText: '0 – 1000 mmHg' }),
    ],
    procedureText:
      'The syringe (driver) pump is calibrated for low-flow accuracy and occlusion pressure using an infusion-pump analyser with the appropriate syringe loaded. Set flow rates are run and the analyser measures delivered flow over the prescribed interval; start-up/trumpet-curve behaviour and occlusion-alarm pressure are recorded. Error = measured − set value; uncertainty per EA-4/02 to IEC 60601-2-24.',
    nablReference: 'NABL 126 / IEC 60601-2-24',
    referenceStandard: 'Infusion pump analyser (e.g. Fluke IDA-5)',
  },

  // ── Pulse Oximeter / SpO2 Simulator ──────────────────────────────
  {
    id: 'md-pulse-oximeter',
    label: 'Pulse Oximeter / SpO2 Simulator',
    discipline: DISC,
    subDiscipline: 'Patient Monitoring',
    unit: '%SpO2',
    points: pts('%SpO2', [70, 80, 90, 100]),
    typeB: tb('%SpO2', 0.5, 1, [{ source: 'SpO2 simulator R-curve uncertainty', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%SpO2' }]),
    units: ['%SpO2', 'bpm'],
    ranges: [
      range('Oxygen Saturation', '%SpO2', [70, 80, 90, 100], tb('%SpO2', 0.5, 1), { rangeText: '70 – 100 %SpO2' }),
      range('Pulse Rate', 'bpm', [30, 60, 120, 180, 240], tb('bpm', 0.5, 1), { rangeText: '30 – 300 bpm' }),
    ],
    procedureText:
      'The pulse oximeter is verified using an optical/electronic SpO2 simulator that emulates known saturation and pulse-rate values for the matched probe/manufacturer R-curve. Displayed SpO2 and pulse rate are recorded at each simulated value and compared with the simulator setting; error = UUC display − simulated value, assessed against ISO 80601-2-61 (typ. ±2–3 %). Functional/perfusion and low-perfusion responses are checked. Uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / ISO 80601-2-61',
    referenceStandard: 'SpO2 functional simulator (e.g. Fluke Index 2 / ProSim SPOT)',
  },

  // ── Electrosurgical Unit (ESU) Analyzer ──────────────────────────
  {
    id: 'md-esu',
    label: 'Electrosurgical Unit (ESU) Analyzer',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'W',
    points: pts('W', [50, 100, 200, 300]),
    typeB: tb('W', 1, 1, [{ source: 'RF power measurement repeatability', value: 1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'W' }]),
    units: ['W', 'Ω'],
    ranges: [
      range('Output Power', 'W', [10, 50, 100, 200, 300, 400], tb('W', 1, 1), { rangeText: '0 – 400 W (into rated load)' }),
      range('Load Resistance', 'Ω', [100, 300, 500, 1000, 2000], tb('Ω', 1, 1), { rangeText: '0 – 5000 Ω' }),
    ],
    procedureText:
      'The electrosurgical (diathermy) generator is calibrated for RF output power using an ESU analyser providing selectable non-inductive test loads. Cut and coagulation modes are set to defined power levels and the analyser measures delivered power versus the manufacturer power-vs-load curve; HF leakage and Contact-Quality-Monitor (CQM/REM) alarm are verified. Error = measured power − set/rated power at the specified load; uncertainty per EA-4/02 to IEC 60601-2-2.',
    nablReference: 'NABL 126 / IEC 60601-2-2',
    referenceStandard: 'Electrosurgical analyser (e.g. Fluke QA-ES III) with non-inductive loads',
  },

  // ── Ventilator Tester ────────────────────────────────────────────
  {
    id: 'md-ventilator',
    label: 'Ventilator / Ventilator Tester',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'mL',
    points: pts('mL', [50, 200, 500, 1000]),
    typeB: tb('mL', 1, 1),
    units: ['mL', 'bpm', 'cmH2O', '%'],
    ranges: [
      range('Tidal Volume', 'mL', [50, 200, 500, 1000, 1500], tb('mL', 1, 1), { rangeText: '20 – 2000 mL' }),
      range('Respiratory Rate', 'bpm', [10, 20, 40, 60], tb('bpm', 0.5, 1), { rangeText: '0 – 150 breaths/min' }),
      range('Airway Pressure', 'cmH2O', [5, 20, 40, 80], tb('cmH2O', 0.3, 0.1), { rangeText: '0 – 120 cmH2O' }),
      range('Oxygen Concentration (FiO2)', '%', [21, 40, 60, 100], tb('%', 1, 1), { rangeText: '21 – 100 % O2' }),
    ],
    procedureText:
      'The ventilator is calibrated using a gas-flow / ventilator analyser placed in the breathing circuit. Tidal/minute volume, respiratory rate, peak/PEEP airway pressure, I:E ratio and FiO2 (with the O2 cell) are measured against the set values across the operating range. Error = analyser measurement − set value, assessed to ISO 80601-2-12; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / ISO 80601-2-12 / ISO 80601-2-13',
    referenceStandard: 'Gas-flow / ventilator analyser (e.g. Fluke VT650 / VT900)',
  },

  // ── Anesthesia Machine ───────────────────────────────────────────
  {
    id: 'md-anesthesia',
    label: 'Anesthesia Machine / Workstation',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'mL',
    points: pts('mL', [50, 200, 500, 1000]),
    typeB: tb('mL', 1, 1),
    units: ['mL', 'cmH2O', '%', 'L/min'],
    ranges: [
      range('Tidal Volume', 'mL', [50, 200, 500, 1000], tb('mL', 1, 1), { rangeText: '20 – 1500 mL' }),
      range('Airway Pressure', 'cmH2O', [5, 20, 40, 80], tb('cmH2O', 0.3, 0.1), { rangeText: '0 – 120 cmH2O' }),
      range('Fresh-Gas Flow', 'L/min', [0.5, 1, 5, 10, 15], tb('L/min', 0.05, 0.1), { rangeText: '0 – 15 L/min' }),
      range('Agent / O2 Concentration', '%', [21, 40, 60, 100], tb('%', 1, 1), { rangeText: '0 – 100 %' }),
    ],
    procedureText:
      'The anaesthesia workstation/ventilator is calibrated using a gas-flow analyser and (where applicable) an agent gas analyser. Delivered tidal volume, airway pressures, fresh-gas flowmeter accuracy, O2/agent concentration and ventilator parameters are verified against set values; the hypoxic-guard and leak/compliance checks are confirmed. Error = measured − set value to ISO 80601-2-13; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / ISO 80601-2-13',
    referenceStandard: 'Gas-flow / anaesthesia analyser (e.g. Fluke VT900 + gas module)',
  },

  // ── Baby Incubator ───────────────────────────────────────────────
  {
    id: 'md-baby-incubator',
    label: 'Baby Incubator / Infant Warmer',
    discipline: DISC,
    subDiscipline: 'Blood Pressure & Vital Signs',
    unit: '°C',
    points: pts('°C', [32, 34, 36, 37]),
    typeB: tb('°C', 0.05, 0.1, [{ source: 'Air temperature uniformity / stability', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°C' }]),
    units: ['°C', '%', 'dB'],
    ranges: [
      range('Air / Skin Temperature', '°C', [30, 32, 34, 36, 37, 39], tb('°C', 0.05, 0.1), { rangeText: '20 – 40 °C' }),
      range('Relative Humidity', '%', [30, 50, 70, 90], tb('%', 1.5, 1), { rangeText: '0 – 95 % RH' }),
      range('Sound Level (inside)', 'dB', [40, 50, 60], tb('dB', 0.5, 0.1), { rangeText: '< 60 dBA' }),
    ],
    procedureText:
      'The infant incubator is calibrated per IEC 60601-2-19 by placing calibrated temperature sensors at the standard five measurement points (centre and four corners at mattress height) plus a reference thermometer. Average temperature, spatial uniformity, temperature variability, time to reach setpoint, RH (with calibrated hygrometer) and internal sound level are measured. Error = incubator display − reference average; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 60601-2-19 / IEC 60601-2-21',
    referenceStandard: 'Incubator analyser with multi-point temperature probes + reference hygrometer (e.g. Fluke INCU)',
  },

  // ── Phototherapy Radiometer ──────────────────────────────────────
  {
    id: 'md-phototherapy-radiometer',
    label: 'Phototherapy Unit / Radiometer',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'µW/cm²',
    points: pts('µW/cm²', [10, 20, 30, 50]),
    typeB: tb('µW/cm²', 0.5, 0.1, [{ source: 'Spectral / spatial non-uniformity of source', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'µW/cm²' }]),
    units: ['µW/cm²'],
    ranges: [
      range('Spectral Irradiance', 'µW/cm²', [5, 10, 20, 30, 50, 100], tb('µW/cm²', 0.5, 0.1), { rangeText: '0 – 100 µW/cm²/nm (425–475 nm)' }),
    ],
    procedureText:
      'The neonatal phototherapy radiometer/unit is calibrated against a reference (traceable) phototherapy radiometer or calibrated photodiode at the standard mattress distance and grid positions. Blue-light spectral irradiance is measured at defined points to establish average and uniformity; the unit radiometer reading is compared to the reference. Error = UUC reading − reference; uncertainty per EA-4/02 to IEC 60601-2-50.',
    nablReference: 'NABL 126 / IEC 60601-2-50',
    referenceStandard: 'Reference phototherapy radiometer / calibrated photodiode',
  },

  // ── Suction Apparatus (vacuum) ───────────────────────────────────
  {
    id: 'md-suction',
    label: 'Suction Apparatus (vacuum)',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'mmHg',
    points: pts('mmHg', [0, 100, 300, 600]),
    typeB: tb('mmHg', 0.5, 1, [{ source: 'Leak / stability of vacuum system', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mmHg' }]),
    units: ['mmHg', 'kPa'],
    ranges: [
      range('Vacuum', 'mmHg', [0, 100, 200, 400, 600, 760], tb('mmHg', 0.5, 1), { altUnits: ['kPa'], rangeText: '0 – 760 mmHg (vacuum)' }),
    ],
    procedureText:
      'The medical suction (vacuum) regulator/pump is calibrated against a traceable digital vacuum gauge connected to the patient port with the line occluded. Vacuum is set in steps over the operating range; the UUC gauge indication is recorded after stabilisation and error = UUC − reference. A leak test is performed. Uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / ISO 10079',
    referenceStandard: 'Digital vacuum / pressure calibrator',
  },

  // ── Centrifuge (medical) ─────────────────────────────────────────
  {
    id: 'md-centrifuge',
    label: 'Centrifuge (medical / laboratory)',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'RPM',
    points: pts('RPM', [1000, 3000, 6000, 10000]),
    typeB: tb('RPM', 5, 1, [{ source: 'Speed measurement repeatability', value: 5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'RPM' }]),
    units: ['RPM', 'min'],
    ranges: [
      range('Rotational Speed', 'RPM', [500, 1000, 3000, 6000, 10000, 15000], tb('RPM', 5, 1), { rangeText: '100 – 15000 RPM' }),
      range('Timer', 'min', [1, 5, 10, 30], tb('min', 0.01, 0.1), { rangeText: '0 – 60 min' }),
    ],
    procedureText:
      'The centrifuge speed is calibrated using a non-contact (optical/laser) tachometer or stroboscope referencing a reflective mark on the rotor; the displayed/set RPM is compared with the tachometer reading at multiple set speeds after stabilisation. The timer is verified against a calibrated stopwatch. Error = UUC − reference; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / OEM service specification',
    referenceStandard: 'Calibrated optical/laser tachometer + reference stopwatch',
  },

  // ── Medical Weighing Scale ───────────────────────────────────────
  {
    id: 'md-weighing-scale',
    label: 'Medical Weighing Scale',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'kg',
    points: pts('kg', [5, 20, 60, 100]),
    typeB: tb('kg', 0.005, 0.01, [{ source: 'Eccentricity / repeatability of UUC', value: 0.01, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'kg' }]),
    units: ['kg', 'g'],
    ranges: [
      range('Mass', 'kg', [1, 5, 20, 60, 100, 150], tb('kg', 0.005, 0.01), { altUnits: ['g'], rangeText: '0 – 200 kg' }),
    ],
    procedureText:
      'The medical/patient weighing scale is calibrated using traceable OIML class M reference weights applied over the weighing range (ascending/descending), with repeatability and eccentricity (off-centre loading) tests at a representative load. Error = UUC indication − applied mass; uncertainty per EA-4/02 / OIML R76 combining reference-weight uncertainty, resolution, repeatability and eccentricity.',
    nablReference: 'NABL 126 / OIML R76 / NABL 122-01',
    referenceStandard: 'OIML class M1/M2 reference weights',
  },

  // ── Glucometer ───────────────────────────────────────────────────
  {
    id: 'md-glucometer',
    label: 'Glucometer (Blood Glucose Meter)',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'mg/dL',
    points: pts('mg/dL', [50, 100, 200, 400]),
    typeB: tb('mg/dL', 2, 1, [{ source: 'Control-solution / strip lot variability', value: 3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mg/dL' }]),
    units: ['mg/dL', 'mmol/L'],
    ranges: [
      range('Blood Glucose', 'mg/dL', [40, 50, 100, 200, 400, 600], tb('mg/dL', 2, 1), { altUnits: ['mmol/L'], rangeText: '20 – 600 mg/dL' }),
    ],
    procedureText:
      'The glucometer is verified using manufacturer control solutions and/or reference glucose standards of known concentration with matched test strips. Measured values are compared against the reference value at low/normal/high levels and assessed to ISO 15197 acceptance criteria. Error = UUC reading − reference; uncertainty per EA-4/02 including control-solution and strip-lot variability.',
    nablReference: 'NABL 126 / ISO 15197',
    referenceStandard: 'Certified glucose control solutions / reference analyser',
  },

  // ── Nebulizer (flow) ─────────────────────────────────────────────
  {
    id: 'md-nebulizer',
    label: 'Nebulizer (gas flow)',
    discipline: DISC,
    subDiscipline: 'Infusion & Flow',
    unit: 'L/min',
    points: pts('L/min', [2, 4, 6, 8]),
    typeB: tb('L/min', 0.05, 0.1, [{ source: 'Flow measurement repeatability', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'L/min' }]),
    units: ['L/min'],
    ranges: [
      range('Gas Flow Rate', 'L/min', [1, 2, 4, 6, 8, 10], tb('L/min', 0.05, 0.1), { rangeText: '0 – 15 L/min' }),
    ],
    procedureText:
      'The nebulizer / compressor driving-gas flow is calibrated using a traceable gas-flow analyser or mass-flow meter connected at the outlet. Set/indicated flow is compared with the analyser reading at multiple points after stabilisation. Error = UUC − reference; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / OEM service specification',
    referenceStandard: 'Gas-flow analyser / mass-flow meter (e.g. Fluke VT900)',
  },

  // ── Bilirubinometer ──────────────────────────────────────────────
  {
    id: 'md-bilirubinometer',
    label: 'Bilirubinometer (Transcutaneous / Lab)',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'mg/dL',
    points: pts('mg/dL', [5, 10, 15, 20]),
    typeB: tb('mg/dL', 0.2, 0.1, [{ source: 'Reference standard / disc tolerance', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mg/dL' }]),
    units: ['mg/dL', 'µmol/L'],
    ranges: [
      range('Bilirubin Concentration', 'mg/dL', [2, 5, 10, 15, 20, 25], tb('mg/dL', 0.2, 0.1), { altUnits: ['µmol/L'], rangeText: '0 – 25 mg/dL' }),
    ],
    procedureText:
      'The bilirubinometer is verified using the manufacturer reference calibration disc/standard or certified bilirubin reference solutions of known concentration. The instrument reading is compared with the reference value at multiple levels. Error = UUC reading − reference; uncertainty per EA-4/02 including reference-standard tolerance and resolution.',
    nablReference: 'NABL 126 / OEM service specification',
    referenceStandard: 'Manufacturer reference disc / certified bilirubin standards',
  },

  // ── Fetal Doppler ────────────────────────────────────────────────
  {
    id: 'md-fetal-doppler',
    label: 'Fetal Doppler / Fetal Heart Monitor',
    discipline: DISC,
    subDiscipline: 'Patient Monitoring',
    unit: 'bpm',
    points: pts('bpm', [60, 120, 180, 240]),
    typeB: tb('bpm', 0.5, 1),
    units: ['bpm'],
    ranges: [
      range('Fetal Heart Rate', 'bpm', [50, 60, 120, 180, 210, 240], tb('bpm', 0.5, 1), { rangeText: '50 – 240 bpm' }),
    ],
    procedureText:
      'The fetal doppler / cardiotocograph (CTG) FHR channel is verified using a fetal/obstetric simulator that generates calibrated fetal-heart-rate signals (and, for CTG, toco/contraction signals). The displayed FHR is compared with the simulated rate at multiple values. Error = UUC display − simulated rate; uncertainty per EA-4/02 to IEC 60601-2-37.',
    nablReference: 'NABL 126 / IEC 60601-2-37',
    referenceStandard: 'Fetal / CTG simulator (e.g. Fluke PS320)',
  },

  // ── Audiometer (medical) ─────────────────────────────────────────
  {
    id: 'md-audiometer',
    label: 'Audiometer (medical)',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'dB HL',
    points: pts('dB HL', [0, 20, 40, 60]),
    typeB: tb('dB HL', 0.5, 1, [{ source: 'Acoustic coupler / RETSPL & frequency response', value: 0.7, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB HL' }]),
    units: ['dB HL', 'Hz'],
    ranges: [
      range('Hearing Level (per frequency)', 'dB HL', [-10, 0, 20, 40, 60, 90, 120], tb('dB HL', 0.5, 1), { rangeText: '-10 – 120 dB HL' }),
      range('Tone Frequency', 'Hz', [250, 500, 1000, 2000, 4000, 8000], tb('Hz', 1, 1), { rangeText: '125 Hz – 8 kHz' }),
    ],
    procedureText:
      'The audiometer is calibrated acoustically per IEC 60645-1 / IEC 60318: the transducer (supra-aural earphone) is coupled to the specified artificial ear / acoustic coupler with a calibrated measuring microphone and sound-level meter. Output sound-pressure level is measured at each test frequency and HL setting and referenced to the RETSPL values; tone frequency and harmonic distortion are checked with a frequency counter/analyser. Error = measured SPL − required SPL (RETSPL + HL); uncertainty per EA-4/02. (Note: this is an acoustics-based calibration cross-referenced to the Acoustics discipline.)',
    nablReference: 'NABL 126 / IEC 60645-1 / IEC 60318 / ISO 389',
    referenceStandard: 'Acoustic coupler / artificial ear + measuring microphone & sound calibrator',
  },

  // ── Tympanometer ─────────────────────────────────────────────────
  {
    id: 'md-tympanometer',
    label: 'Tympanometer / Middle-Ear Analyzer',
    discipline: DISC,
    subDiscipline: 'Respiratory & Other',
    unit: 'daPa',
    points: pts('daPa', [-400, -200, 0, 200]),
    typeB: tb('daPa', 2, 1, [{ source: 'Acoustic cavity / coupler tolerance', value: 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'daPa' }]),
    units: ['daPa', 'mL'],
    ranges: [
      range('Ear-Canal Pressure', 'daPa', [-600, -400, -200, 0, 200], tb('daPa', 2, 1), { rangeText: '-600 – +400 daPa' }),
      range('Compliance / Volume', 'mL', [0.2, 0.5, 1.0, 2.0, 5.0], tb('mL', 0.05, 0.01), { rangeText: '0.2 – 5 mL' }),
    ],
    procedureText:
      'The tympanometer (impedance/admittance meter) is calibrated per IEC 60645-5 using calibrated hard-walled acoustic test cavities of known volume and a traceable pressure standard. Static acoustic compliance is verified against the reference cavities; ear-canal pressure is verified against a calibrated manometer; the probe-tone level/frequency (e.g. 226 Hz) is checked acoustically. Error = UUC reading − reference; uncertainty per EA-4/02.',
    nablReference: 'NABL 126 / IEC 60645-5',
    referenceStandard: 'Calibrated acoustic test cavities + reference pressure/manometer standard',
  },
];
