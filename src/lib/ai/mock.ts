import { aiConfig, type ModelClass } from "./config";
import type { QuotaSnapshot } from "./metrics";
import { NOTES } from "./knowledge";
import { noteText } from "./knowledge-i18n";
import type { Lang } from "./safety";

// Offline stand-in for the platform (MOCK_MODE=true). It behaves like the real service:
// whole responses (no streaming), realistic latency per class, a token-bucket quota with headers,
// and optional injected 429 / 503 / 400 errors (MOCK_FAULTS) to rehearse fallback behaviour.
// The real service is always used for the demo when MOCK_MODE=false.

type Msg = { role: string; content: string };

const g = globalThis as unknown as { __ednovaBucket?: { tokens: number; at: number } };
const CAP = 30;
const REFILL_PER_SEC = 0.5;
const bucket = (g.__ednovaBucket ??= { tokens: CAP, at: Date.now() });

function faults(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of aiConfig.mockFaults.split(",")) {
    const [k, v] = part.split("=");
    if (k && v) out[k.trim()] = Number(v);
  }
  return out;
}

class MockError extends Error {
  constructor(public kind: "quota429" | "busy503" | "bad400", public status: number, public retryAfterMs: number | null, msg: string) {
    super(msg);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function tags(messages: Msg[]) {
  const sys = messages.find((m) => m.role === "system")?.content || "";
  const pick = (k: string) => sys.match(new RegExp(`${k}=([\\w-]+)`))?.[1] || "";
  return { task: pick("task"), lang: (pick("lang") || "en") as Lang, note: pick("note") };
}

const T: Record<Lang, Record<string, string>> = {
  en: { try: "Your turn: can you tell me in your own words?", sum: "Today we learned:", great: "Great question!", right: "Yes, that's right!", almost: "Nice try! The answer is", sayBack: "Can you say why in one sentence?", noNotes: "I don't have notes on that yet. Let's think like scientists: what do you already know about it?" },
  fr: { try: "À toi : peux-tu le dire avec tes mots ?", sum: "Aujourd'hui, on a appris :", great: "Super question !", right: "Oui, c'est juste !", almost: "Bien essayé ! La réponse est", sayBack: "Peux-tu dire pourquoi en une phrase ?", noNotes: "Je n'ai pas encore de notes là-dessus. Réfléchissons comme des scientifiques : que sais-tu déjà ?" },
  ar: { try: "دورك: هل تستطيع قولها بكلماتك؟", sum: "تعلّمنا اليوم:", great: "سؤال رائع!", right: "نعم، إجابة صحيحة!", almost: "محاولة جيدة! الإجابة هي", sayBack: "هل تستطيع أن تقول لماذا في جملة واحدة؟", noNotes: "ليست لديّ ملاحظات عن هذا بعد. لنفكّر كالعلماء: ماذا تعرف عنه؟" },
  darija: { try: "دورك: تنجم تقولها بكلامك؟", sum: "اليوم تعلّمنا:", great: "سؤال باهي برشا!", right: "إيه، صحيح!", almost: "محاولة باهية! الجواب هو", sayBack: "تنجم تقول علاش في جملة وحدة؟", noNotes: "ما عنديش نوتات على هذا مازال. نفكرو كيف العلماء: شنوة تعرف عليه؟" },
};

/** Answer built from the team's notes in the child's language. Used offline, and live for Arabic/Darija (see orchestrator). */
export function curatedAnswer(task: string, lang: Lang, noteId: string, userText: string): string {
  return answer(task, lang, noteId, userText);
}

function answer(task: string, lang: Lang, noteId: string, userText: string): string {
  const note = NOTES.find((n) => n.id === noteId);
  const t = T[lang] || T.en;
  if (task === "triage") {
    const greet = /^(hi|hello|salut|bonjour|salam|aslema|مرحبا|عسلامة)\b/i.test(userText.trim());
    const confused = /(don'?t understand|confus|pas compris|ma fhemtch|mafhemtch|ما فهمت|مافهمتش|lost|help)/i.test(userText);
    return JSON.stringify({
      intent: greet ? "greeting" : "learning",
      safe: true,
      confused,
      needs_deep: !greet && userText.split(/\s+/).length > 3,
      quick_answer: greet ? "" : "",
    });
  }
  if (!note) return `${t.great} ${t.noNotes} 🔍`;
  // Offline answers come from the team's notes, written in all four languages.
  const n = noteText(note, lang);
  switch (task) {
    case "hint":
      return `🤫 ${n.hint} ${t.try}`;
    case "quiz":
      return `🎯 ${n.quiz.q}\nA) ${n.quiz.a}\nB) ${n.quiz.b}`;
    case "check":
      return /^\s*[AB]\)/.test(userText)
        ? userText.trim().slice(3).trim() === n.quiz.a
          ? `✅ ${t.right} ${n.fact.split(/[.!؟?]/)[0]}. ${t.sayBack}`
          : `🤔 ${t.almost} ${n.quiz.a}. ${n.hint}`
        : `🔁 ${t.try} (${n.title})`;
    case "summary":
      return `📝 ${t.sum}\n1) ${n.fact}\n2) ${n.analogy}\n3) ${n.example}`;
    case "example":
      return `🍎 ${n.example}\n\n${n.analogy} ${t.try}`;
    default:
      return `${t.great} ${n.analogy}\n\n${n.fact}\n\n${t.try}`;
  }
}

export async function mockChat(cls: ModelClass, messages: Msg[], maxTokens: number) {
  // Refill the bucket continuously, like the platform.
  const now = Date.now();
  bucket.tokens = Math.min(CAP, bucket.tokens + ((now - bucket.at) / 1000) * REFILL_PER_SEC);
  bucket.at = now;

  const f = faults();
  await sleep(cls === "mid" ? rand(1800, 3400) : rand(500, 1100));

  if (bucket.tokens < 1 || Math.random() < (f.quota429 || 0)) {
    throw new MockError("quota429", 429, 3000, "Team quota exhausted");
  }
  if (cls === "mid" && Math.random() < (f.mid503 || 0)) {
    throw new MockError("busy503", 503, 5000, "Mid-size class saturated");
  }
  if (maxTokens > 300 && Math.random() < (f.bad400 || 0)) {
    throw new MockError("bad400", 400, null, "max_tokens exceeds the per-request ceiling (300)");
  }
  bucket.tokens -= 1;

  const { task, lang, note } = tags(messages);
  const user = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const text = answer(task, lang, note, user);
  const quota: QuotaSnapshot = {
    remaining: Math.floor(bucket.tokens),
    limit: CAP,
    resetSec: Math.ceil((CAP - bucket.tokens) / REFILL_PER_SEC),
    raw: { "x-ratelimit-remaining-requests": String(Math.floor(bucket.tokens)), "x-ratelimit-limit-requests": String(CAP) },
    at: new Date().toISOString(),
  };
  const tokensIn = Math.ceil(messages.reduce((n, m) => n + m.content.length, 0) / 4);
  return { text, tokensIn, tokensOut: Math.ceil(text.length / 4), quota };
}

export { MockError };
