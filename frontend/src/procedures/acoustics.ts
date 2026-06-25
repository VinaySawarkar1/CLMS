// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: ACOUSTICS & SOUND
// ─────────────────────────────────────────────────────────────────
// Discipline covers airborne acoustics (sound level), audiometry and
// ultrasonics. Methods follow IEC 61672 (sound level meters),
// IEC 60942 (acoustic calibrators), IEC 61260 (octave band filters),
// IEC 60645 / IEC 60318 (audiometers) and NABL specific criteria
// NABL 100 / NABL 126. Standard reference levels are 94 dB and 114 dB
// SPL at 1 kHz delivered by a Class 1 acoustic calibrator/pistonphone.

import { Procedure, pts, tb, range, R3 } from './types';

const dBalt = ['dB(A)', 'dB(C)', 'dB SPL'];
const Hzalt = ['kHz'];

export const ACOUSTICS: Procedure[] = [
  // ── SOUND LEVEL ──────────────────────────────────────────────────
  {
    id: 'ac-slm-class1',
    label: 'Sound Level Meter (Class 1 / Class 2)',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Sound Level',
    unit: 'dB',
    points: pts('dB', [94, 114]),
    typeB: tb('dB', 0.15, 0.1, [
      { source: 'Acoustic calibrator level uncertainty', value: 0.2, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Coupler / microphone coupling effect', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
      { source: 'Static pressure & ambient correction', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Sound Pressure Level (reference)', 'dB', [94, 114], tb('dB', 0.15, 0.1), { altUnits: dBalt, rangeText: '94 / 114 dB @ 1 kHz' }),
      range('Frequency Weighting (A/C/Z)', 'dB', [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000], tb('dB', 0.2, 0.1, [
        { source: 'Multifunction calibrator frequency level uncertainty', value: 0.25, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      ]), { altUnits: dBalt, rangeText: '31.5 Hz – 16 kHz octave bands' }),
      range('Frequency of test tone', 'Hz', [31.5, 1000, 16000], tb('Hz', 0.1, 0.1), { altUnits: Hzalt }),
    ],
    procedureText:
      'Calibrate per IEC 61672-3 periodic test. Acoustically couple a Class 1 acoustic calibrator (94 dB and 114 dB at 1 kHz) to the SLM microphone in a stable environment (23 ± 3 °C). Record indicated level versus reference, apply microphone pressure and free-field corrections. Verify A-, C- and Z-frequency weightings at octave-band frequencies 31.5 Hz to 16 kHz using a multifunction sound calibrator, time weightings (F/S), level linearity and self-generated noise. Deviations are compared with the Class 1/2 tolerance limits of IEC 61672-1.',
    nablReference: 'NABL 126 / IEC 61672-3',
    referenceStandard: 'Class 1 Acoustic Calibrator / Multifunction Sound Calibrator (IEC 60942), Reference Microphone',
  },
  {
    id: 'ac-integrating-slm',
    label: 'Integrating-Averaging Sound Level Meter',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Sound Level',
    unit: 'dB',
    points: pts('dB', [94, 114]),
    typeB: tb('dB', 0.2, 0.1, [
      { source: 'Acoustic calibrator level uncertainty', value: 0.2, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Integration time-base error', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Equivalent Continuous Level (LAeq)', 'dB', [70, 80, 94, 100, 114], tb('dB', 0.2, 0.1), { altUnits: dBalt }),
      range('Reference SPL', 'dB', [94, 114], tb('dB', 0.15, 0.1), { altUnits: dBalt, rangeText: '94 / 114 dB @ 1 kHz' }),
    ],
    procedureText:
      'Per IEC 61672-3, verify the energy-averaging (LAeq) function in addition to the SLM tests. Apply a known steady level via the acoustic calibrator and toneburst sequences of defined duration; confirm LAeq integration accuracy, level linearity over the operating range and pulse-range / overload indication. Compare against IEC 61672-1 class tolerances.',
    nablReference: 'NABL 126 / IEC 61672-3',
    referenceStandard: 'Class 1 Acoustic Calibrator, Electrical Toneburst / Reference Signal Source',
  },
  {
    id: 'ac-noise-dosimeter',
    label: 'Noise Dosimeter / Personal Sound Exposure Meter',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Sound Level',
    unit: 'dB',
    points: pts('dB', [94, 114]),
    typeB: tb('dB', 0.25, 0.1, [
      { source: 'Acoustic calibrator level uncertainty', value: 0.2, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Microphone coupler fit on dosimeter', value: 0.15, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Sound Exposure Level / LAeq', 'dB', [80, 90, 94, 100, 114], tb('dB', 0.25, 0.1), { altUnits: dBalt }),
    ],
    procedureText:
      'Calibrate per IEC 61252. Couple a 94 dB / 114 dB acoustic calibrator at 1 kHz to the dosimeter microphone, verify displayed LAeq / sound exposure (Pa²·h), exchange rate and criterion level settings, A-weighting response and level linearity. Compare against IEC 61252 tolerance limits.',
    nablReference: 'NABL 126 / IEC 61252',
    referenceStandard: 'Class 1 Acoustic Calibrator (IEC 60942), Dosimeter Coupler',
  },
  {
    id: 'ac-acoustic-calibrator',
    label: 'Acoustic Calibrator / Pistonphone',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Sound Level',
    unit: 'dB',
    points: pts('dB', [94, 114]),
    typeB: tb('dB', 0.1, 0.05, [
      { source: 'Reference (working standard) microphone sensitivity uncertainty', value: 0.08, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Coupler volume / load correction', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
      { source: 'Static pressure & temperature correction (pistonphone)', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Generated SPL', 'dB', [94, 114, 124], tb('dB', 0.1, 0.05), { altUnits: dBalt }),
      range('Generated Frequency', 'Hz', [250, 1000], tb('Hz', 0.1, 0.1), { altUnits: Hzalt }),
    ],
    procedureText:
      'Calibrate per IEC 60942 using a calibrated working-standard measurement microphone of known pressure sensitivity coupled to the calibrator cavity. Measure the actual generated sound pressure level and frequency; for a pistonphone apply static-pressure, temperature and humidity corrections to the nominal level. Verify level (typically 94 / 114 dB), frequency (250 Hz / 1 kHz) and total distortion against IEC 60942 Class 1 limits.',
    nablReference: 'NABL 126 / IEC 60942',
    referenceStandard: 'Working Standard Measurement Microphone + Coupler, Barometer / Thermometer / Hygrometer',
  },
  {
    id: 'ac-octave-band-analyzer',
    label: 'Octave / Third-Octave Band Analyzer (Filter Set)',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Sound Level',
    unit: 'dB',
    points: pts('dB', [94]),
    typeB: tb('dB', 0.2, 0.1, [
      { source: 'Reference signal generator level uncertainty', value: 0.15, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Filter centre-frequency / bandwidth deviation', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Filter Centre Frequency', 'Hz', [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000], tb('Hz', 0.2, 0.1), { altUnits: Hzalt, rangeText: '31.5 Hz – 16 kHz octave bands' }),
      range('Pass-band relative attenuation', 'dB', [1000], tb('dB', 0.2, 0.1), { altUnits: dBalt }),
    ],
    procedureText:
      'Calibrate per IEC 61260. Apply an electrical reference signal of known level and frequency to each octave / one-third-octave band filter; verify reference attenuation at the band centre, relative attenuation across the pass-band and stop-band, effective bandwidth, anti-aliasing and linearity. Compare against the Class 1/2 filter tolerance limits of IEC 61260-1.',
    nablReference: 'NABL 126 / IEC 61260-1',
    referenceStandard: 'Reference Signal Generator / Multifunction Calibrator, Frequency Counter',
  },
  {
    id: 'ac-measurement-microphone',
    label: 'Measurement Microphone',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Sound Level',
    unit: 'dB',
    points: pts('dB', [94]),
    typeB: tb('dB', 0.1, 0.05, [
      { source: 'Reference microphone / reciprocity calibration uncertainty', value: 0.1, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Comparison coupler load correction', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Pressure Sensitivity Level', 'dB', [94], tb('dB', 0.1, 0.05), { altUnits: ['dB re 1 V/Pa'], rangeText: 'Sensitivity @ 250 Hz / 1 kHz' }),
      range('Free-field Frequency Response', 'Hz', [31.5, 125, 500, 1000, 2000, 4000, 8000, 16000], tb('dB', 0.15, 0.05), { altUnits: Hzalt }),
    ],
    procedureText:
      'Calibrate per IEC 61094 by comparison (or reciprocity) against a working-standard microphone. Determine pressure sensitivity level at the reference frequency using a calibrated coupler, and the relative free-field / pressure frequency response across the audio band. Report sensitivity in dB re 1 V/Pa with associated uncertainty.',
    nablReference: 'NABL 126 / IEC 61094-5',
    referenceStandard: 'Working Standard Microphone (IEC 61094-2), Comparison Coupler, Electrostatic Actuator',
  },

  // ── AUDIOMETRY ───────────────────────────────────────────────────
  {
    id: 'ac-audiometer-pure-tone',
    label: 'Audiometer (Pure Tone)',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Audiometry',
    unit: 'dB HL',
    points: pts('dB HL', [250, 500, 1000, 2000, 4000, 8000]),
    typeB: tb('dB HL', 0.3, 0.1, [
      { source: 'Acoustic coupler / artificial ear (IEC 60318) sensitivity uncertainty', value: 0.3, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Reference equivalent threshold SPL (RETSPL) correction', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
      { source: 'Earphone positioning / coupler load', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: ['dB HL', 'dB SPL'],
    ranges: [
      range('Hearing Level (air conduction)', 'dB HL', [250, 500, 1000, 2000, 4000, 8000], tb('dB HL', 0.3, 0.1), { altUnits: ['dB SPL'], rangeText: '250 Hz – 8 kHz audiometric frequencies' }),
      range('Output SPL accuracy', 'dB SPL', [60, 70], tb('dB SPL', 0.3, 0.1), { altUnits: ['dB HL'] }),
      range('Test-tone Frequency', 'Hz', [250, 500, 1000, 2000, 4000, 8000], tb('Hz', 0.5, 0.5), { altUnits: Hzalt }),
    ],
    procedureText:
      'Calibrate per IEC 60645-1 with the earphone coupled to the appropriate artificial ear / acoustic coupler (IEC 60318-1/-3). For each audiometric frequency (250, 500, 1000, 2000, 4000, 8000 Hz) measure the sound pressure produced for a given hearing-level setting and compare against the reference equivalent threshold SPL (RETSPL, ISO 389) to verify hearing-level accuracy. Verify output level linearity (attenuator), frequency accuracy, total harmonic distortion, rise/fall times and masking-noise level. Compare with IEC 60645-1 tolerances.',
    nablReference: 'NABL 126 / IEC 60645-1, ISO 389',
    referenceStandard: 'Measuring Amplifier + Artificial Ear / Acoustic Coupler (IEC 60318), Reference Microphone, Frequency Counter, Distortion Analyzer',
  },
  {
    id: 'ac-hearing-aid-analyzer',
    label: 'Hearing Aid Analyzer',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Audiometry',
    unit: 'dB SPL',
    points: pts('dB SPL', [60, 90]),
    typeB: tb('dB SPL', 0.3, 0.1, [
      { source: 'Coupler microphone (2 cc / IEC 60318-5) sensitivity uncertainty', value: 0.3, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Reference / test-box source level uncertainty', value: 0.25, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dB' },
    ]),
    units: dBalt,
    ranges: [
      range('Test-box / coupler SPL', 'dB SPL', [50, 60, 70, 80, 90], tb('dB SPL', 0.3, 0.1), { altUnits: dBalt }),
      range('Test-tone Frequency', 'Hz', [250, 500, 1000, 2000, 4000, 8000], tb('Hz', 0.5, 0.5), { altUnits: Hzalt }),
    ],
    procedureText:
      'Calibrate per IEC 60118-0 / IEC 60645. Using a calibrated coupler microphone (2 cc coupler, IEC 60318-5) verify the analyzer source SPL level accuracy in the test box, frequency accuracy and the measurement-microphone SPL readout across 250 Hz–8 kHz. Confirm input level linearity used for gain / OSPL90 measurements against reference values.',
    nablReference: 'NABL 126 / IEC 60118-0, IEC 60645',
    referenceStandard: 'Reference Measurement Microphone + 2 cc Coupler (IEC 60318-5), Measuring Amplifier',
  },
  {
    id: 'ac-tympanometer',
    label: 'Tympanometer / Middle-Ear Analyzer (Medical)',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Audiometry',
    unit: 'dB SPL',
    points: pts('dB SPL', [85]),
    typeB: tb('dB SPL', 0.4, 0.1, [
      { source: 'Acoustic coupler sensitivity uncertainty', value: 0.3, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dB' },
      { source: 'Pressure standard (manometer) uncertainty', value: 5, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'daPa' },
      { source: 'Cavity volume reference uncertainty', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ml' },
    ]),
    units: ['dB SPL', 'daPa', 'ml'],
    ranges: [
      range('Probe-tone SPL', 'dB SPL', [85], tb('dB SPL', 0.4, 0.1), { altUnits: dBalt, rangeText: 'Probe tone level @ 226 Hz' }),
      range('Air Pressure (tympanometry)', 'daPa', [-400, -200, 0, 100, 200], tb('daPa', 5, 1)),
      range('Acoustic Admittance / Compliance', 'ml', [0.2, 0.5, 1.0, 2.0, 5.0], tb('ml', 0.05, 0.01)),
      range('Probe-tone Frequency', 'Hz', [226, 678, 1000], tb('Hz', 0.5, 1)),
    ],
    procedureText:
      'NOTE: medical / bio-medical device — calibrate per IEC 60645-5. Verify probe-tone level and frequency (commonly 226 Hz) with a coupler microphone, the air-pressure system against a reference manometer over the tympanometry range (e.g. −400 to +200 daPa), and acoustic admittance/compliance using calibrated reference cavities (e.g. 0.2–5 ml). Compare against IEC 60645-5 tolerance limits.',
    nablReference: 'NABL 126 / IEC 60645-5',
    referenceStandard: 'Coupler Microphone + Measuring Amplifier, Reference Manometer, Calibrated Acoustic Reference Cavities',
  },

  // ── ULTRASONICS ──────────────────────────────────────────────────
  {
    id: 'ac-ultrasonic-flaw-detector',
    label: 'Ultrasonic Flaw Detector',
    discipline: 'Acoustics & Sound',
    subDiscipline: 'Ultrasonics',
    unit: 'mm',
    points: pts('mm', [25, 50, 100, 200]),
    typeB: tb('mm', 0.05, 0.1, [
      { source: 'Reference calibration block (V1/V2) certified dimension uncertainty', value: 0.02, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'mm' },
      { source: 'Probe coupling / index-point variation', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
      { source: 'Velocity / material correction', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
    ]),
    units: ['mm', 'dB', '%FSH'],
    ranges: [
      range('Range / Distance Linearity', 'mm', [25, 50, 100, 200], tb('mm', 0.05, 0.1), { rangeText: 'Distance linearity using IIW V1 / V2 block' }),
      range('Vertical / Amplitude Linearity', '%FSH', [20, 40, 60, 80, 100], tb('%FSH', 1, 1)),
      range('Gain / dB Linearity', 'dB', [2, 6, 12, 20, 26], tb('dB', 0.2, 0.1)),
    ],
    procedureText:
      'Calibrate per IS 12666 / EN 12668-3 using certified reference blocks (IIW V1, V2 or step/calibration blocks). Verify horizontal (range / distance) linearity from multiple back-wall echoes, vertical (amplitude / FSH) linearity, gain (dB) control linearity, time-base accuracy and resolution. Determine probe index point and beam angle on the reference block. Compare against the applicable acceptance limits.',
    nablReference: 'NABL 126 / EN 12668-3, IS 12666',
    referenceStandard: 'Certified Ultrasonic Reference Blocks (IIW V1/V2, step blocks), Calibrated Probes',
  },
];
