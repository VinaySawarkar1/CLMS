/**
 * Calibration calculation engine — pure functions for the standard metrics
 * derived from a set of repeat readings at a single measurement point:
 * mean, sample standard deviation, repeatability (range), Type-A uncertainty,
 * correction, error, drift and the Pass/Fail decision against an MPE.
 *
 * Kept dependency-free so it can be unit tested in isolation and reused by the
 * datasheet service.
 */

export interface PointInput {
  readings: number[];
  standardValue: number;
  /** Observed value for the same point in the previous calibration, if any. */
  previousObserved?: number | null;
  /** Maximum permissible error (absolute). When omitted, Pass/Fail is null. */
  mpe?: number | null;
}

export interface PointResult {
  mean: number | null;
  stdDev: number;
  repeatability: number;
  uA: number;
  correction: number | null;
  error: number | null;
  drift: number | null;
  result: 'PASS' | 'FAIL' | null;
}

/** Sample (n−1) standard deviation. Returns 0 for fewer than two values. */
export function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Compute all per-point calibration metrics from raw readings. */
export function computePoint(input: PointInput): PointResult {
  const readings = (input.readings ?? []).filter((n) => Number.isFinite(n));

  let mean: number | null = null;
  let stdDev = 0;
  let repeatability = 0;
  let uA = 0;

  if (readings.length) {
    mean = readings.reduce((a, b) => a + b, 0) / readings.length;
    repeatability = Math.max(...readings) - Math.min(...readings);
    stdDev = sampleStdDev(readings);
    uA = stdDev / Math.sqrt(readings.length);
  }

  const correction = mean == null ? null : input.standardValue - mean;
  const error = mean == null ? null : mean - input.standardValue;

  const drift =
    mean != null && input.previousObserved != null
      ? mean - input.previousObserved
      : null;

  let result: 'PASS' | 'FAIL' | null = null;
  const mpe = Number(input.mpe);
  if (error != null && Number.isFinite(mpe) && mpe > 0) {
    result = Math.abs(error) <= mpe ? 'PASS' : 'FAIL';
  }

  return { mean, stdDev, repeatability, uA, correction, error, drift, result };
}
