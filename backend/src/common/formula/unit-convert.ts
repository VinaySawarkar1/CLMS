/**
 * CLMS Unit Conversion (Module 13)
 * --------------------------------
 * Config-driven conversion between units of the same quantity. Each unit is
 * expressed as a factor to a quantity's base unit; temperature uses explicit
 * offset formulas. Add units here rather than hardcoding conversions elsewhere.
 */

type LinearUnit = { factor: number; aliases?: string[] };

const QUANTITIES: Record<string, Record<string, LinearUnit>> = {
  length: {
    m: { factor: 1, aliases: ['metre', 'meter'] },
    cm: { factor: 0.01 },
    mm: { factor: 0.001 },
    um: { factor: 1e-6, aliases: ['µm', 'micron'] },
    km: { factor: 1000 },
    inch: { factor: 0.0254, aliases: ['in', '"'] },
    ft: { factor: 0.3048, aliases: ['foot', 'feet'] },
  },
  mass: {
    kg: { factor: 1 },
    g: { factor: 0.001 },
    mg: { factor: 1e-6 },
    lb: { factor: 0.45359237, aliases: ['lbs', 'pound'] },
  },
  pressure: {
    pa: { factor: 1 },
    kpa: { factor: 1000 },
    bar: { factor: 1e5 },
    psi: { factor: 6894.757 },
    mbar: { factor: 100 },
    atm: { factor: 101325 },
  },
  time: {
    s: { factor: 1, aliases: ['sec'] },
    min: { factor: 60 },
    h: { factor: 3600, aliases: ['hr', 'hour'] },
  },
};

/** Temperature handled separately (affine, not purely multiplicative). */
const TEMP = new Set(['c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin']);

function normalize(u: string): string {
  return u.trim().toLowerCase();
}

function resolveLinear(unit: string): { quantity: string; factor: number } | null {
  const u = normalize(unit);
  for (const [quantity, units] of Object.entries(QUANTITIES)) {
    for (const [key, def] of Object.entries(units)) {
      if (key === u || def.aliases?.map(normalize).includes(u)) {
        return { quantity, factor: def.factor };
      }
    }
  }
  return null;
}

function toKelvin(value: number, unit: string): number {
  const u = normalize(unit);
  if (u === 'c' || u === 'celsius') return value + 273.15;
  if (u === 'f' || u === 'fahrenheit') return (value - 32) * (5 / 9) + 273.15;
  return value; // already Kelvin
}

function fromKelvin(value: number, unit: string): number {
  const u = normalize(unit);
  if (u === 'c' || u === 'celsius') return value - 273.15;
  if (u === 'f' || u === 'fahrenheit') return (value - 273.15) * (9 / 5) + 32;
  return value;
}

/** Convert `value` from one unit to another within the same quantity. */
export function convert(value: number, from: string, to: string): number {
  const f = normalize(from);
  const t = normalize(to);
  if (f === t) return value;

  if (TEMP.has(f) || TEMP.has(t)) {
    if (!(TEMP.has(f) && TEMP.has(t))) {
      throw new Error(`Incompatible units: ${from} → ${to}`);
    }
    return fromKelvin(toKelvin(value, from), to);
  }

  const a = resolveLinear(from);
  const b = resolveLinear(to);
  if (!a || !b) throw new Error(`Unknown unit: ${!a ? from : to}`);
  if (a.quantity !== b.quantity) throw new Error(`Incompatible units: ${from} (${a.quantity}) → ${to} (${b.quantity})`);
  return (value * a.factor) / b.factor;
}

/** List supported units grouped by quantity (for UI pickers). */
export function supportedUnits(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [quantity, units] of Object.entries(QUANTITIES)) out[quantity] = Object.keys(units);
  out.temperature = ['C', 'F', 'K'];
  return out;
}
