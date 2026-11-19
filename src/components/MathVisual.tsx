"use client";
// "See it" cards: a picture of the calculation in the child's question (pizza slices, rows of dots, dates shared
// into groups). Drawn locally from the exact parsed numbers: no model call, never wrong. Inspired by the
// manipulatives that make visual maths tutors work for ages 8–11.
import { parseCalculation, type ParsedCalc } from "@/lib/ai/mathcheck";
import { t, type UiLang } from "@/lib/i18n";

type Frac = { n: number; d: number };

const INK = "var(--color-ink)";
const MARKER = "var(--color-marker)";
const EMPTY = "#ffffff";
const LINE = "var(--color-night)";

const fill = (tpl: string, vars: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const showFrac = (f: Frac) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

/** One pie cut into d equal slices; the first `a` slices in ink, the next `b` in marker. */
export function Pie({ d, a, b = 0, size = 92 }: { d: number; a: number; b?: number; size?: number }) {
  const r = size / 2 - 3;
  const c = size / 2;
  const slice = (i: number) => {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`;
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden className="shrink-0">
      {d === 1 ? (
        <circle cx={c} cy={c} r={r} fill={a ? INK : b ? MARKER : EMPTY} stroke={LINE} strokeWidth={2} />
      ) : (
        Array.from({ length: d }, (_, i) => (
          <path
            key={i}
            d={slice(i)}
            fill={i < a ? INK : i < a + b ? MARKER : EMPTY}
            stroke={LINE}
            strokeWidth={2}
            className="see-pop"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))
      )}
    </svg>
  );
}

/** A fraction drawn as one or more pies (5/4 = one full pie + 1/4). */
function FracPies({ f, second }: { f: Frac; second?: Frac }) {
  const total = f.n + (second?.n ?? 0);
  const pies = Math.max(1, Math.ceil(total / f.d));
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: pies }, (_, p) => {
        const start = p * f.d;
        const a = Math.max(0, Math.min(f.d, f.n - start));
        const b = second ? Math.max(0, Math.min(f.d - a, total - start - a)) : 0;
        return <Pie key={p} d={f.d} a={a} b={b} />;
      })}
    </div>
  );
}

const drawable = (f: Frac) => f.d >= 1 && f.d <= 12 && f.n >= 0 && f.n <= f.d * 3;

export function Dots({ count, color, cols }: { count: number; color: string; cols: number }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 14px)` }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="see-pop w-3.5 h-3.5 rounded-full border-2 border-night" style={{ background: color, animationDelay: `${i * 18}ms` }} />
      ))}
    </div>
  );
}

function body(c: ParsedCalc, lang: UiLang): { picture: React.ReactNode; caption: string } | null {
  if (c.kind === "fraction") {
    if (!drawable(c.f) || c.f.d === 1) return null;
    return { picture: <FracPies f={c.f} />, caption: fill(t(lang, "v_slices"), { n: c.f.n, d: c.f.d }) };
  }
  const { a, b, op, r } = c;
  const whole = a.d === 1 && b.d === 1;

  if (whole && op === "×" && a.n >= 1 && b.n >= 1 && a.n <= 12 && b.n <= 12) {
    return {
      picture: (
        <div className="flex flex-col gap-1">
          {Array.from({ length: a.n }, (_, row) => (
            <Dots key={row} count={b.n} cols={b.n} color={row % 2 ? MARKER : INK} />
          ))}
        </div>
      ),
      caption: fill(t(lang, "v_rows"), { a: a.n, b: b.n, r: a.n * b.n }),
    };
  }

  if (whole && op === "÷" && b.n >= 2 && b.n <= 10 && a.n >= b.n && a.n <= 60) {
    const q = Math.floor(a.n / b.n);
    const left = a.n % b.n;
    return {
      picture: (
        <div className="flex flex-wrap gap-2 items-start">
          {Array.from({ length: b.n }, (_, g) => (
            <div key={g} className="rounded-xl border-2 border-night bg-white p-1.5">
              <Dots count={q} cols={Math.min(q, 5)} color={INK} />
            </div>
          ))}
          {left > 0 && (
            <div className="rounded-xl border-2 border-dashed border-margin bg-margin-soft p-1.5">
              <Dots count={left} cols={Math.min(left, 5)} color={MARKER} />
            </div>
          )}
        </div>
      ),
      caption: fill(t(lang, left ? "v_groups_left" : "v_groups"), { a: a.n, b: b.n, q, left }),
    };
  }

  // Fractions with the same denominator: one picture, two colours.
  if (!whole && (op === "+" || op === "-") && a.d === b.d && drawable(a) && drawable(b)) {
    if (op === "+") {
      return {
        picture: <FracPies f={a} second={b} />,
        caption: fill(t(lang, "v_add_same"), { a: showFrac(a), b: showFrac(b), sum: `${a.n + b.n}/${a.d}`, r: showFrac(r) }),
      };
    }
    if (a.n >= b.n) {
      return {
        picture: <FracPies f={{ n: a.n - b.n, d: a.d }} second={{ n: b.n, d: a.d }} />,
        caption: fill(t(lang, "v_sub_same"), { a: showFrac(a), b: showFrac(b), r: showFrac(r) }),
      };
    }
  }

  // Other fraction sums: a + b = r, each as pies.
  if (!whole && (op === "+" || op === "-") && drawable(a) && drawable(b) && r.n >= 0 && drawable(r)) {
    return {
      picture: (
        <div className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-night" dir="ltr">
          <FracPies f={a} />
          <span>{op}</span>
          <FracPies f={b} />
          <span>=</span>
          <FracPies f={r} />
        </div>
      ),
      caption: `${showFrac(a)} ${op} ${showFrac(b)} = ${showFrac(r)}`,
    };
  }
  return null;
}

/** Renders nothing when the question holds no drawable calculation. */
export function MathVisual({ question, lang }: { question: string; lang: UiLang }) {
  const parsed = parseCalculation(question);
  if (!parsed) return null;
  const card = body(parsed, lang);
  if (!card) return null;
  return (
    <figure role="img" aria-label={card.caption} className="mt-3 rounded-[var(--radius-card)] bg-white border-2 border-night shadow-[3px_3px_0_var(--color-night)] p-3">
      <figcaption className="mb-2 text-sm font-extrabold text-ink" dir="auto">
        👀 {t(lang, "v_title")}
      </figcaption>
      <div dir="ltr" className="overflow-x-auto no-scrollbar">{card.picture}</div>
      <p className="mt-2 text-[17px] font-bold text-night" dir="auto">{card.caption}</p>
    </figure>
  );
}
