import { computePoint, sampleStdDev } from './calc-engine';

describe('CalcEngine', () => {
  it('computes sample standard deviation', () => {
    // values 2,4,4,4,5,5,7,9 → s = 2.13809...
    expect(sampleStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.13809, 4);
    expect(sampleStdDev([5])).toBe(0);
    expect(sampleStdDev([])).toBe(0);
  });

  it('derives mean, repeatability, correction and error', () => {
    const r = computePoint({ readings: [10.01, 10.03, 10.02], standardValue: 10 });
    expect(r.mean).toBeCloseTo(10.02, 6);
    expect(r.repeatability).toBeCloseTo(0.02, 6);
    expect(r.error).toBeCloseTo(0.02, 6);
    expect(r.correction).toBeCloseTo(-0.02, 6);
    expect(r.uA).toBeGreaterThan(0);
  });

  it('computes Type-A uncertainty as s / sqrt(n)', () => {
    const r = computePoint({ readings: [1, 1, 1, 1], standardValue: 1 });
    // identical readings → s = 0 → uA = 0
    expect(r.stdDev).toBe(0);
    expect(r.uA).toBe(0);
  });

  it('computes drift only when a previous observation exists', () => {
    expect(computePoint({ readings: [5], standardValue: 5 }).drift).toBeNull();
    const r = computePoint({ readings: [5.05], standardValue: 5, previousObserved: 5.0 });
    expect(r.drift).toBeCloseTo(0.05, 6);
  });

  it('passes when |error| <= MPE and fails otherwise', () => {
    expect(computePoint({ readings: [10.04], standardValue: 10, mpe: 0.05 }).result).toBe('PASS');
    expect(computePoint({ readings: [10.06], standardValue: 10, mpe: 0.05 }).result).toBe('FAIL');
    // No MPE → no decision
    expect(computePoint({ readings: [10.06], standardValue: 10 }).result).toBeNull();
  });

  it('returns nulls for an empty reading set', () => {
    const r = computePoint({ readings: [], standardValue: 10 });
    expect(r.mean).toBeNull();
    expect(r.error).toBeNull();
    expect(r.result).toBeNull();
  });
});
