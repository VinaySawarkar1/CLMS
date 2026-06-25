// ─────────────────────────────────────────────────────────────────
// CLMS — NABL Calibration Procedure Library: OPTICAL & PHOTOMETRY
// ─────────────────────────────────────────────────────────────────
// Discipline: 'Optical & Photometry'
// Sub-disciplines:
//   • Photometry (Illuminance/Luminance)
//   • Spectrophotometry
//   • Refractometry & Polarimetry
//   • Optical Radiation & Power
//
// Method model per NABL-126 / ISO/IEC 17025: each instrument is calibrated
// by comparison against a certified reference (standard lamp/photometer,
// certified reference materials, standard light source, reference power
// meter, gloss/haze reference tiles, angle/stage micrometer, etc.).
// Uncertainty budget (Type B) carries: reference standard certificate
// uncertainty (k=2), UUC resolution, and discipline-specific contributors
// (drift, repeatability, alignment, temperature of CRM, etc.).

import { Procedure, pts, tb, range, R3 } from './types';

const SD_PHOTO = 'Photometry (Illuminance/Luminance)';
const SD_SPECTRO = 'Spectrophotometry';
const SD_REFRACT = 'Refractometry & Polarimetry';
const SD_RADPOW = 'Optical Radiation & Power';

export const OPTICAL: Procedure[] = [
  // ───────────────────────── Photometry ──────────────────────────
  {
    id: 'op-lux-meter',
    label: 'Lux Meter / Light Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_PHOTO,
    unit: 'lux',
    points: pts('lux', [10, 100, 500, 1000, 5000, 10000, 20000]),
    typeB: tb('lux', 1.5, 1, [
      { source: 'Reproducibility of photometric bench / lamp current stability', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'lux' },
      { source: 'Distance setting (inverse-square law) uncertainty', value: 0.4, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'lux' },
      { source: 'Spectral mismatch (f1′) of UUC photometer head', value: 0.6, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'lux' },
    ]),
    units: ['lux', 'fc', 'lm/m²'],
    ranges: [
      range('Illuminance', 'lux', [10, 100, 500, 1000, 5000, 10000, 20000],
        tb('lux', 1.5, 1, [
          { source: 'Lamp/standard reproducibility', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'lux' },
        ]),
        { altUnits: ['fc', 'lm/m²'], rangeText: '10 – 20000 lux' }),
    ],
    procedureText:
      'Calibrate on a photometric bench against a CIE Standard Illuminant A source (2856 K) traceable to a reference photometer/standard lamp of luminous intensity. Mount the UUC photometer head normal to the optical axis; set illuminance via the inverse-square law from the calibrated distance. Record UUC reading at each standard illuminance level; take three readings per point and compute mean error and uncertainty. Verify cosine response and, where required, the spectral mismatch correction factor (f1′).',
    nablReference: 'NABL 122 / CIE S 023 / ISO/CIE 19476',
    referenceStandard: 'CIE Illuminant A standard lamp + reference photometer (traceable to luminous intensity standard)',
  },
  {
    id: 'op-luminance-meter',
    label: 'Luminance Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_PHOTO,
    unit: 'cd/m²',
    points: pts('cd/m²', [1, 10, 100, 300, 1000, 3000]),
    typeB: tb('cd/m²', 1.2, 0.1, [
      { source: 'Luminance standard source stability / drift', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'cd/m²' },
      { source: 'Measuring field / acceptance angle alignment', value: 0.4, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'cd/m²' },
      { source: 'Spectral mismatch & non-uniformity of source', value: 0.5, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'cd/m²' },
    ]),
    units: ['cd/m²'],
    procedureText:
      'Aim the UUC luminance meter at a uniform luminance standard (integrating-sphere source or transmissive/reflective luminance reference) traceable to a reference luminance meter. Align the measuring field within the uniform area; record UUC luminance at each standard level (3 readings/point). Compute error vs. reference and combined uncertainty including source uniformity and acceptance-angle alignment.',
    nablReference: 'NABL 122 / CIE S 023 / ISO/CIE 19476',
    referenceStandard: 'Uniform luminance standard source + reference luminance meter',
  },

  // ──────────────────────── Spectrophotometry ─────────────────────
  {
    id: 'op-spectrophotometer-uvvis',
    label: 'Spectrophotometer (UV-Vis)',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_SPECTRO,
    unit: 'nm',
    points: pts('nm', [240, 440, 540]),
    typeB: tb('nm', 0.1, 0.1, [
      { source: 'Reference filter/lamp emission-line certificate value', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'nm' },
      { source: 'Wavelength repeatability of monochromator', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'nm' },
    ]),
    units: ['nm', 'Abs', '%T'],
    ranges: [
      // Wavelength accuracy at certified emission lines / reference filter bands
      range('Wavelength accuracy', 'nm', [240, 440, 540],
        tb('nm', 0.1, 0.1, [
          { source: 'Certified wavelength of Holmium/Didymium reference filter', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'nm' },
          { source: 'Spectral bandwidth / slit width effect', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'nm' },
        ]),
        { rangeText: '240 – 540 nm (Holmium-oxide / Didymium / Dy₂O₃ lines)' }),
      // Photometric / absorbance accuracy at fixed certified standards
      range('Photometric (Absorbance) accuracy', 'Abs', [0.1, 0.3, 0.5, 1.0],
        tb('Abs', 0.004, 0.001, [
          { source: 'Certified absorbance of neutral-density / K₂Cr₂O₇ reference', value: 0.003, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'Abs' },
          { source: 'Stray light contribution', value: 0.002, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'Abs' },
          { source: 'Photometric repeatability', value: 0.002, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'Abs' },
        ]),
        { rangeText: '0.1 – 1.0 Abs (at 235/257/313/350 nm certified points)' }),
      range('Transmittance accuracy', '%T', [10, 20, 30, 50, 90],
        tb('%T', 0.1, 0.1, [
          { source: 'Certified %T of metal-on-quartz neutral-density filter', value: 0.08, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '%T' },
          { source: 'Stray light at 100 %T', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%T' },
        ]),
        { rangeText: '10 – 90 %T' }),
    ],
    procedureText:
      'Wavelength accuracy: scan certified emission lines and/or a Holmium-oxide / Didymium glass reference filter (e.g. 240, 360, 440, 540 nm bands) and record indicated vs. certified wavelength. Photometric/absorbance accuracy: measure certified neutral-density (metal-on-quartz) filters and/or certified potassium dichromate solutions at fixed wavelengths (235, 257, 313, 350 nm); record absorbance/%T vs. certificate. Evaluate stray light with a cut-off solution (e.g. KCl, NaI). Compute error and uncertainty per parameter against the CRM certificate (k=2).',
    nablReference: 'NABL 122 / ASTM E275 / Pharmacopoeial (USP <857>) wavelength & absorbance checks',
    referenceStandard: 'Holmium-oxide / Didymium wavelength filters + certified neutral-density / potassium-dichromate absorbance CRMs',
  },
  {
    id: 'op-colorimeter',
    label: 'Colorimeter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_SPECTRO,
    unit: '%T',
    points: pts('%T', [10, 25, 50, 75, 100]),
    typeB: tb('%T', 0.2, 0.1, [
      { source: 'Certified transmittance of reference filter set', value: 0.15, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '%T' },
      { source: 'Lamp / LED source stability and drift', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%T' },
      { source: 'Repeatability of UUC', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%T' },
    ]),
    units: ['%T', 'Abs'],
    procedureText:
      'Calibrate against certified colour/transmittance reference filters (or certified colour tiles for tristimulus colorimeters). Insert each certified filter; record indicated %T / absorbance / colour coordinates vs. certificate. Verify zero (with shutter/blank) and 100 %T (clear path). Compute error and uncertainty against CRM certificate values.',
    nablReference: 'NABL 122 / ASTM E1164 / CIE 15 colorimetry',
    referenceStandard: 'Certified transmittance filters / certified colour reference tiles',
  },

  // ───────────────────── Refractometry & Polarimetry ──────────────
  {
    id: 'op-abbe-refractometer',
    label: 'Abbe Refractometer',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_REFRACT,
    unit: 'nD',
    points: pts('nD', [1.3330, 1.4000, 1.5000, 1.5800, 1.6200]),
    typeB: tb('nD', 0.00002, 0.0001, [
      { source: 'Certified refractive index of reference liquid / test plate', value: 0.00002, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'nD' },
      { source: 'Temperature control of prism (±0.1 °C → nD)', value: 0.00004, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'nD' },
      { source: 'Boundary-line reading repeatability', value: 0.00003, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'nD' },
    ]),
    units: ['nD'],
    procedureText:
      'Stabilise the prism at the reference temperature (typically 20 °C) using a circulating bath. Apply certified refractive-index liquids and/or a certified test plate (with contact liquid) to the prism. Read the refractive index (nD, sodium-D line) at each certified value; take repeat readings. Compute error vs. certificate and uncertainty including prism temperature contribution.',
    nablReference: 'NABL 122 / ISO 5661 / pharmacopoeial refractive index method',
    referenceStandard: 'Certified refractive-index reference liquids / certified glass test plate',
  },
  {
    id: 'op-digital-refractometer',
    label: 'Digital Refractometer',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_REFRACT,
    unit: 'nD',
    points: pts('nD', [1.3330, 1.4000, 1.5000, 1.5800]),
    typeB: tb('nD', 0.00002, 0.00001, [
      { source: 'Certified refractive index of reference liquid', value: 0.00002, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'nD' },
      { source: 'Built-in temperature compensation residual', value: 0.00003, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'nD' },
      { source: 'Repeatability of UUC', value: 0.00002, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'nD' },
    ]),
    units: ['nD'],
    procedureText:
      'Verify temperature-controlled measuring cell with deionised water (nD ref at 20 °C) as a check. Dispense certified refractive-index reference liquids onto the prism; allow thermal equilibration; record the displayed nD and compute error vs. certificate. Repeat readings to assess repeatability.',
    nablReference: 'NABL 122 / ISO 5661',
    referenceStandard: 'Certified refractive-index reference liquids (traceable CRM)',
  },
  {
    id: 'op-brix-refractometer',
    label: 'Brix Refractometer',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_REFRACT,
    unit: '°Brix',
    points: pts('°Brix', [0, 10, 20, 30, 40, 50, 60]),
    typeB: tb('°Brix', 0.03, 0.1, [
      { source: 'Certified sucrose reference solution value', value: 0.03, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '°Brix' },
      { source: 'Temperature compensation / cell temperature effect', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°Brix' },
      { source: 'Reading repeatability of UUC', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°Brix' },
    ]),
    units: ['°Brix', 'nD'],
    procedureText:
      'Zero/water-check with deionised water (0 °Brix at 20 °C). Apply certified sucrose reference solutions of known °Brix; equilibrate to reference temperature; record displayed/scale Brix and compute error vs. certificate. Repeat readings for repeatability and apply temperature corrections where the UUC lacks automatic temperature compensation.',
    nablReference: 'NABL 122 / ICUMSA / OIML R 108 (Brix scale)',
    referenceStandard: 'Certified sucrose (Brix) reference solutions',
  },
  {
    id: 'op-polarimeter',
    label: 'Polarimeter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_REFRACT,
    unit: '°',
    points: pts('°', [-30, -10, 0, 10, 30, 60, 90]),
    typeB: tb('°', 0.01, 0.001, [
      { source: 'Certified optical rotation of quartz control plate / sucrose CRM', value: 0.01, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '°' },
      { source: 'Temperature of sample tube (rotation temperature coefficient)', value: 0.005, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°' },
      { source: 'Reading repeatability / end-point setting', value: 0.005, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°' },
    ]),
    units: ['°', '°Z'],
    procedureText:
      'Verify zero with the empty/blank tube. Insert certified quartz control plates (positive and negative rotation) or certified sucrose solutions of known optical rotation at the reference wavelength (589 nm, sodium-D). Record indicated angular rotation (or °Z, sugar scale) at each certified value; take repeat readings. Compute error vs. certificate and uncertainty including tube-temperature contribution.',
    nablReference: 'NABL 122 / ICUMSA / pharmacopoeial optical rotation method',
    referenceStandard: 'Certified quartz control plates / certified sucrose optical-rotation CRMs',
  },

  // ─────────────────── Optical Radiation & Power ──────────────────
  {
    id: 'op-uv-radiometer',
    label: 'UV Radiometer / UV-A Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: 'mW/cm²',
    points: pts('mW/cm²', [0.5, 1, 5, 10, 20, 50]),
    typeB: tb('mW/cm²', 0.03, 0.01, [
      { source: 'Calibrated UV reference source / standard radiometer (k=2)', value: 0.03, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'mW/cm²' },
      { source: 'Spectral mismatch of UUC detector vs. reference', value: 0.04, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mW/cm²' },
      { source: 'Source warm-up stability / drift', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mW/cm²' },
      { source: 'Detector positioning / distance', value: 0.02, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mW/cm²' },
    ]),
    units: ['mW/cm²'],
    procedureText:
      'Stabilise a UV source (UV-A/UV-C) in the appropriate band. Place the UUC detector and a calibrated reference radiometer at the same calibration plane (substitution or simultaneous method). Record UUC irradiance vs. reference at each level after source warm-up. Account for spectral mismatch between the UUC and reference detector spectral responsivity. Compute error and combined uncertainty.',
    nablReference: 'NABL 122 / CIE / IEC 62471 measurement practice',
    referenceStandard: 'Calibrated UV reference radiometer + stable UV-A/UV-C source (traceable spectral irradiance)',
  },
  {
    id: 'op-optical-power-meter',
    label: 'Optical Power Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: 'dBm',
    points: pts('dBm', [-50, -30, -20, -10, 0, 3]),
    typeB: tb('dBm', 0.05, 0.01, [
      { source: 'Reference standard power meter certificate (k=2)', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dBm' },
      { source: 'Source wavelength stability / spectral width', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dBm' },
      { source: 'Connector / coupling repeatability', value: 0.04, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dBm' },
      { source: 'Linearity / drift of source', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dBm' },
    ]),
    units: ['dBm', 'mW', 'µW'],
    procedureText:
      'At the standard wavelengths (e.g. 850, 1310, 1550 nm) set a stabilised laser source. Measure power with a calibrated reference power meter, then with the UUC (substitution method) at each level across the dynamic range. Record UUC vs. reference; compute error and uncertainty including connector/coupling repeatability and source wavelength/linearity contributions.',
    nablReference: 'NABL 122 / IEC 61315 / IEC 61300-3-7',
    referenceStandard: 'Calibrated reference optical power meter + stabilised laser source (traceable optical power standard)',
  },
  {
    id: 'op-fiber-optic-power-meter',
    label: 'Fiber Optic Power Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: 'dBm',
    points: pts('dBm', [-60, -40, -30, -20, -10, 0]),
    typeB: tb('dBm', 0.05, 0.01, [
      { source: 'Reference fiber-optic power standard certificate (k=2)', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'dBm' },
      { source: 'Fiber connector mating repeatability', value: 0.05, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dBm' },
      { source: 'Wavelength setting / source spectral width', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dBm' },
      { source: 'Nonlinearity over dynamic range', value: 0.03, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'dBm' },
    ]),
    units: ['dBm', 'mW', 'µW'],
    procedureText:
      'Using a stabilised fiber-coupled laser source at standard wavelengths (850/1300/1310/1550 nm), perform substitution calibration: measure with the reference meter, then connect the UUC through a calibrated patch cord. Record UUC vs. reference across the dynamic range; evaluate linearity. Compute error and uncertainty dominated by connector mating repeatability and reference certificate.',
    nablReference: 'NABL 122 / IEC 61315 / IEC 61746',
    referenceStandard: 'Calibrated fiber-optic reference power meter + stabilised fiber-coupled laser source',
  },
  {
    id: 'op-gloss-meter',
    label: 'Gloss Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: 'GU',
    points: pts('GU', [0, 10, 20, 50, 80, 95]),
    typeB: tb('GU', 0.3, 0.1, [
      { source: 'Certified gloss value of reference standard tile (k=2)', value: 0.3, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'GU' },
      { source: 'Tile positioning / aperture repeatability', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'GU' },
      { source: 'Source / detector drift of UUC', value: 0.2, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'GU' },
    ]),
    units: ['GU'],
    procedureText:
      'Set the geometry (20°, 60° and/or 85°). Calibrate/zero using the black glass primary standard, then measure certified gloss reference tiles spanning the range. Record UUC gloss units vs. certificate at each geometry; take repeat readings. Compute error and uncertainty against the certified tile values.',
    nablReference: 'NABL 122 / ISO 2813 / ASTM D523',
    referenceStandard: 'Certified gloss reference tiles (high/mid/low gloss) traceable to a national standard',
  },
  {
    id: 'op-haze-meter',
    label: 'Haze Meter',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: '%',
    points: pts('%', [0, 5, 10, 20, 30, 50]),
    typeB: tb('%', 0.2, 0.1, [
      { source: 'Certified haze value of reference standard (k=2)', value: 0.2, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '%' },
      { source: 'Integrating-sphere / detector linearity', value: 0.15, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%' },
      { source: 'Repeatability of UUC', value: 0.1, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '%' },
    ]),
    units: ['%', '%T'],
    procedureText:
      'Verify the 100 % and 0 % (open beam and light-trap) photometric references. Measure certified haze standards (and total transmittance standards) using the integrating-sphere geometry per ASTM D1003. Record UUC haze % vs. certificate; take repeat readings and compute error and uncertainty.',
    nablReference: 'NABL 122 / ASTM D1003 / ISO 14782',
    referenceStandard: 'Certified haze and transmittance reference standards',
  },
  {
    id: 'op-microscope-magnification',
    label: 'Microscope (Magnification Verification)',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: 'mm',
    points: pts('mm', [0.01, 0.05, 0.1, 0.5, 1.0]),
    typeB: tb('mm', 0.0005, 0.0001, [
      { source: 'Certified line spacing of stage micrometer (k=2)', value: 0.0005, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'mm' },
      { source: 'Reading / edge-setting repeatability on graticule', value: 0.0008, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
      { source: 'Focus / parallax (cosine) error', value: 0.0005, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'mm' },
    ]),
    units: ['mm', 'µm'],
    procedureText:
      'Place a certified stage micrometer (or line-scale standard) on the stage. For each objective/eyepiece combination, measure the apparent length of a certified interval against the eyepiece graticule or digital scale, and compute the magnification factor and scale error. Verify linearity across the field. Repeat readings; compute error vs. certified spacing and uncertainty.',
    nablReference: 'NABL 122 / NABL 121 dimensional good-practice (stage micrometer method)',
    referenceStandard: 'Certified stage micrometer / line-scale standard (traceable to length)',
  },
  {
    id: 'op-theodolite-optical-angle',
    label: 'Telescope / Theodolite (Optical Angle)',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_RADPOW,
    unit: '°',
    points: pts('°', [0, 30, 60, 90, 180, 270, 360]),
    typeB: tb('°', 0.0003, 0.0003, [
      { source: 'Certified angle of polygon / autocollimator reference (k=2)', value: 0.0003, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '°' },
      { source: 'Pointing / sighting repeatability', value: 0.0006, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°' },
      { source: 'Levelling / collimation residual error', value: 0.0004, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: '°' },
    ]),
    units: ['°', 'arcsec'],
    procedureText:
      'Level and centre the instrument. Using a calibrated optical polygon with an autocollimator (or a precision index/angle table), sight successive certified angular positions on both faces (face-left/face-right) to eliminate collimation error. Record indicated vs. certified angle around the circle; compute error and uncertainty including pointing repeatability and levelling residual.',
    nablReference: 'NABL 122 / NABL 121 angle good-practice (polygon + autocollimator)',
    referenceStandard: 'Calibrated optical polygon + autocollimator / precision index table',
  },
  {
    id: 'op-flame-photometer',
    label: 'Flame Photometer',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_SPECTRO,
    unit: 'ppm',
    points: pts('ppm', [1, 5, 10, 50, 100]),
    typeB: tb('ppm', 0.5, 0.1, [
      { source: 'Certified concentration of element standard solution (k=2)', value: 0.5, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'ppm' },
      { source: 'Flame / aspiration stability and drift', value: 0.4, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
      { source: 'Repeatability of emission reading', value: 0.3, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'ppm' },
    ]),
    units: ['ppm', 'mg/L'],
    procedureText:
      'NOTE: also an analytical instrument; calibrated here for optical emission response. Aspirate certified element standard solutions (e.g. Na, K, Li, Ca) of known concentration through the calibrated optical/emission filter channels. Build/verify the calibration curve; record indicated concentration vs. certified value at each level after flame stabilisation. Compute error and uncertainty including aspiration/flame stability.',
    nablReference: 'NABL 122 / NABL 105 chemical (cross-discipline analytical)',
    referenceStandard: 'Certified element (Na/K/Li/Ca) standard reference solutions',
  },
  {
    id: 'op-densitometer',
    label: 'Densitometer',
    discipline: 'Optical & Photometry',
    subDiscipline: SD_SPECTRO,
    unit: 'D',
    points: pts('D', [0.05, 0.5, 1.0, 2.0, 3.0, 4.0]),
    typeB: tb('D', 0.01, 0.01, [
      { source: 'Certified optical density of reference step wedge (k=2)', value: 0.01, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'D' },
      { source: 'Source / detector drift of UUC', value: 0.008, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'D' },
      { source: 'Aperture positioning repeatability', value: 0.006, distribution: 'rectangular', divisor: R3, sensitivity: 1, unit: 'D' },
    ]),
    units: ['D'],
    procedureText:
      'Zero on the clear/base reference. Measure each step of a certified optical-density step-wedge (transmission or reflection as applicable). Record indicated density (D) vs. certified value across the range; take repeat readings. Compute error and uncertainty against the certified step-wedge values.',
    nablReference: 'NABL 122 / ISO 5-2, ISO 5-3 (optical density)',
    referenceStandard: 'Certified optical-density step wedge (transmission / reflection)',
  },
];
