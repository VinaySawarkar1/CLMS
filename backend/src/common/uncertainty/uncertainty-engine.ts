/**
 * CLMS Uncertainty Engine
 * -----------------------
 * Computes a measurement uncertainty budget per the GUM / ISO 17025 approach.
 *
 * Each contributor is reduced to a standard uncertainty u_i = (value / divisor) * |c_i|
 * where the divisor encodes the assumed probability distribution. Contributions
 * are combined in quadrature; the expanded uncertainty applies a coverage factor k.
 */

export type DistributionType =
  | 'normal'
  | 'rectangular'
  | 'triangular'
  | 'u-shaped';

export interface UncertaintyContributor {
  source: string;
  /** 'A' = statistical (repeatability), 'B' = other evidence. */
  type: 'A' | 'B';
  /** Raw magnitude of the contribution (in the measurand's units). */
  value: number;
  distribution?: DistributionType;
  /** Optional explicit divisor; otherwise derived from the distribution. */
  divisor?: number;
  /** Sensitivity coefficient c_i (defaults to 1). */
  sensitivity?: number;
  /** Effective degrees of freedom for this contributor. */
  degreesFreedom?: number;
  unit?: string;
}

export interface UncertaintyResult {
  contributions: Array<{
    source: string;
    standardUncertainty: number;
    sensitivity: number;
    contribution: number; // c_i * u_i
  }>;
  combinedUncertainty: number;
  effectiveDegreesFreedom: number;
  coverageFactor: number;
  expandedUncertainty: number;
  confidenceLevel: number;
}

/** Standard divisor for a given distribution. */
export function divisorFor(dist: DistributionType): number {
  switch (dist) {
    case 'normal': return 2; // assumes value given at ~95% (k=2)
    case 'rectangular': return Math.sqrt(3);
    case 'triangular': return Math.sqrt(6);
    case 'u-shaped': return Math.sqrt(2);
    default: return 1;
  }
}

function standardUncertainty(c: UncertaintyContributor): number {
  const divisor =
    c.divisor ?? (c.distribution ? divisorFor(c.distribution) : 1);
  return Math.abs(c.value) / divisor;
}

/**
 * Welch–Satterthwaite effective degrees of freedom.
 * Contributors without a finite DoF are treated as effectively infinite.
 */
function effectiveDof(
  contributors: UncertaintyContributor[],
  uc: number,
): number {
  if (uc === 0) return Infinity;
  let denom = 0;
  for (const c of contributors) {
    const v = c.degreesFreedom;
    if (!v || !isFinite(v) || v <= 0) continue;
    const ui = standardUncertainty(c) * (c.sensitivity ?? 1);
    denom += Math.pow(ui, 4) / v;
  }
  if (denom === 0) return Infinity;
  return Math.pow(uc, 4) / denom;
}

/**
 * Coverage factor k for ~95.45% confidence, approximated from the Student-t
 * distribution as a function of effective degrees of freedom.
 */
export function coverageFactor(veff: number): number {
  if (!isFinite(veff)) return 2.0;
  // Coarse t-table lookup at 95.45% two-sided.
  const table: Array<[number, number]> = [
    [1, 13.97], [2, 4.53], [3, 3.31], [4, 2.87], [5, 2.65],
    [6, 2.52], [7, 2.43], [8, 2.37], [10, 2.28], [15, 2.18],
    [20, 2.13], [30, 2.09], [50, 2.05], [100, 2.025],
  ];
  for (const [dof, k] of table) {
    if (veff <= dof) return k;
  }
  return 2.0;
}

export function computeUncertainty(
  contributors: UncertaintyContributor[],
): UncertaintyResult {
  const contributions = contributors.map((c) => {
    const u = standardUncertainty(c);
    const sensitivity = c.sensitivity ?? 1;
    return {
      source: c.source,
      standardUncertainty: u,
      sensitivity,
      contribution: u * sensitivity,
    };
  });

  const combined = Math.sqrt(
    contributions.reduce((sum, c) => sum + c.contribution ** 2, 0),
  );
  const veff = effectiveDof(contributors, combined);
  const k = coverageFactor(veff);

  return {
    contributions,
    combinedUncertainty: combined,
    effectiveDegreesFreedom: veff,
    coverageFactor: k,
    expandedUncertainty: k * combined,
    confidenceLevel: 95.45,
  };
}
