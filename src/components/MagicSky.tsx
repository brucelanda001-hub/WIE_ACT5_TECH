// The living background of the child's space: a soft purple-blue aurora that drifts, and little stars,
// dots and maths signs that twinkle and float up. It sits behind everything (aria-hidden, no pointer events),
// keeps text contrast high, and stops moving when the device asks for reduced motion (global CSS rule).
// Positions are fixed (no randomness) so the server and the browser draw the same thing.

const BITS: { x: number; y: number; s: number; d: number; t: number; c: string; k: "star" | "dot" | "plus" | "math" }[] = [
  { x: 6, y: 18, s: 18, d: 0, t: 14, c: "#a78bfa", k: "star" },
  { x: 14, y: 62, s: 10, d: 3, t: 18, c: "#60a5fa", k: "dot" },
  { x: 22, y: 34, s: 14, d: 6, t: 16, c: "#f472b6", k: "plus" },
  { x: 31, y: 80, s: 16, d: 1, t: 20, c: "#f5b700", k: "star" },
  { x: 38, y: 12, s: 12, d: 8, t: 17, c: "#c084fc", k: "math" },
  { x: 47, y: 52, s: 9, d: 4, t: 15, c: "#818cf8", k: "dot" },
  { x: 55, y: 88, s: 14, d: 2, t: 19, c: "#a78bfa", k: "plus" },
  { x: 63, y: 24, s: 20, d: 5, t: 22, c: "#f5b700", k: "star" },
  { x: 71, y: 66, s: 12, d: 7, t: 16, c: "#f472b6", k: "math" },
  { x: 78, y: 40, s: 10, d: 1, t: 18, c: "#60a5fa", k: "dot" },
  { x: 86, y: 14, s: 15, d: 6, t: 21, c: "#c084fc", k: "plus" },
  { x: 92, y: 74, s: 18, d: 3, t: 17, c: "#a78bfa", k: "star" },
  { x: 97, y: 46, s: 9, d: 9, t: 15, c: "#f5b700", k: "dot" },
  { x: 3, y: 92, s: 12, d: 5, t: 19, c: "#818cf8", k: "math" },
  { x: 50, y: 6, s: 10, d: 10, t: 20, c: "#f472b6", k: "star" },
  { x: 84, y: 94, s: 11, d: 2, t: 16, c: "#60a5fa", k: "plus" },
];

const MATH = ["+", "×", "÷", "="];

function Bit({ k, c, i }: { k: string; c: string; i: number }) {
  if (k === "star")
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full" aria-hidden>
        <path d="M16 2c1.2 7.4 4.6 10.8 12 12-7.4 1.2-10.8 4.6-12 12-1.2-7.4-4.6-10.8-12-12 7.4-1.2 10.8-4.6 12-12z" fill={c} />
      </svg>
    );
  if (k === "dot") return <span className="block w-full h-full rounded-full" style={{ background: c }} />;
  if (k === "plus")
    return (
      <svg viewBox="0 0 20 20" className="w-full h-full" aria-hidden>
        <path d="M10 2v16M2 10h16" stroke={c} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  return (
    <span className="grid place-items-center w-full h-full font-extrabold leading-none" style={{ color: c, fontSize: "1.6em" }}>
      {MATH[i % MATH.length]}
    </span>
  );
}

export function MagicSky() {
  return (
    <div aria-hidden className="magic-sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* aurora: three soft glows drifting slowly */}
      <div className="sky-blob sky-blob-1" />
      <div className="sky-blob sky-blob-2" />
      <div className="sky-blob sky-blob-3" />
      <div className="sky-blob sky-blob-4" />
      {/* twinkling, floating little things */}
      {BITS.map((b, i) => (
        <span
          key={i}
          className="sky-bit absolute"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.s * 1.5,
            height: b.s * 1.5,
            fontSize: b.s * 0.9,
            animationDelay: `-${b.d}s, -${b.d * 0.7}s`,
            animationDuration: `${b.t}s, ${3 + (i % 4)}s`,
          }}
        >
          <Bit k={b.k} c={b.c} i={i} />
        </span>
      ))}
    </div>
  );
}
