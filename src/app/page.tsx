"use client";
import { offlineMessage } from "@/components/PwaLayer";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KidShell, useUiLang } from "@/components/KidShell";
import { NovaFace } from "@/components/Brand";
import { useKid } from "@/components/useKid";
import { MathVisual } from "@/components/MathVisual";
import { StudyBuddy, verdictOf, type BuddyState } from "@/components/StudyBuddy";
import { topicOf } from "@/components/NovaBuddy";
import { parseCalculation } from "@/lib/ai/mathcheck";
// Playful layer: Nouri hero, sticker questions, puzzle of the day, confetti.
import { Confetti, DailyPuzzle, NovaHero, StickerStarters, soundsRight } from "@/components/Fun";
import { isRtl, LANG_LABEL, t, type UiLang } from "@/lib/i18n";

type Mode = "explain" | "hint" | "example" | "quiz" | "check" | "summary";
type Stage = { key: string; at: number; data?: Record<string, string | number> };
type Result = {
  answer: string;
  lang: string;
  modelClass: "compact" | "mid" | "local" | "cache";
  route: string;
  notices: string[];
  confused: boolean;
  sources: string[];
  calls: number;
  retryAfterSec?: number;
  ms: number;
};
type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  question?: string;
  result?: Result;
  error?: boolean;
  retry?: { text: string; mode: Mode };
  /** The same answer in other languages, kept so switching back is instant (no new AI call). */
  alts?: Partial<Record<UiLang, string>>;
  translating?: boolean;
  translateNote?: string;
};

const MODES: { v: Mode; icon: string }[] = [
  { v: "explain", icon: "💡" },
  { v: "hint", icon: "🤫" },
  { v: "example", icon: "🍎" },
  { v: "quiz", icon: "🎯" },
  { v: "check", icon: "🔁" },
  { v: "summary", icon: "📝" },
];

const STARTERS: Record<UiLang, string[]> = {
  en: ["Why do volcanoes erupt?", "What is 3/4 of a pizza?", "Why does the Moon change shape?", "Who was Hannibal?"],
  fr: ["Pourquoi les volcans entrent-ils en éruption ?", "C'est quoi une fraction ?", "Pourquoi la Lune change de forme ?", "Qui était Hannibal ?"],
  ar: ["لماذا تثور البراكين؟", "ما هو الكسر؟", "لماذا يتغيّر شكل القمر؟", "من هو حنبعل؟"],
  darija: ["علاش البركان يتفجّر؟", "شنوة معناها كسر في الحساب؟", "علاش القمر يبدّل شكلو؟", "شكون حنبعل؟"],
};

// Preferred voice languages, best first. Darija has no dedicated voice: Tunisian, then other Arabic voices.
const VOICE_LANGS: Record<string, string[]> = {
  en: ["en-gb", "en-us", "en"],
  fr: ["fr-fr", "fr-ca", "fr"],
  ar: ["ar-sa", "ar-eg", "ar-tn", "ar"],
  darija: ["ar-tn", "ar-ma", "ar-dz", "ar-eg", "ar-sa", "ar"],
};

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  for (const code of VOICE_LANGS[lang] ?? [lang]) {
    const matches = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(code));
    if (matches.length) {
      // Natural/online voices sound far better than the old desktop ones.
      return matches.find((v) => /natural|online|google/i.test(v.name)) ?? matches[0];
    }
  }
  return null;
}

/** Splits long answers so Chrome doesn't cut speech after ~15 s. */
function speechChunks(text: string): string[] {
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\s+/g, " ").trim();
  return clean.match(/[^.!?؟…]+[.!?؟…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
}
const uid = () => Math.random().toString(36).slice(2, 10);

function ChatPage() {
  const params = useSearchParams();
  const subject = params.get("subject") || "General";
  const initialQ = params.get("q");
  const kid = useKid();
  const [lang, setLang] = useUiLang(kid);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("explain");
  const [group, setGroup] = useState(false);
  const [pending, setPending] = useState<{ stages: Stage[]; startedAt: number } | null>(null);
  const [now, setNow] = useState(0);
  const [speaking, setSpeaking] = useState<string | null>(null);

  // When the child switches language, answers already on screen follow (one by one, switching back is instant).
  const messagesRef = useRef<Msg[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  });
  useEffect(() => {
    const todo = messagesRef.current.filter((m) => m.role === "assistant" && !m.error && m.result && m.result.lang !== lang);
    if (!todo.length) return;
    let cancelled = false;
    window.speechSynthesis?.cancel();
    const patch = (id: string, f: (m: Msg) => Msg) => setMessages((ms) => ms.map((x) => (x.id === id ? f(x) : x)));
    (async () => {
      for (const m of todo) {
        if (cancelled) return;
        const from = m.result!.lang as UiLang;
        const known = m.alts?.[lang];
        if (known) {
          patch(m.id, (x) => ({ ...x, text: known, alts: { ...x.alts, [from]: x.text }, result: { ...x.result!, lang }, translateNote: "" }));
          continue;
        }
        patch(m.id, (x) => ({ ...x, translating: true, translateNote: "" }));
        try {
          const r = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: m.text, to: lang }) });
          const d = await r.json();
          if (!d.ok) throw new Error(d.error);
          patch(m.id, (x) => ({ ...x, text: d.text, translating: false, alts: { ...x.alts, [from]: x.text, [lang]: d.text }, result: { ...x.result!, lang } }));
        } catch {
          patch(m.id, (x) => ({ ...x, translating: false, translateNote: t(lang, "tr_failed") }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);
  const [voiceNote, setVoiceNote] = useState("");
  const [party, setParty] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [pending]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending?.stages.length]);

  const send = useCallback(
    async (text: string, sendMode: Mode = mode) => {
      const q = text.trim();
      if (!q || pending) return;
      setInput("");
      const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      setMessages((m) => [...m, { id: uid(), role: "user", text: q }]);
      setPending({ stages: [{ key: "reading", at: Date.now() }], startedAt: Date.now() });

      const fail = (msg: string) =>
        setMessages((m) => [...m, { id: uid(), role: "assistant", text: msg, error: true, retry: { text: q, mode: sendMode } }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: q, mode: sendMode, subject, language: lang, history, isGroupMode: group }),
        });
        if (res.status === 401) {
          window.location.assign("/login");
          return;
        }
        let data = await res.json();
        if (!data.ok) {
          fail(data.error || t(lang, "errorGeneric"));
          return;
        }
        const deadline = Date.now() + 3 * 60_000;
        while (data.status === "running" && Date.now() < deadline) {
          setPending((p) => (p ? { ...p, stages: data.stages?.length ? data.stages : p.stages } : p));
          await new Promise((r) => setTimeout(r, 700));
          const poll = await fetch(`/api/chat/${data.jobId}`, { cache: "no-store" });
          if (poll.status === 401) {
            window.location.assign("/login");
            return;
          }
          data = await poll.json();
          if (!data.ok) break;
        }
        if (data.status === "done" && data.result) {
          const r: Result = data.result;
          // Celebrate a right answer the child checked (quiz pick or "explain it back").
          if ((sendMode === "check" || r.notices.includes("auto_check")) && soundsRight(r.answer)) setParty(Date.now());
          setMessages((m) => [
            ...m,
            { id: uid(), role: "assistant", text: r.answer, question: q, result: r, retry: r.retryAfterSec ? { text: q, mode: sendMode } : undefined },
          ]);
        } else {
          fail(data.error || t(lang, "errorGeneric"));
        }
      } catch {
        fail(typeof navigator !== "undefined" && !navigator.onLine ? offlineMessage(lang) : t(lang, "errorGeneric"));
      } finally {
        setPending(null);
      }
    },
    [mode, pending, messages, subject, lang, group],
  );

  useEffect(() => {
    if (initialQ && kid && !sentInitial.current) {
      sentInitial.current = true;
      send(initialQ);
    }
  }, [initialQ, kid, send]);

  // Voice output only, generated by the browser. Nothing is recorded or stored.
  async function speak(m: Msg) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceNote(t(lang, "noSpeech"));
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking === m.id) {
      setSpeaking(null);
      return;
    }
    const answerLang = m.result?.lang || lang;
    const voice = pickVoice(await loadVoices(), answerLang);
    if (!voice) {
      setVoiceNote(t(lang, `noVoice_${answerLang}`));
      return;
    }
    setVoiceNote("");
    const parts = speechChunks(m.text);
    setSpeaking(m.id);
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = answerLang === "en" ? 0.95 : 0.9;
      if (i === parts.length - 1) u.onend = () => setSpeaking(null);
      u.onerror = () => setSpeaking(null);
      window.speechSynthesis.speak(u);
    });
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.error);
  const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.text ?? "";

  // What Nouri, the study buddy, reacts to: waiting, a fresh answer, a right or "not yet" answer, a picture to look at.
  const lastMsg = messages[messages.length - 1];
  const buddyState: BuddyState = pending
    ? { kind: "thinking", queued: ["queued", "waiting_quota"].includes(pending.stages[pending.stages.length - 1]?.key ?? "") }
    : lastMsg?.role === "assistant" && lastMsg.result
      ? {
          kind: "answered",
          right: verdictOf(lastMsg.text, lastMsg.result.route.endsWith("_check") || lastMsg.result.notices.includes("auto_check")),
          hasPicture: !!lastMsg.question && parseCalculation(lastMsg.question) !== null && !/^(local_|triage_|model_refusal|deferred)/.test(lastMsg.result.route),
          mode: lastMsg.result.route.split("_")[1] ?? "",
        }
      : { kind: "idle" };

  return (
    <KidShell active="ask" lang={lang} kid={kid}>
      <Confetti fire={party} />
      {messages.length > 0 && (
        <StudyBuddy
          lang={lang}
          state={buddyState}
          cheer={party}
          canRead={!!lastAssistant}
          canQuiz={!!lastQuestion && !pending}
          onRead={() => lastAssistant && speak(lastAssistant)}
          onQuiz={() => send(lastQuestion, "quiz")}
          topic={topicOf(subject, lastQuestion)}
          talking={speaking !== null}
        />
      )}
      <main className="cahier cahier-margin flex-1 flex flex-col">
        {/* Toolbar: subject, language, group mode */}
        <div className="sticky top-[68px] z-30 bg-paper/90 backdrop-blur border-b border-line">
          <div className="mx-auto max-w-3xl ps-10 pe-4 sm:ps-20 py-2 flex items-center gap-2">
            {messages.length > 0 && !pending && (
              <button
                onClick={() => {
                  // Back to the start screen (Nouri, stickers, puzzle). Nothing is stored, so nothing to delete.
                  setMessages([]);
                  window.speechSynthesis?.cancel();
                  window.history.replaceState(null, "", "/");
                }}
                className="h-12 px-4 shrink-0 rounded-full bg-marker border-2 border-night font-extrabold text-sm inline-flex items-center gap-1.5 shadow-[2px_2px_0_var(--color-night)] active:translate-y-0.5"
              >
                <span aria-hidden>✨</span> <span className="hidden sm:inline">{t(lang, "newChat")}</span>
              </button>
            )}
            <span className="hidden sm:inline-flex h-10 px-3 items-center gap-1.5 rounded-full bg-white border-2 border-line font-bold text-sm">
              <span aria-hidden>📚</span> {subject}
            </span>
            <div role="radiogroup" aria-label="Language" className="flex rounded-full bg-white border-2 border-line p-1 overflow-x-auto no-scrollbar">
              {(Object.keys(LANG_LABEL) as UiLang[]).map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={lang === l}
                  onClick={() => setLang(l)}
                  className={`h-10 min-w-12 px-2.5 sm:px-3 rounded-full text-sm font-bold whitespace-nowrap ${lang === l ? "bg-magic" : "text-night hover:bg-grape-soft"}`}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setGroup((g) => !g)}
              aria-pressed={group}
              aria-label={t(lang, "group")}
              className={`h-12 min-w-12 px-3 sm:px-4 ms-auto rounded-full border-2 text-sm font-bold inline-flex items-center justify-center gap-2 ${group ? "bg-leaf-soft border-leaf text-night" : "bg-white border-line"}`}
            >
              <span aria-hidden>👥</span> <span className="hidden sm:inline">{group ? t(lang, "groupOn") : t(lang, "group")}</span>
            </button>
          </div>
        </div>

        <section className="mx-auto w-full max-w-3xl ps-10 pe-4 sm:ps-20 pt-6 pb-64 flex flex-col gap-6" aria-live="polite">
          {messages.length === 0 && !pending && (
            <div className="pt-4 flex flex-col gap-6">
              <NovaHero lang={lang} name={kid?.nickname} />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-night leading-tight" dir="auto">
                  {kid ? `${kid.avatar} ` : ""}
                  {t(lang, "hello")}
                </h1>
                <p className="mt-1 text-muted text-lg" dir="auto">{t(lang, "helloSub")}</p>
              </div>
              <StickerStarters items={STARTERS[lang]} onPick={(q) => send(q)} />
              <DailyPuzzle lang={lang} onWin={() => setParty(Date.now())} onAsk={(q) => send(q)} />
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="self-end max-w-[85%] note px-4 py-3 -rotate-[0.5deg]">
                <p dir="auto" className="text-lg font-semibold text-night whitespace-pre-wrap">{m.text}</p>
              </div>
            ) : (
              <AssistantMessage
                key={m.id}
                m={m}
                lang={lang}
                speaking={speaking === m.id}
                onSpeak={() => speak(m)}
                onRetry={(r) => send(r.text, r.mode)}
                onPick={(choice) => send(choice, "check")}
              />
            ),
          )}

          {voiceNote && (
            <div role="status" className="note px-4 py-3 text-sm font-semibold text-night flex items-start gap-2" dir="auto">
              <span aria-hidden>🔇</span>
              <span className="flex-1">{voiceNote}</span>
              <button onClick={() => setVoiceNote("")} className="w-8 h-8 -m-1 rounded-full hover:bg-black/5" aria-label="Close">×</button>
            </div>
          )}
          {pending && <Progress stages={pending.stages} startedAt={pending.startedAt} now={now} lang={lang} />}
          <div ref={endRef} className="scroll-mb-[280px]" />
        </section>

        {/* Composer */}
        <div className="composer-dock fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-0 z-30 bg-gradient-to-t from-paper via-paper/95 to-transparent pt-6">
          <div className="mx-auto max-w-3xl ps-10 pe-4 sm:ps-20 pb-4">
            {lastAssistant && !pending && (
              <nav aria-label={t(lang, "nextTitle")} className="mb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="shrink-0 text-sm font-extrabold text-muted" dir="auto">{t(lang, "nextTitle")}</span>
                {/* A Socratic loop: a nudge first, then an example, then practice, then the child teaches it back. */}
                {(
                  [
                    ["hint", "🤫", "moreHint"],
                    ["example", "🍎", "nextExample"],
                    ["quiz", "🎯", "quizMe"],
                    ["check", "🔁", "nextExplainBack"],
                  ] as const
                ).map(([m, icon, label]) => (
                  <button
                    key={m}
                    onClick={() => send(lastQuestion, m)}
                    className="h-12 px-4 shrink-0 rounded-full bg-white border-2 border-line font-bold text-sm whitespace-nowrap hover:border-ink"
                  >
                    <span aria-hidden>{icon}</span> {t(lang, label)}
                  </button>
                ))}
              </nav>
            )}
            <div className="rounded-[var(--radius-card)] bg-white border-2 border-night shadow-[4px_4px_0_var(--color-night)] p-2">
              <div role="radiogroup" aria-label="How should Nouri help?" className="flex sm:flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-2">
                {MODES.map((m) => (
                  <button
                    key={m.v}
                    role="radio"
                    aria-checked={mode === m.v}
                    onClick={() => setMode(m.v)}
                    className={`h-12 px-3.5 shrink-0 rounded-full text-[15px] font-bold inline-flex items-center gap-1.5 border-2 ${
                      mode === m.v ? "bg-marker border-night text-night" : "bg-paper border-transparent text-night hover:border-line"
                    }`}
                  >
                    <span aria-hidden className="text-xl leading-none">{m.icon}</span>
                    {t(lang, `m_${m.v}`)}
                  </button>
                ))}
              </div>
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <label htmlFor="ask" className="sr-only">{t(lang, "placeholder")}</label>
                <textarea
                  id="ask"
                  dir="auto"
                  value={input}
                  maxLength={600}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={t(lang, "placeholder")}
                  rows={1}
                  className="flex-1 min-h-14 max-h-36 resize-none bg-transparent px-3 py-3.5 text-lg text-night placeholder:text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !!pending}
                  aria-label={t(lang, "send")}
                  className="btn-press w-14 h-14 shrink-0 rounded-full bg-magic grid place-items-center disabled:opacity-40 disabled:shadow-none"
                >
                  <svg viewBox="0 0 24 24" className={`w-7 h-7 ${isRtl(lang) ? "-scale-x-100" : ""}`} aria-hidden>
                    <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </KidShell>
  );
}

function Badge({ r, lang }: { r: Result; lang: UiLang }) {
  const map = {
    compact: { icon: "⚡", cls: "bg-marker-soft" },
    mid: { icon: "🧠", cls: "bg-ink-soft" },
    cache: { icon: "📦", cls: "bg-leaf-soft" },
    local: { icon: "🛡️", cls: "bg-margin-soft" },
  }[r.modelClass];
  // Answers built from the team's notes (Arabic/Darija) are not safety replies: say where they come from.
  const curated = r.route.startsWith("curated_");
  return (
    <span className={`h-7 px-2.5 inline-flex items-center gap-1 rounded-full text-xs font-extrabold text-night ${curated ? "bg-leaf-soft" : map.cls}`}>
      <span aria-hidden>{curated ? "📒" : map.icon}</span>
      {t(lang, curated ? "b_curated" : `b_${r.modelClass}`)}
      <span className="font-semibold text-muted">· {(r.ms / 1000).toFixed(1)}s</span>
    </span>
  );
}

function AssistantMessage({
  m,
  lang,
  speaking,
  onSpeak,
  onRetry,
  onPick,
}: {
  m: Msg;
  lang: UiLang;
  speaking: boolean;
  onSpeak: () => void;
  onRetry: (r: { text: string; mode: Mode }) => void;
  onPick: (choice: string) => void;
}) {
  const r = m.result;
  const options = m.text.split("\n").filter((l) => /^\s*[AB][).:]\s+/.test(l));
  const [countdown, setCountdown] = useState(r?.retryAfterSec ?? 0);
  useEffect(() => {
    if (!countdown) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  return (
    <article className="flex gap-3 items-start">
      <NovaFace className="w-11 h-11 shrink-0 -mt-1" mood={m.error ? "thinking" : "happy"} />
      <div className="flex-1 min-w-0">
        {r?.confused && <p className="mb-1 text-sm font-bold text-leaf" dir="auto">🐢 {t(lang, "confused")}</p>}
        <p dir="auto" className={`text-[19px] leading-[28px] whitespace-pre-wrap transition-opacity ${m.translating ? "opacity-40" : ""} ${m.error ? "text-margin font-semibold" : "text-night"}`}>
          {m.text}
        </p>
        {m.translating && (
          <p role="status" className="mt-1 text-sm font-bold text-grape" dir="auto">
            🌐 {t(lang, "tr_working")}
          </p>
        )}
        {m.translateNote && (
          <p role="status" className="mt-1 text-sm font-bold text-margin" dir="auto">
            {m.translateNote}
          </p>
        )}

        {!m.error && m.question && !/^(local_|triage_|model_refusal|deferred)/.test(m.result?.route ?? "") && <MathVisual question={m.question} lang={(m.result?.lang as UiLang) || lang} />}

        {options.length === 2 && (
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {options.map((o) => (
              <button key={o} onClick={() => onPick(o.trim())} dir="auto" className="min-h-14 px-4 rounded-2xl bg-white border-2 border-ink text-start font-bold text-night hover:bg-ink-soft">
                {o.trim()}
              </button>
            ))}
          </div>
        )}

        {r && (r.notices.length > 0 || r.sources.length > 0) && (
          <ul className="mt-3 space-y-1 text-sm text-muted" dir="auto">
            {r.notices
              .filter((n) => n !== "deferred")
              .map((n) => (
                <li key={n}>ℹ️ {t(lang, `n_${n}`)}</li>
              ))}
            {r.sources.length > 0 && (
              <li>
                📒 {t(lang, "fromNotes")} <span className="marker font-semibold text-night">{r.sources.join(", ")}</span>
              </li>
            )}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {r && <Badge r={r} lang={lang} />}
          {!m.error && (
            <button onClick={onSpeak} aria-pressed={speaking} className="h-11 px-3.5 rounded-full bg-white border-2 border-line text-sm font-bold inline-flex items-center gap-1.5">
              <span aria-hidden>{speaking ? "⏹️" : "🔊"}</span> {speaking ? t(lang, "stop") : t(lang, "readAloud")}
            </button>
          )}
          {m.retry && (
            <button
              onClick={() => onRetry(m.retry!)}
              disabled={countdown > 0}
              className="btn-press h-12 px-4 rounded-full bg-ink text-white text-sm font-extrabold disabled:opacity-60 disabled:shadow-none"
            >
              ↻ {countdown > 0 ? `${t(lang, "n_deferred")} ${countdown}${t(lang, "seconds")}` : t(lang, "tryAgain")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Progress({ stages, startedAt, now, lang }: { stages: Stage[]; startedAt: number; now: number; lang: UiLang }) {
  const elapsed = Math.max(0, (now - startedAt) / 1000);
  const current = stages[stages.length - 1];
  return (
    <div className="flex gap-3 items-start" role="status">
      <NovaFace className="w-11 h-11 shrink-0 -mt-1" mood="thinking" />
      <div className="flex-1 rounded-[var(--radius-card)] bg-white border-2 border-line p-4 shadow-[var(--shadow-sheet)]">
        <ol className="space-y-2">
          {stages.map((s, i) => {
            const done = i < stages.length - 1;
            const waitLeft = s.key === "waiting_quota" && s.data?.seconds ? Math.max(0, Math.ceil(Number(s.data.seconds) - (now - s.at) / 1000)) : null;
            return (
              <li key={`${s.key}-${i}`} className={`flex items-center gap-2.5 ${done ? "text-muted" : "text-night font-bold"}`} dir="auto">
                <span className={`w-6 h-6 rounded-full grid place-items-center text-xs shrink-0 ${done ? "bg-leaf text-white" : "bg-ink-soft"}`} aria-hidden>
                  {done ? "✓" : (
                    <span className="flex gap-0.5">
                      <span className="ink-dot w-1 h-1 rounded-full bg-ink" />
                      <span className="ink-dot w-1 h-1 rounded-full bg-ink [animation-delay:.15s]" />
                      <span className="ink-dot w-1 h-1 rounded-full bg-ink [animation-delay:.3s]" />
                    </span>
                  )}
                </span>
                <span>
                  {t(lang, `s_${s.key}`)}
                  {s.key === "queued" && s.data?.position ? ` · ${t(lang, "position")} ${s.data.position}` : ""}
                  {waitLeft !== null ? ` · ${waitLeft}${t(lang, "seconds")}` : ""}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 h-2 rounded-full bg-paper-deep overflow-hidden" aria-hidden>
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${current?.key === "thinking_deep" ? "bg-ink" : "bg-marker"}`}
            style={{ width: `${Math.min(95, 12 + elapsed * (current?.key === "thinking_deep" ? 6 : 14))}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted tabular-nums">{elapsed.toFixed(1)}s</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="cahier flex-1" />}>
      <ChatPage />
    </Suspense>
  );
}
