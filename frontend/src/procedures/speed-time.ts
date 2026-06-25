// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: SPEED & TIME DISCIPLINE
// ─────────────────────────────────────────────────────────────────
// Covers rotational speed, linear/surface speed, time-frequency, and
// vibration/acceleration. Methods follow NABL-126, ISO 16063 (vibration),
// and OIML/EURAMET guidance for time-interval and tachometric calibration.

import { Procedure, pts, tb, range, R3 } from './types';

export const SPEED_TIME: Procedure[] = [
  // ── Rotational Speed ───────────────────────────────────────────
  {
    id: 'sp-tacho-noncontact',
    label: 'Tachometer — Non-contact (Optical / Photoelectric)',
    discipline: 'Speed & Time',
    subDiscipline: 'Rotational Speed',
    unit: 'rpm',
    points: pts('rpm', [100, 500, 1000, 5000, 10000]),
    typeB: tb('rpm', 0.5, 1, [
      { source: 'Reflective mark / trigger jitter', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'rpm' },
    ]),
    ranges: [
      range('Rotational Speed (Low)', 'rpm', [100, 500, 1000], tb('rpm', 0.3, 0.1), { rangeText: '100 – 1000 rpm' }),
      range('Rotational Speed (High)', 'rpm', [2000, 5000, 10000], tb('rpm', 2, 1), { rangeText: '2000 – 10000 rpm' }),
    ],
    procedureText:
      'The optical tachometer is calibrated against a reference rotational-speed standard (servo-controlled motor with reference encoder / master photo-tachometer) over the specified range. A reflective mark is applied to the rotating target; UUC and reference simultaneously read the speed at each set point after stabilisation. Minimum five readings per point are taken; mean error and repeatability are evaluated.',
    nablReference: 'NABL 126 / NABL 122-02',
    referenceStandard: 'Reference photoelectric tachometer with calibrated encoder (motor speed standard)',
  },
  {
    id: 'sp-tacho-contact',
    label: 'Tachometer — Contact',
    discipline: 'Speed & Time',
    subDiscipline: 'Rotational Speed',
    unit: 'rpm',
    points: pts('rpm', [100, 500, 1000, 5000, 10000]),
    typeB: tb('rpm', 1, 1, [
      { source: 'Tip slippage / contact wheel diameter', value: 1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'rpm' },
    ]),
    procedureText:
      'The contact tachometer is engaged against a reference rotating shaft driven at calibrated speeds. The contact tip / wheel is pressed without slip; readings are compared with the reference standard at each set point. Contact-wheel circumferential conversion (for surface-speed mode) is verified separately.',
    nablReference: 'NABL 126',
    referenceStandard: 'Calibrated reference shaft / motor speed standard',
  },
  {
    id: 'sp-stroboscope',
    label: 'Stroboscope',
    discipline: 'Speed & Time',
    subDiscipline: 'Rotational Speed',
    unit: 'rpm',
    points: pts('rpm', [100, 500, 1000, 5000, 10000]),
    typeB: tb('rpm', 1, 1, [
      { source: 'Flash-rate harmonic ambiguity', value: 2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'rpm' },
    ]),
    procedureText:
      'The stroboscope flash rate is calibrated against a frequency standard / reference tachometer. The flash frequency is set so a rotating reference target appears stationary at the fundamental; the indicated flash rate (rpm/flashes-per-minute) is compared with the reference. Harmonic locking is checked by progressively halving/doubling flash rate.',
    nablReference: 'NABL 126',
    referenceStandard: 'Frequency counter / reference rotational-speed standard',
  },
  {
    id: 'sp-rpm-indicator',
    label: 'RPM Indicator',
    discipline: 'Speed & Time',
    subDiscipline: 'Rotational Speed',
    unit: 'rpm',
    points: pts('rpm', [100, 500, 1000, 5000, 10000]),
    typeB: tb('rpm', 1, 1),
    procedureText:
      'The RPM indicator (with its pickup) is fed a calibrated pulse train from a frequency standard equivalent to the rotational speed (pulses-per-revolution applied). Indicated rpm is compared with the calculated reference at each set point over the working range.',
    nablReference: 'NABL 126',
    referenceStandard: 'Calibrated frequency/pulse generator',
  },
  {
    id: 'sp-centrifuge-rpm',
    label: 'Centrifuge (RPM)',
    discipline: 'Speed & Time',
    subDiscipline: 'Rotational Speed',
    unit: 'rpm',
    points: pts('rpm', [500, 1000, 3000, 6000, 10000]),
    typeB: tb('rpm', 5, 10, [
      { source: 'Speed regulation / stability under load', value: 5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'rpm' },
    ]),
    procedureText:
      'The centrifuge rotor speed is measured with a calibrated non-contact reference tachometer through the inspection port (or via reflective mark on the rotor). The displayed rpm is compared with the reference at set points; speed timer accuracy is also verified where applicable.',
    nablReference: 'NABL 126',
    referenceStandard: 'Reference optical tachometer',
  },
  {
    id: 'sp-lab-centrifuge',
    label: 'Laboratory Centrifuge',
    discipline: 'Speed & Time',
    subDiscipline: 'Rotational Speed',
    unit: 'rpm',
    points: pts('rpm', [1000, 3000, 5000, 10000, 15000]),
    typeB: tb('rpm', 5, 10, [
      { source: 'Speed stability / timer interaction', value: 5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'rpm' },
    ]),
    units: ['rpm', 's'],
    ranges: [
      range('Rotor Speed', 'rpm', [1000, 3000, 5000, 10000, 15000], tb('rpm', 5, 10), { rangeText: '1000 – 15000 rpm' }),
      range('Run Timer', 's', [60, 300, 600], tb('s', 0.2, 1), { altUnits: ['min'], rangeText: '60 – 600 s' }),
    ],
    procedureText:
      'Rotor speed is verified with a calibrated non-contact tachometer at multiple set points; the built-in run timer is checked against a calibrated stopwatch/time standard. Both speed and time errors are reported; RCF derivation from radius is confirmed if displayed.',
    nablReference: 'NABL 126',
    referenceStandard: 'Reference optical tachometer + time/frequency standard',
  },

  // ── Linear Speed ───────────────────────────────────────────────
  {
    id: 'sp-speedometer',
    label: 'Speedometer',
    discipline: 'Speed & Time',
    subDiscipline: 'Linear Speed',
    unit: 'm/s',
    points: pts('m/s', [5, 10, 20, 30, 40]),
    typeB: tb('m/s', 0.05, 0.1),
    units: ['m/s', 'km/h', 'ft/min'],
    ranges: [
      range('Linear Speed', 'm/s', [5, 10, 20, 30, 40], tb('m/s', 0.05, 0.1), { altUnits: ['km/h', 'ft/min'], rangeText: '5 – 40 m/s' }),
    ],
    procedureText:
      'The speedometer is driven via a calibrated roller/drive standard whose surface speed is established from a reference rotational standard and roller circumference. Indicated speed is compared with the reference linear speed at each set point.',
    nablReference: 'NABL 126',
    referenceStandard: 'Roller drive standard traceable to rotational-speed standard',
  },
  {
    id: 'sp-treadmill',
    label: 'Treadmill (Speed)',
    discipline: 'Speed & Time',
    subDiscipline: 'Linear Speed',
    unit: 'm/s',
    points: pts('m/s', [1, 2, 3, 4, 5]),
    typeB: tb('m/s', 0.02, 0.1, [
      { source: 'Belt slip / loading variation', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', 'km/h'],
    procedureText:
      'Belt linear speed is determined from the belt-roller rotational speed (measured by a calibrated non-contact tachometer) and roller effective circumference, or by mark-passage timing over a known belt length. Indicated speed is compared with reference at each set point under representative load.',
    nablReference: 'NABL 126',
    referenceStandard: 'Reference tachometer + calibrated length / time standard',
  },
  {
    id: 'sp-conveyor-speed',
    label: 'Conveyor Speed',
    discipline: 'Speed & Time',
    subDiscipline: 'Linear Speed',
    unit: 'm/s',
    points: pts('m/s', [0.1, 0.5, 1, 2, 5]),
    typeB: tb('m/s', 0.01, 0.01, [
      { source: 'Belt slip / drive-roller wear', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', 'm/min', 'ft/min'],
    procedureText:
      'Conveyor belt speed is verified by timing a marked point over a measured belt length using a calibrated stopwatch, or via drive-roller rpm and circumference. Indicated/set speed is compared with the computed reference linear speed.',
    nablReference: 'NABL 126',
    referenceStandard: 'Calibrated length standard + time standard',
  },
  {
    id: 'sp-surface-speed-meter',
    label: 'Surface Speed Meter',
    discipline: 'Speed & Time',
    subDiscipline: 'Linear Speed',
    unit: 'm/s',
    points: pts('m/s', [0.5, 1, 5, 10, 20]),
    typeB: tb('m/s', 0.02, 0.1, [
      { source: 'Contact wheel diameter uncertainty', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', 'm/min', 'ft/min'],
    procedureText:
      'The surface-speed (contact-wheel) meter is run against a reference surface moving at calibrated linear speed (derived from a rotational standard and known roller circumference). Indicated surface speed is compared with the reference at each set point; wheel circumference is verified.',
    nablReference: 'NABL 126',
    referenceStandard: 'Surface-speed reference rig traceable to rotational-speed standard',
  },
  {
    id: 'sp-wind-speed-tacho',
    label: 'Wind Speed (Tacho-style rotating-cup)',
    discipline: 'Speed & Time',
    subDiscipline: 'Linear Speed',
    unit: 'm/s',
    points: pts('m/s', [1, 5, 10, 20, 30]),
    typeB: tb('m/s', 0.05, 0.1, [
      { source: 'Cup rotation-to-speed transfer factor', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s' },
    ]),
    units: ['m/s', 'km/h', 'ft/min'],
    procedureText:
      'For rotating-cup/vane anemometers the rotor is driven at calibrated rotational speeds on a reference rig; the relationship between rotation rate and indicated wind speed (transfer factor) is verified at each set point. (Wind-tunnel fluid-flow calibration is covered under the Fluid Flow discipline; here only the tachometric transfer is calibrated.)',
    nablReference: 'NABL 126',
    referenceStandard: 'Reference rotational-speed drive standard',
  },

  // ── Time & Frequency ───────────────────────────────────────────
  {
    id: 'sp-stopwatch-digital',
    label: 'Stopwatch / Digital Timer',
    discipline: 'Speed & Time',
    subDiscipline: 'Time & Frequency',
    unit: 's',
    points: pts('s', [60, 600, 3600]),
    typeB: tb('s', 0.0005, 0.01, [
      { source: 'Operator start/stop reaction (if manual)', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 's' },
    ]),
    units: ['s', 'ms', 'min'],
    procedureText:
      'The digital timer is calibrated by comparison against a time-base standard traceable to a Rb/GPS-disciplined frequency reference, using the totalize/gated method (a calibrated reference time interval is applied electronically to eliminate operator reaction error). Time error at 60 s, 600 s and 3600 s is determined and the relative timing error (ppm) computed.',
    nablReference: 'NABL 126 / EURAMET cg-no time interval',
    referenceStandard: 'GPS/Rb-disciplined time-interval standard',
  },
  {
    id: 'sp-mechanical-stopwatch',
    label: 'Mechanical Stopwatch',
    discipline: 'Speed & Time',
    subDiscipline: 'Time & Frequency',
    unit: 's',
    points: pts('s', [60, 600, 3600]),
    typeB: tb('s', 0.001, 0.2, [
      { source: 'Operator start/stop reaction', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 's' },
    ]),
    units: ['s', 'min'],
    procedureText:
      'The mechanical stopwatch is calibrated against a reference time standard. The start/stop is triggered simultaneously with a reference gate (photogate or audio start/stop) to minimise reaction error; multiple runs at 60 s, 600 s and 3600 s are averaged and the rate error per day is reported.',
    nablReference: 'NABL 126',
    referenceStandard: 'Reference time-interval standard (GPS/Rb disciplined)',
  },
  {
    id: 'sp-time-interval-counter',
    label: 'Time-Interval Counter',
    discipline: 'Speed & Time',
    subDiscipline: 'Time & Frequency',
    unit: 's',
    points: pts('s', [0.001, 0.1, 1, 60, 3600]),
    typeB: tb('s', 0.00001, 0.000001, [
      { source: 'Trigger level / time-base ageing', value: 0.00002, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 's' },
    ]),
    units: ['s', 'ms'],
    procedureText:
      'The time-interval counter is calibrated by applying precisely known time intervals from a calibrated reference generator locked to a frequency standard. Time-base accuracy is verified against the reference 10 MHz; trigger/start-stop channel errors are characterised across short and long intervals.',
    nablReference: 'NABL 126',
    referenceStandard: 'Reference time-interval generator + 10 MHz frequency standard',
  },
  {
    id: 'sp-frequency-counter',
    label: 'Frequency Counter (Time Base)',
    discipline: 'Speed & Time',
    subDiscipline: 'Time & Frequency',
    unit: 'Hz',
    points: pts('Hz', [10, 1000, 100000, 1000000, 10000000]),
    typeB: tb('Hz', 0.001, 0.001, [
      { source: 'Internal time-base ageing / temperature', value: 0.01, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'Hz' },
    ]),
    units: ['Hz', 'kHz'],
    procedureText:
      'The frequency counter time base is calibrated by comparison of its internal/external 10 MHz reference against a Rb/GPS-disciplined frequency standard (beat/phase-comparison method). Frequency error (ppm) is determined at representative input frequencies; the time-base drift is recorded.',
    nablReference: 'NABL 126',
    referenceStandard: 'GPS/Rb-disciplined frequency standard (10 MHz)',
  },

  // ── Vibration & Acceleration ───────────────────────────────────
  {
    id: 'sp-vibration-meter',
    label: 'Vibration Meter',
    discipline: 'Speed & Time',
    subDiscipline: 'Vibration & Acceleration',
    unit: 'mm/s',
    points: pts('mm/s', [1, 5, 10, 20, 50]),
    typeB: tb('mm/s', 0.05, 0.1, [
      { source: 'Reference shaker amplitude stability', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm/s' },
      { source: 'Frequency-response / cross-axis sensitivity', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm/s' },
    ]),
    units: ['mm/s', 'm/s²', 'µm', 'g'],
    ranges: [
      range('Velocity @ 80 Hz', 'mm/s', [1, 5, 10, 20, 50], tb('mm/s', 0.05, 0.1), { altUnits: ['m/s²', 'µm', 'g'], rangeText: '1 – 50 mm/s' }),
      range('Acceleration @ 160 Hz', 'm/s²', [1, 5, 10, 50, 100], tb('m/s²', 0.05, 0.1), { altUnits: ['g'], rangeText: '1 – 100 m/s²' }),
    ],
    procedureText:
      'The vibration meter with its transducer is mounted on a reference vibration calibrator / shaker that generates sinusoidal motion of known amplitude at fixed reference frequencies (typically 80 Hz and 160 Hz per ISO 16063). Indicated velocity/acceleration/displacement is compared with the reference amplitude (Comparison Method, ISO 16063-21) at each set point.',
    nablReference: 'ISO 16063-21 / NABL 126',
    referenceStandard: 'Reference vibration calibrator (back-to-back reference accelerometer)',
  },
  {
    id: 'sp-accelerometer',
    label: 'Accelerometer',
    discipline: 'Speed & Time',
    subDiscipline: 'Vibration & Acceleration',
    unit: 'm/s²',
    points: pts('m/s²', [1, 5, 10, 50, 100]),
    typeB: tb('m/s²', 0.03, 0.01, [
      { source: 'Reference accelerometer charge sensitivity', value: 0.03, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'm/s²' },
      { source: 'Mounting / transverse sensitivity', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s²' },
    ]),
    units: ['m/s²', 'g', 'mm/s'],
    ranges: [
      range('Sensitivity @ 80 Hz', 'm/s²', [1, 5, 10, 50, 100], tb('m/s²', 0.03, 0.01), { altUnits: ['g'], rangeText: '1 – 100 m/s²' }),
      range('Frequency Response @ 10 m/s²', 'm/s²', [10, 10, 10, 10, 10], tb('m/s²', 0.05, 0.01), { rangeText: '10 Hz – 10 kHz' }),
    ],
    procedureText:
      'The accelerometer is calibrated for sensitivity by the comparison method (ISO 16063-21) against a calibrated back-to-back reference accelerometer on a shaker at the reference frequency (typically 80 Hz / 160 Hz), and frequency response is swept across the working band. Primary laser-interferometric calibration (ISO 16063-11) is applied where the highest accuracy is required.',
    nablReference: 'ISO 16063-11 / ISO 16063-21',
    referenceStandard: 'Back-to-back reference accelerometer / laser interferometer shaker',
  },
  {
    id: 'sp-vibration-calibrator',
    label: 'Vibration Calibrator (Reference Shaker)',
    discipline: 'Speed & Time',
    subDiscipline: 'Vibration & Acceleration',
    unit: 'm/s²',
    points: pts('m/s²', [1, 10, 100]),
    typeB: tb('m/s²', 0.02, 0.01, [
      { source: 'Amplitude / frequency stability of generated motion', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'm/s²' },
    ]),
    units: ['m/s²', 'mm/s', 'µm', 'g'],
    ranges: [
      range('Generated Acceleration', 'm/s²', [1, 10, 100], tb('m/s²', 0.02, 0.01), { altUnits: ['g'], rangeText: '1 – 100 m/s²' }),
      range('Generated Velocity', 'mm/s', [10, 20, 50], tb('mm/s', 0.02, 0.01), { rangeText: '10 – 50 mm/s' }),
    ],
    procedureText:
      'The fixed-amplitude vibration calibrator is verified by mounting a calibrated reference accelerometer / laser interferometer on its platform and measuring the generated acceleration/velocity/displacement amplitude at the calibrator nominal frequency (e.g. 159.2 Hz). Amplitude error, frequency error and total harmonic distortion are reported per ISO 16063-11/-21.',
    nablReference: 'ISO 16063-11 / ISO 16063-21',
    referenceStandard: 'Laser interferometer / calibrated reference accelerometer',
  },
  {
    id: 'sp-vibration-analyzer',
    label: 'Vibration Analyzer',
    discipline: 'Speed & Time',
    subDiscipline: 'Vibration & Acceleration',
    unit: 'mm/s',
    points: pts('mm/s', [1, 5, 10, 20, 50]),
    typeB: tb('mm/s', 0.05, 0.1, [
      { source: 'FFT amplitude accuracy / window leakage', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm/s' },
      { source: 'Reference shaker stability', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm/s' },
    ]),
    units: ['mm/s', 'm/s²', 'µm', 'g'],
    ranges: [
      range('Velocity (RMS) @ 80 Hz', 'mm/s', [1, 5, 10, 20, 50], tb('mm/s', 0.05, 0.1), { altUnits: ['m/s²', 'g'], rangeText: '1 – 50 mm/s' }),
      range('Frequency Indication', 'Hz', [80, 160, 500, 1000, 2000], tb('Hz', 0.05, 0.1), { rangeText: '80 – 2000 Hz' }),
    ],
    procedureText:
      'The vibration analyzer is calibrated for amplitude using the comparison method against a reference accelerometer on a shaker at reference frequencies (80 Hz / 160 Hz), and its frequency-axis indication is verified against a calibrated signal/frequency generator. Both amplitude error and frequency error are evaluated per ISO 16063-21.',
    nablReference: 'ISO 16063-21 / NABL 126',
    referenceStandard: 'Reference vibration calibrator + frequency standard',
  },
];
