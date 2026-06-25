import { computeUncertainty, divisorFor } from './uncertainty-engine';

describe('UncertaintyEngine', () => {
  it('derives standard divisors per distribution', () => {
    expect(divisorFor('rectangular')).toBeCloseTo(Math.sqrt(3));
    expect(divisorFor('triangular')).toBeCloseTo(Math.sqrt(6));
    expect(divisorFor('normal')).toBe(2);
  });

  it('combines contributions in quadrature', () => {
    const r = computeUncertainty([
      { source: 'repeatability', type: 'A', value: 0.03, divisor: 1 },
      { source: 'resolution', type: 'B', value: 0.04, divisor: 1 },
    ]);
    // sqrt(0.03^2 + 0.04^2) = 0.05
    expect(r.combinedUncertainty).toBeCloseTo(0.05, 6);
  });

  it('applies coverage factor for expanded uncertainty', () => {
    const r = computeUncertainty([
      { source: 'master', type: 'B', value: 0.1, distribution: 'normal' },
    ]);
    // u = 0.1/2 = 0.05 ; infinite dof -> k=2 ; U=0.1
    expect(r.combinedUncertainty).toBeCloseTo(0.05, 6);
    expect(r.coverageFactor).toBe(2);
    expect(r.expandedUncertainty).toBeCloseTo(0.1, 6);
  });

  it('raises k for low effective degrees of freedom', () => {
    const r = computeUncertainty([
      { source: 'repeatability', type: 'A', value: 0.1, divisor: 1, degreesFreedom: 4 },
    ]);
    expect(r.effectiveDegreesFreedom).toBeCloseTo(4, 6);
    expect(r.coverageFactor).toBeGreaterThan(2);
  });
});
