"use client";
// The playful layer of the child's page: a Nouri that reacts when tapped, sticker-style question cards,
// a picture puzzle of the day and a short confetti burst for a right answer.
// Everything here is local (no AI call), never punishes a mistake, and has no streaks or timers.
// Motion is switched off for children whose device asks for reduced motion (global rule in globals.css).
import { useEffect, useMemo, useState } from "react";
import { NovaFace } from "@/components/Brand";
import { Dots, Pie } from "@/components/MathVisual";
import { t, type UiLang } from "@/lib/i18n";

/* ---------- Confetti ---------- */

const BITS = ["⭐", "🎉", "✨", "🌟", "🍬", "💛", "🎈"];

/** A 1.4 s burst of emoji. Re-fires whenever `fire` changes to a new number. */
export function Confetti({ fire }: { fire: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!fire) return;
    setShown(fire);
    const id = setTimeout(() => setShown(0), 1500);
    return () => clearTimeout(id);
  }, [fire]);
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        bit: BITS[i % BITS.length],
        x: Math.round((Math.random() - 0.5) * 520),
        y: -Math.round(140 + Math.random() * 260),
        r: Math.round((Math.random() - 0.5) * 540),
        d: Math.round(Math.random() * 180),
      })),
    // new random pieces for each burst
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown],
  );
  if (!shown) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-40 z-50 flex justify-center">
      {pieces.map((p, i) => (
        <span
          key={`${shown}-${i}`}
          className="confetti-bit absolute text-2xl"
          style={{ ["--x" as string]: `${p.x}px`, ["--y" as string]: `${p.y}px`, ["--r" as string]: `${p.r}deg`, animationDelay: `${p.d}ms` }}
        >
          {p.bit}
        </span>
      ))}
    </div>
  );
}

/* ---------- Nouri hero ---------- */

/** Big Nouri with a speech bubble. Tapping makes Nouri jump and share a fun fact. */
export function NovaHero({ lang, name }: { lang: UiLang; name?: string }) {
  const facts = t(lang, "novaFacts").split("|");
  const [i, setI] = useState(-1);
  const [jump, setJump] = useState(0);
  const hi = t(lang, "hiName").replace(/\s*\{name\}/, name ? ` ${name}` : "");
  const line = i < 0 ? `${hi} ${t(lang, "tapNova")}` : facts[i % facts.length];
  return (
    <div className="flex items-end gap-3 sm:gap-4">
      <button
        type="button"
        onClick={() => {
          setI((n) => n + 1);
          setJump((j) => j + 1);
        }}
        aria-label={t(lang, "tapNovaLabel")}
        className="shrink-0 rounded-full focus-visible:outline-offset-4"
      >
        <span key={jump} className={`block ${jump ? "nova-jump" : ""}`}>
          <NovaFace className="w-24 h-24 sm:w-28 sm:h-28" mood={jump ? "excited" : "happy"} animated />
        </span>
      </button>
      <div
        role="status"
        dir="auto"
        className="relative mb-6 max-w-md rounded-2xl rounded-es-none border-2 border-night bg-white px-4 py-3 text-lg font-bold text-night shadow-[3px_3px_0_var(--color-night)]"
      >
        <span key={i} className="bubble-in block">{line}</span>
      </div>
    </div>
  );
}

/* ---------- Sticker starters ---------- */

const STICKER_STYLES = [
  { emoji: "🌋", bg: "bg-margin-soft", tilt: "-rotate-[1.5deg]" },
  { emoji: "🍕", bg: "bg-marker-soft", tilt: "rotate-[1.2deg]" },
  { emoji: "🌙", bg: "bg-ink-soft", tilt: "rotate-[1deg]" },
  { emoji: "🏛️", bg: "bg-leaf-soft", tilt: "-rotate-[1.2deg]" },
];

export function StickerStarters({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((q, i) => {
        const st = STICKER_STYLES[i % STICKER_STYLES.length];
        return (
          <button
            key={q}
            onClick={() => onPick(q)}
            dir="auto"
            className={`sticker group min-h-28 rounded-[20px] border-2 border-night ${st.bg} ${st.tilt} p-3 sm:p-4 text-start shadow-[4px_4px_0_var(--color-night)] flex flex-col gap-2`}
          >
            <span className="sticker-emoji grid place-items-center w-14 h-14 rounded-2xl bg-white border-2 border-night text-3xl" aria-hidden>
              {st.emoji}
            </span>
            <span className="text-[17px] sm:text-lg font-extrabold text-night leading-snug">{q}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Puzzle of the day ---------- */

type Puzzle = { key: string; picture: React.ReactNode; options: [string, string]; correct: 0 | 1; ask: string };

function puzzles(lang: UiLang): Puzzle[] {
  return [
    {
      key: "pie",
      picture: <Pie d={4} a={3} size={110} />,
      options: ["3/4", "1/4"],
      correct: 0,
      ask: t(lang, "pz_pie_ask"),
    },
    {
      key: "dots",
      picture: (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((r) => (
            <Dots key={r} count={5} cols={5} color={r % 2 ? "var(--color-marker)" : "var(--color-ink)"} />
          ))}
        </div>
      ),
      options: ["12", "15"],
      correct: 1,
      ask: t(lang, "pz_dots_ask"),
    },
    {
      key: "groups",
      picture: (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((g) => (
            <div key={g} className="rounded-xl border-2 border-night bg-white p-1.5">
              <Dots count={3} cols={3} color="var(--color-ink)" />
            </div>
          ))}
        </div>
      ),
      options: ["3", "4"],
      correct: 0,
      ask: t(lang, "pz_groups_ask"),
    },
  ];
}

export function DailyPuzzle({ lang, onWin, onAsk }: { lang: UiLang; onWin: () => void; onAsk: (q: string) => void }) {
  const all = puzzles(lang);
  const [idx, setIdx] = useState(() => Math.floor(Date.now() / 86_400_000) % 3);
  const p = all[idx];
  const [picked, setPicked] = useState<number | null>(null);
  const [wiggle, setWiggle] = useState(0);
  const won = picked === p.correct;

  return (
    <section className="rounded-[var(--radius-card)] border-2 border-night bg-white p-4 shadow-[4px_4px_0_var(--color-night)]" aria-labelledby="puzzle-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="puzzle-title" className="text-xl font-extrabold text-night" dir="auto">
          🧩 {t(lang, "pz_title")}
        </h2>
        <button
          onClick={() => {
            setIdx((i) => (i + 1) % all.length);
            setPicked(null);
          }}
          className="h-11 px-3 rounded-full border-2 border-line text-sm font-bold hover:border-ink"
        >
          🔀 {t(lang, "pz_another")}
        </button>
      </div>
      <p className="mt-1 text-lg font-bold text-night" dir="auto">{p.ask}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div dir="ltr" key={wiggle} className={wiggle ? "puzzle-wiggle" : ""}>{p.picture}</div>
        <div className="flex gap-3">
          {p.options.map((o, i) => {
            const state = picked === null ? "" : i === p.correct && won ? "bg-leaf text-white border-night" : picked === i ? "bg-marker-soft border-night" : "opacity-60";
            return (
              <button
                key={o}
                disabled={won}
                onClick={() => {
                  setPicked(i);
                  if (i === p.correct) onWin();
                  else setWiggle((w) => w + 1);
                }}
                className={`min-w-20 h-16 px-5 rounded-2xl border-2 border-night bg-paper text-2xl font-extrabold text-night shadow-[3px_3px_0_var(--color-night)] active:translate-y-0.5 ${state}`}
                dir="ltr"
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
      {picked !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="status">
          <p className={`text-lg font-extrabold ${won ? "text-leaf" : "text-night"}`} dir="auto">
            {won ? t(lang, "pz_right") : t(lang, "pz_almost")}
          </p>
          {won && (
            <button onClick={() => onAsk(t(lang, `pz_${p.key}_why`))} className="btn-press h-12 px-4 rounded-full bg-ink text-white font-extrabold text-sm" dir="auto">
              💡 {t(lang, "pz_askWhy")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** True when a "check" answer tells the child they got it right (used to celebrate). */
export function soundsRight(text: string): boolean {
  return /^\s*(✅|🎉|bravo|yes\b|correct|that'?s right|great job|well done|oui\b|exact|c'est juste|bonne réponse|صحيح|أحسنت|برافو|إيه)/i.test(text);
}
