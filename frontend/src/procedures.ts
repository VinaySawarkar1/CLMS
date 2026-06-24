// Calibration procedure templates — per instrument type.
//
// Each template defines the measurement points (with units) for the datasheet
// and the typical Type-B uncertainty contributors for that instrument. These
// are illustrative engineering defaults to speed up data entry; the actual
// values (master uncertainty, resolution, CMC) must be set per the lab's
// accredited scope and the reference standard's calibration certificate.
//
// Add more instruments/disciplines by extending this list.

export interface ProcedurePoint {
  label: string;
  nominal: number;
}

export interface ProcedureTypeB {
  source: string;
  value: number;
  distribution: 'normal' | 'rectangular' | 'triangular' | 'u-shaped';
  divisor: number;
  sensitivity: number;
  unit: string;
}

export interface Procedure {
  id: string;
  label: string;
  discipline: string;
  unit: string;
  points: ProcedurePoint[];
  typeB: ProcedureTypeB[];
}

export const PROCEDURES: Procedure[] = [
  {
    id: 'vernier-caliper',
    label: 'Vernier / Digital Caliper',
    discipline: 'Dimension',
    unit: 'mm',
    points: [
      { label: '0 mm', nominal: 0 },
      { label: '25 mm', nominal: 25 },
      { label: '50 mm', nominal: 50 },
      { label: '100 mm', nominal: 100 },
      { label: '150 mm', nominal: 150 },
    ],
    typeB: [
      { source: 'Master gauge block uncertainty', value: 0.0005, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'mm' },
      { source: 'Resolution of UUC', value: 0.005, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'mm' },
      { source: 'Thermal effect', value: 0.001, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'mm' },
    ],
  },
  {
    id: 'pressure-gauge',
    label: 'Pressure Gauge',
    discipline: 'Pressure',
    unit: 'bar',
    points: [
      { label: '0 bar', nominal: 0 },
      { label: '5 bar', nominal: 5 },
      { label: '10 bar', nominal: 10 },
      { label: '15 bar', nominal: 15 },
      { label: '20 bar', nominal: 20 },
      { label: '25 bar', nominal: 25 },
    ],
    typeB: [
      { source: 'Master pressure standard uncertainty', value: 0.05, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'bar' },
      { source: 'Resolution of UUC', value: 0.1, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'bar' },
      { source: 'Hysteresis', value: 0.05, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'bar' },
    ],
  },
  {
    id: 'digital-thermometer',
    label: 'Digital Thermometer / RTD',
    discipline: 'Temperature',
    unit: '°C',
    points: [
      { label: '0 °C', nominal: 0 },
      { label: '50 °C', nominal: 50 },
      { label: '100 °C', nominal: 100 },
    ],
    typeB: [
      { source: 'Reference thermometer uncertainty', value: 0.1, distribution: 'normal', divisor: 2, sensitivity: 1, unit: '°C' },
      { source: 'Bath uniformity / stability', value: 0.05, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: '°C' },
      { source: 'Resolution of UUC', value: 0.1, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: '°C' },
    ],
  },
  {
    id: 'weighing-balance',
    label: 'Weighing Balance',
    discipline: 'Mass',
    unit: 'g',
    points: [
      { label: '0 g', nominal: 0 },
      { label: '100 g', nominal: 100 },
      { label: '200 g', nominal: 200 },
      { label: '500 g', nominal: 500 },
      { label: '1000 g', nominal: 1000 },
    ],
    typeB: [
      { source: 'Reference weight uncertainty (E2/F1)', value: 0.001, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'g' },
      { source: 'Readability / resolution', value: 0.001, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'g' },
      { source: 'Air buoyancy / eccentricity', value: 0.0005, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'g' },
    ],
  },
  {
    id: 'dmm-dcv',
    label: 'Digital Multimeter — DC Voltage',
    discipline: 'Electrical',
    unit: 'V',
    points: [
      { label: '1 V', nominal: 1 },
      { label: '5 V', nominal: 5 },
      { label: '10 V', nominal: 10 },
    ],
    typeB: [
      { source: 'Reference source uncertainty', value: 0.0005, distribution: 'normal', divisor: 2, sensitivity: 1, unit: 'V' },
      { source: 'Resolution of UUC', value: 0.0005, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: 'V' },
    ],
  },
];

export const findProcedure = (idOrLabel?: string) =>
  PROCEDURES.find((p) => p.id === idOrLabel || p.label === idOrLabel);
