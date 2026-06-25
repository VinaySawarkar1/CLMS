import { evaluate } from './formula-engine';

describe('FormulaEngine', () => {
  it('evaluates basic arithmetic with precedence', () => {
    expect(evaluate('2 + 3 * 4')).toBe(14);
    expect(evaluate('(2 + 3) * 4')).toBe(20);
    expect(evaluate('2 ^ 3 ^ 2')).toBe(512); // right-associative
  });

  it('handles unary minus', () => {
    expect(evaluate('-5 + 2')).toBe(-3);
    expect(evaluate('3 - -2')).toBe(5);
  });

  it('resolves variables', () => {
    expect(evaluate('observed - standard', { observed: 10.2, standard: 10 })).toBeCloseTo(0.2);
  });

  it('supports functions', () => {
    expect(evaluate('SQRT(16)')).toBe(4);
    expect(evaluate('ABS(-7)')).toBe(7);
    expect(evaluate('ROUND(3.14159, 2)')).toBe(3.14);
    expect(evaluate('AVERAGE(2, 4, 6)')).toBe(4);
    expect(evaluate('SUM(1, 2, 3, 4)')).toBe(10);
    expect(evaluate('MAX(3, 9, 1)')).toBe(9);
    expect(evaluate('MIN(3, 9, 1)')).toBe(1);
    expect(evaluate('IF(1, 10, 20)')).toBe(10);
    expect(evaluate('IF(0, 10, 20)')).toBe(20);
  });

  it('evaluates a realistic correction formula', () => {
    // correction = standard - average(observed readings)
    const ctx = { std: 100, r1: 99.8, r2: 100.1, r3: 99.9 };
    expect(evaluate('ROUND(std - AVERAGE(r1, r2, r3), 3)', ctx)).toBeCloseTo(0.067, 3);
  });

  it('throws on unknown variable and function', () => {
    expect(() => evaluate('foo + 1')).toThrow(/Unknown variable/);
    expect(() => evaluate('NOPE(1)')).toThrow(/Unknown function/);
  });
});
