// Local, exact arithmetic for questions like "7x8", "12 ÷ 4", "3/4 + 1/4".
// The result is computed in code (free, instant, always right) and handed to the model as a verified fact,
// so a small model can explain the idea without ever getting the number wrong.

type Frac = { n: number; d: number };

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const simplify = (f: Frac): Frac => {
  const g = gcd(f.n, f.d) || 1;
  const s = f.d < 0 ? -1 : 1;
  return { n: (s * f.n) / g, d: (s * f.d) / g };
};
const show = (f: Frac) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

function parseTerm(t: string): Frac | null {
  const m = t.match(/^(\d{1,6})(?:\s*\/\s*(\d{1,6}))?$/);
  if (!m) return null;
  const d = m[2] ? Number(m[2]) : 1;
  return d === 0 ? null : { n: Number(m[1]), d };
}

const OPS: Record<string, string> = { "+": "+", "-": "-", "−": "-", x: "×", X: "×", "×": "×", "*": "×", "÷": "÷", ":": "÷" };

/** Returns e.g. "7 × 8 = 56" or "3/4 + 1/4 = 1", or null when the text holds no simple calculation. */
export function verifiedCalculation(text: string): string | null {
  // a op b, where a and b are whole numbers or fractions. "/" alone is a fraction, not a division.
  const re = /(\d{1,6}(?:\s*\/\s*\d{1,6})?)\s*([+\-−xX×*÷:])\s*(\d{1,6}(?:\s*\/\s*\d{1,6})?)/;
  const m = text.match(re);
  if (!m) return null;
  const a = parseTerm(m[1].replace(/\s+/g, ""));
  const b = parseTerm(m[3].replace(/\s+/g, ""));
  const op = OPS[m[2]];
  if (!a || !b || !op) return null;
  // Avoid reading times ("10:30") or dates as sums.
  if (op === "÷" && m[2] === ":" && a.d === 1 && b.d === 1 && m[3].length === 2 && Number(m[3]) < 60 && /\d:\d\d/.test(m[0])) return null;

  let r: Frac;
  if (op === "+") r = { n: a.n * b.d + b.n * a.d, d: a.d * b.d };
  else if (op === "-") r = { n: a.n * b.d - b.n * a.d, d: a.d * b.d };
  else if (op === "×") r = { n: a.n * b.n, d: a.d * b.d };
  else {
    if (b.n === 0) return null;
    r = { n: a.n * b.d, d: a.d * b.n };
  }
  r = simplify(r);
  // Whole-number division with a remainder: say it the way grade 3–6 learns it.
  if (op === "÷" && a.d === 1 && b.d === 1 && r.d !== 1) return `${a.n} ÷ ${b.n} = ${Math.floor(a.n / b.n)} remainder ${a.n % b.n}`;
  return `${show(a)} ${op} ${show(b)} = ${show(r)}`;
}

export type ParsedCalc =
  | { kind: "op"; a: Frac; op: "+" | "-" | "×" | "÷"; b: Frac; r: Frac }
  | { kind: "fraction"; f: Frac };

/** Structured version for the visual cards (client-safe: no server imports). */
export function parseCalculation(text: string): ParsedCalc | null {
  const re = /(\d{1,6}(?:\s*\/\s*\d{1,6})?)\s*([+\-−xX×*÷:])\s*(\d{1,6}(?:\s*\/\s*\d{1,6})?)/;
  const m = text.match(re);
  if (m && !/\d:\d\d\b/.test(m[0])) {
    const a = parseTerm(m[1].replace(/\s+/g, ""));
    const b = parseTerm(m[3].replace(/\s+/g, ""));
    const op = OPS[m[2]] as "+" | "-" | "×" | "÷" | undefined;
    if (a && b && op) {
      let r: Frac;
      if (op === "+") r = { n: a.n * b.d + b.n * a.d, d: a.d * b.d };
      else if (op === "-") r = { n: a.n * b.d - b.n * a.d, d: a.d * b.d };
      else if (op === "×") r = { n: a.n * b.n, d: a.d * b.d };
      else {
        if (b.n === 0) return null;
        r = { n: a.n * b.d, d: a.d * b.n };
      }
      return { kind: "op", a, op, b, r: simplify(r) };
    }
  }
  const f = text.match(/(?<![\d/])(\d{1,2})\s*\/\s*(\d{1,2})(?![\d/])/);
  if (f) {
    const n = Number(f[1]);
    const d = Number(f[2]);
    if (d > 0) return { kind: "fraction", f: { n, d } };
  }
  return null;
}
