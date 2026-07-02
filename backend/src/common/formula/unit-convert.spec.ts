import { convert, supportedUnits } from './unit-convert';

describe('UnitConvert', () => {
  it('converts within length', () => {
    expect(convert(1, 'm', 'mm')).toBeCloseTo(1000, 6);
    expect(convert(25.4, 'mm', 'inch')).toBeCloseTo(1, 6);
    expect(convert(1, 'km', 'm')).toBeCloseTo(1000, 6);
  });

  it('converts within pressure', () => {
    expect(convert(1, 'bar', 'kpa')).toBeCloseTo(100, 6);
    expect(convert(1, 'atm', 'pa')).toBeCloseTo(101325, 3);
  });

  it('converts temperature (affine)', () => {
    expect(convert(0, 'C', 'K')).toBeCloseTo(273.15, 6);
    expect(convert(32, 'F', 'C')).toBeCloseTo(0, 6);
    expect(convert(100, 'C', 'F')).toBeCloseTo(212, 6);
  });

  it('returns the same value for identical units', () => {
    expect(convert(5, 'mm', 'mm')).toBe(5);
  });

  it('rejects incompatible units', () => {
    expect(() => convert(1, 'm', 'kg')).toThrow();
    expect(() => convert(1, 'C', 'mm')).toThrow();
  });

  it('exposes supported units', () => {
    const u = supportedUnits();
    expect(u.length).toContain('mm');
    expect(u.temperature).toContain('C');
  });
});
