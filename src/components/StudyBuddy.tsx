"use client";
// Nouri, the study buddy: a mascot that stays in the corner of the chat and helps the child study.
// It reacts to what is happening (thinking, a picture to look at, a right or wrong answer) and opens a small
// study kit when tapped: a study tip, read-aloud, a quiz, and a breathing break.
// Everything is local: no AI call, nothing stored, no streaks or timers. Motion stops with reduced motion.
import { useEffect, useRef, useState } from "react";
import { NovaFace } from "@/components/Brand";
import { NovaBuddy, type NovaMood, type NovaTopic } from "@/components/NovaBuddy";
import { t, type UiLang } from "@/lib/i18n";

export type BuddyState =
  | { kind: "idle" }
  | { kind: "thinking"; queued: boolean }
  | { kind: "answered"; right: boolean | null; hasPicture: boolean; mode: string };

const NOT_QUITE = /^\s*(not quite|almost|nope|that'?s not|pas tout à fait|presque|pas encore|ليس تمامًا|ليس بالضبط|قريب|مازال)/i;

/** Reads a checked answer: true = right, false = not yet, null = not a check. */
export function verdictOf(text: string, wasCheck: boolean): boolean | null {
  if (!wasCheck) return null;
  if (/^\s*(✅|🎉|bravo|yes\b|correct|that'?s right|great job|well done|oui\b|exact|c'est juste|bonne réponse|صحيح|أحسنت|برافو|إيه)/i.test(text)) return true;
  if (NOT_QUITE.test(text)) return false;
  return null;
}

function bubbleFor(state: BuddyState, lang: UiLang, tick: number): string | null {
  if (state.kind === "thinking") {
    if (state.queued) return t(lang, "bd_queued");
    const lines = t(lang, "bd_thinking").split("|");
    return lines[tick % lines.length];
  }
  if (state.kind === "answered") {
    if (state.right === true) return t(lang, "bd_right");
    if (state.right === false) return t(lang, "bd_notyet");
    if (state.hasPicture) return t(lang, "bd_picture");
    if (state.mode === "explain" || state.mode === "example") return t(lang, "bd_explainBack");
    if (state.mode === "hint") return t(lang, "bd_afterHint");
    return null;
  }
  return null;
}

/** Three slow breaths with a circle that grows and shrinks (text only with reduced motion). */
function BreathingBreak({ lang, onDone }: { lang: UiLang; onDone: () => void }) {
  const [step, setStep] = useState(0); // 0..5: in, out, in, out, in, out
  useEffect(() => {
    if (step >= 6) return;
    const id = setTimeout(() => setStep((s) => s + 1), 4000);
    return () => clearTimeout(id);
  }, [step]);
  const done = step >= 6;
  const inhale = step % 2 === 0;
  return (
    <div className="flex flex-col items-center gap-3 py-2" role="status">
      <div className="h-36 grid place-items-center">
        <div
          className="breath-circle rounded-full bg-ink-soft border-2 border-ink grid place-items-center"
          style={{ width: done ? 96 : inhale ? 136 : 72, height: done ? 96 : inhale ? 136 : 72 }}
        >
          <NovaFace className="w-14 h-14" mood={done ? "excited" : "happy"} />
        </div>
      </div>
      <p className="text-xl font-extrabold text-night text-center" dir="auto">
        {done ? t(lang, "bd_breathDone") : inhale ? t(lang, "bd_breatheIn") : t(lang, "bd_breatheOut")}
      </p>
      {!done && <p className="text-sm font-bold text-muted">{Math.floor(step / 2) + 1} / 3</p>}
      {done && (
        <button onClick={onDone} className="h-14 px-6 rounded-full bg-ink text-white font-extrabold">
          {t(lang, "bd_back")}
        </button>
      )}
    </div>
  );
}

export function StudyBuddy({
  lang,
  state,
  cheer,
  canRead,
  canQuiz,
  onRead,
  onQuiz,
  topic = "general",
  talking = false,
}: {
  lang: UiLang;
  /** Nouri's outfit follows the topic (pencil, goggles, planet, laurel, book). */
  topic?: NovaTopic;
  /** True while an answer is read aloud: Nouri's mouth moves. */
  talking?: boolean;
  state: BuddyState;
  /** Changes to a new number when the child gets something right (confetti moment). */
  cheer: number;
  canRead: boolean;
  canQuiz: boolean;
  onRead: () => void;
  onQuiz: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "tip" | "breath">("menu");
  const [tipIdx, setTipIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [hop, setHop] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Rotate the "thinking" lines every 4 s while waiting.
  useEffect(() => {
    if (state.kind !== "thinking") return;
    const id = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(id);
  }, [state.kind]);

  // A new situation brings the bubble back.
  const stateKey = JSON.stringify(state);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the bubble again for a new situation
    setHidden(false);
  }, [stateKey]);

  // Celebrate with a little hop.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- trigger the hop animation
    if (cheer) setHop((h) => h + 1);
  }, [cheer]);

  // Close the kit with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const bubble = open || hidden ? null : bubbleFor(state, lang, tick);
  const tips = t(lang, "bd_tips").split("|");
  const mood: NovaMood =
    state.kind === "thinking" ? "thinking" : state.kind === "answered" && state.right === true ? "excited" : state.kind === "answered" && state.right === false ? "encourage" : "happy";

  return (
    <div className="fixed z-40 end-3 bottom-[212px] lg:bottom-8 lg:end-8 flex flex-col items-end gap-2 pointer-events-none">
      {/* Study kit */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t(lang, "bd_kitTitle")}
          className="pointer-events-auto w-[min(88vw,320px)] rounded-[24px] bg-white border-2 border-night shadow-[4px_4px_0_var(--color-night)] p-4 bubble-in"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-night" dir="auto">🎒 {t(lang, "bd_kitTitle")}</h2>
            <button onClick={() => setOpen(false)} aria-label={t(lang, "bd_close")} className="w-11 h-11 rounded-full border-2 border-line grid place-items-center text-xl">
              ✕
            </button>
          </div>

          {view === "menu" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { k: "tip", icon: "💡", label: t(lang, "bd_tip"), on: () => { setTipIdx(Math.floor(Math.random() * tips.length)); setView("tip"); }, ok: true },
                { k: "read", icon: "🔊", label: t(lang, "bd_read"), on: () => { onRead(); setOpen(false); }, ok: canRead },
                { k: "quiz", icon: "🎯", label: t(lang, "bd_quiz"), on: () => { onQuiz(); setOpen(false); }, ok: canQuiz },
                { k: "breath", icon: "🧘", label: t(lang, "bd_breath"), on: () => setView("breath"), ok: true },
              ].map((b) => (
                <button
                  key={b.k}
                  onClick={b.on}
                  disabled={!b.ok}
                  className="min-h-[72px] rounded-2xl border-2 border-night bg-paper px-2 py-2 flex flex-col items-center justify-center gap-1 font-extrabold text-sm text-night shadow-[2px_2px_0_var(--color-night)] active:translate-y-0.5 disabled:opacity-40 disabled:shadow-none"
                  dir="auto"
                >
                  <span className="text-2xl" aria-hidden>{b.icon}</span>
                  {b.label}
                </button>
              ))}
            </div>
          )}

          {view === "tip" && (
            <div className="mt-3">
              <p className="rounded-2xl bg-marker-soft p-4 text-lg font-bold text-night" dir="auto">{tips[tipIdx % tips.length]}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setTipIdx((i) => i + 1)} className="flex-1 h-12 rounded-full bg-ink text-white font-extrabold" dir="auto">
                  💡 {t(lang, "bd_another")}
                </button>
                <button onClick={() => setView("menu")} className="h-12 px-4 rounded-full border-2 border-line font-bold">↩</button>
              </div>
            </div>
          )}

          {view === "breath" && <BreathingBreak lang={lang} onDone={() => setView("menu")} />}
        </div>
      )}

      {/* Speech bubble */}
      {bubble && (
        <div className="pointer-events-auto max-w-[min(70vw,260px)] flex items-start gap-1 rounded-2xl rounded-ee-none bg-white border-2 border-night px-3 py-2 shadow-[3px_3px_0_var(--color-night)] bubble-in" role="status">
          <span key={bubble} className="text-[15px] font-bold text-night leading-snug" dir="auto">{bubble}</span>
          <button onClick={() => setHidden(true)} aria-label={t(lang, "bd_close")} className="shrink-0 -me-1 w-8 h-8 rounded-full text-muted grid place-items-center">
            ✕
          </button>
        </div>
      )}

      {/* Nouri, full body */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setView("menu");
        }}
        aria-expanded={open}
        aria-label={t(lang, "bd_open")}
        className="pointer-events-auto relative rounded-[32px] p-1 hover:bg-white/60 focus-visible:bg-white/60 transition-colors"
      >
        <span key={hop} className={hop ? "nova-jump block" : "block"}>
          <NovaBuddy mood={mood} topic={topic} talking={talking} waving={open} className="w-24 h-[106px] lg:w-[120px] lg:h-[132px]" />
        </span>
        {!open && (
          <span className="absolute top-1 -start-1 h-8 px-2 rounded-full bg-marker border-2 border-night grid place-items-center text-xs font-extrabold shadow-[2px_2px_0_var(--color-night)]" aria-hidden>
            🎒
          </span>
        )}
      </button>
    </div>
  );
}
