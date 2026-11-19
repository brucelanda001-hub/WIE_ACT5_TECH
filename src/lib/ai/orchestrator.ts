import { aiConfig, aiReady, type ModelClass } from "./config";
import { callChat, LlmError, paceDelayMs, type ChatMessage } from "./client";
import { cacheGet, cacheKey, cacheSet, getInflight, normalize, setInflight } from "./cache";
import { metrics, recordRoute } from "./metrics";
import { acquireSlot } from "./queue";
import { contextBlock, retrieve, type Retrieved } from "./rag";
import { noteText } from "./knowledge-i18n";
import { parseCalculation, verifiedCalculation } from "./mathcheck";
import { curatedAnswer } from "./mock";
import { detectLanguage, isGreeting, LANG_NAME, LOCAL_REPLIES, localSafetyFlag, maskPersonalData, type Lang } from "./safety";
import type { ChatResult, StageKey, Stage } from "./jobs";

export type Mode = "explain" | "hint" | "example" | "quiz" | "check" | "summary";
export const MODES: Mode[] = ["explain", "hint", "example", "quiz", "check", "summary"];

export type AskInput = {
  text: string;
  mode: Mode;
  subject: string;
  grade: number;
  defaultLang: Lang;
  history: { role: "user" | "assistant"; text: string }[];
  group: boolean;
};

type Report = (key: StageKey, data?: Stage["data"]) => void;

const WORDS: Record<Mode, number> = { explain: 90, example: 80, summary: 80, hint: 45, quiz: 60, check: 60 };
/** Typical adult-style refusals from the models; replaced by the app's kind reply for children. */
const MODEL_REFUSAL =
  /^(?:(?:I cannot|I can't|I can not|I'm not able to|I am not able to|I won't) (?:provide|help (?:you )?with|assist|give|share|answer|support)|Je ne peux pas (?:t'|vous )?(?:aider|répondre|fournir|donner)|(?:لا أستطيع|لا يمكنني)[^.]{0,30}(?:مساعد|تقديم|الإجابة))/i;

/** Shown when a Latin-letter Darija question matches none of the team's notes. */
const DARIJA_NO_NOTE =
  "سؤال باهي! 🌟 مازلت نتعلّم الدارجة في الموضوع هذا. تنجم تسألني بالعربي ولا بالفرنساوي؟ / Bonne question ! Tu peux me la poser en arabe ou en français ?";

/** Modes whose child-facing text the compact model writes (set from the 17 Nov model comparison). */
const COMPACT_WRITES: Mode[] = [];
/** Modes where the child typed free text, so compact triage double-checks safety and confusion. */
const TRIAGE_MODES: Mode[] = ["explain", "example", "hint", "check"];
/** Modes answered from the team's notes in Arabic/Darija when a note matches. */
const CURATED_MODES: Mode[] = ["explain", "example", "hint", "quiz", "summary"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The language the child picked wins. Exceptions: text written in Arabic script while the
 * interface is English/French, or Darija written in Latin letters (3, 7, 9…).
 */
function chooseLanguage(text: string, picked: Lang): Lang {
  // The language button decides: a child who picked Arabic gets Arabic even when typing "what is 4*6".
  // Only nuance: with Arabic or Darija selected, a message clearly written in Darija gets Darija.
  if ((picked === "ar" || picked === "darija") && detectLanguage(text, picked) === "darija") return "darija";
  return picked;
}

/** True when an answer is clearly not in the language we asked for (the model copied the child's language). */
function wrongLanguage(answer: string, want: Lang): boolean {
  const letters = answer.replace(/[^\p{L}]/gu, "");
  if (letters.length < 12) return false;
  const arabicShare = (letters.match(/[\u0600-\u06FF]/g)?.length ?? 0) / letters.length;
  if (want === "ar" || want === "darija") return arabicShare < 0.4;
  if (arabicShare > 0.3) return true;
  const got = detectLanguage(answer, want);
  if (want === "fr") return got === "en" && !/\b(le|la|les|un|une|des|est|et|tu|pour|avec)\b/i.test(answer);
  return got === "fr";
}

class Deferred extends Error {
  constructor(public retryAfterSec: number) {
    super("deferred");
  }
}

const TASK_RULES: Record<Mode, string> = {
  explain:
    "Explain the idea simply with ONE everyday analogy that fits the topic. Then ask ONE short question to check understanding.",
  example: "Give ONE concrete example from daily life, step by step if there are numbers. Then invite the child to make up their own example.",
  hint: "Do NOT give the answer. Give ONE small hint that moves the child one step forward, then ask ONE guiding question.",
  quiz: "Output ONLY these three lines, with no introduction and no explanation:\n<one question ending with ?>\nA) <option>\nB) <option>\nExactly one option is correct. Do not reveal which one.",
  check:
    "Look at the conversation. If the child's last message answers your previous question: when it is right, start with ✅ and say in one sentence why it is right, then offer a slightly harder question; when it is not right, say kindly that it is not quite, give ONE small hint without the answer, and ask them to try again. If it is an explanation, praise what is right and gently fix ONE thing. Otherwise invite them to explain the idea back in their own words.",
  summary: "Summarise this session in 3 numbered short points the child can remember, then add one encouraging sentence.",
};

function systemPrompt(o: { task: string; lang: Lang; grade: number; noteId: string; words: number; group: boolean; confused: boolean; context: string; rules: string }) {
  const age = o.grade + 5;
  return [
    `You are EdNova, a kind learning buddy for a child in grade ${o.grade} (about ${age} years old). Session tags: task=${o.task} lang=${o.lang} note=${o.noteId || "none"}.`,
    `Reply ONLY in ${LANG_NAME[o.lang]}, even when the child writes in another language. Use short sentences and words a ${age}-year-old knows. Be warm; mistakes are part of learning.`,
    "Never ask for or repeat personal information (names, addresses, photos, phone numbers). You do not know the child's name: never call them by any name; say \"you\" or \"friend\". If something is not suitable for a child, gently suggest asking a trusted adult.",
    "Do not invent facts. If unsure, say so and suggest checking with the teacher. You support teachers and parents; you never replace them. No links.",
    "Stay on the topic of the conversation and never start a new subject. A short message (a number, yes/no, one word) is a reply to your previous message.",
    "If you need an everyday example, you may pick one familiar to children in Tunisia (dates, olives, bread, fruit, football), but it must fit the topic. Never pork, ham or alcohol.",
    o.lang === "fr" ? "Dis toujours « tu » à l'enfant, jamais « vous »." : "",
    o.group ? "You are guiding a small group of children: speak to the group, invite someone who has not spoken yet, and suggest taking turns." : "",
    o.confused ? "The child seems confused: slow down, use 3 tiny numbered steps, and reassure them that it's fine not to understand yet." : "",
    o.rules,
    o.context ? `Curriculum notes (accurate, use them):\n${o.context}` : "",
    `Maximum ${o.words} words.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function triagePrompt(lang: Lang, noteId: string) {
  return [
    `You classify a child's message for a school learning app. Session tags: task=triage lang=${lang} note=${noteId || "none"}.`,
    'Reply with JSON only: {"intent":"learning|greeting|offtopic|unsafe","safe":true,"confused":false}',
    "intent=unsafe and safe=false for violence, adult content, self-harm, breaking into places, or dangerous acts.",
    "confused=true when the child says they don't understand or seems lost.",
  ].join("\n");
}

/** Instant local signal that the child is lost, so the answer can slow down without waiting for triage. */
const CONFUSED_RE =
  /don'?t (understand|get)|confus|i'?m lost|too hard|je (ne )?comprends? pas|pas compris|c'est dur|ما فهمت|لم أفهم|لا أفهم|صعيب|ma ?fhemt|ma ?fhimt|s3ib/i;

type Triage = { intent: string; safe: boolean; confused: boolean };

function parseTriage(text: string): Triage | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    return {
      intent: String(j.intent || "learning"),
      safe: j.safe !== false,
      confused: Boolean(j.confused),
    };
  } catch {
    return null;
  }
}

/**
 * Escalation (API Guide §7): the compact triage is a cheap first pass but flagged harmless school questions as unsafe
 * in testing, so its "unsafe" verdict is confirmed by one short mid-size call before anything is blocked.
 * If the confirmation itself fails we stay cautious and block.
 */
async function confirmUnsafe(text: string, report: Report, notices: Set<string>, counters: { calls: number }): Promise<boolean> {
  metrics.handling.unsafeEscalated++;
  try {
    const r = await resilientCall(
      "mid",
      [
        {
          role: "system",
          content:
            "Session tags: task=safety_check. A child (age 8-11) wrote a message to a school learning app. Is it asking for something unsafe for a child: violence, weapons, adult content, self-harm, breaking into places, stealing or dangerous acts? Normal school questions about nature, science, maths, history or language are SAFE. Answer with exactly one word: SAFE or UNSAFE.",
        },
        { role: "user", content: text },
      ],
      5,
      report,
      notices,
      counters,
      0,
    );
    const unsafe = /UNSAFE/i.test(r.text);
    if (!unsafe) metrics.handling.unsafeOverruled++;
    return unsafe;
  } catch {
    return true;
  }
}

/** One model call with the full resilience contract from API Guide §6. */
async function resilientCall(
  startCls: ModelClass,
  messages: ChatMessage[],
  maxTokens: number,
  report: Report,
  notices: Set<string>,
  counters: { calls: number },
  temperature = 0.4,
  /** Optional calls (triage) give up at once on a quota refusal: the answer matters more than the double-check. */
  optional = false,
): Promise<{ text: string; cls: ModelClass }> {
  let cls = startCls;
  let parallelRetries = 0;
  let msgs = messages;
  let tokens = maxTokens;
  let quotaRetries = 0;
  let busyRetries = 0;
  let shrunk = false;
  let netRetries = 0;

  for (let attempt = 0; attempt < 6; attempt++) {
    const slot = await acquireSlot(cls, (pos) => report("queued", { position: pos, model: cls }));
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        slot();
      }
    };
    try {
      // Pace before sending: stay inside the key's per-minute budget instead of collecting 429s.
      let pace = paceDelayMs();
      if (pace > aiConfig.maxQuotaWaitMs) {
        metrics.handling.deferredToChild++;
        throw new Deferred(Math.ceil(pace / 1000));
      }
      if (pace > 0) {
        metrics.handling.pacedBeforeSend++;
        notices.add("quota_wait");
        while (pace > 0) {
          report("waiting_quota", { seconds: Math.ceil(pace / 1000) });
          await sleep(Math.min(pace, 1000));
          pace = paceDelayMs();
        }
      }
      report(cls === "mid" ? "thinking_deep" : "thinking_fast");
      counters.calls++;
      const r = await callChat(cls, msgs, { maxTokens: tokens, temperature });
      return { text: r.text, cls };
    } catch (e) {
      if (!(e instanceof LlmError)) throw e;
      metrics.refusals[e.kind]++;
      if (e.kind === "auth") throw new Error("AI key refused: the platform rejected LLM_API_KEY (expired, outside your team's time slot, or mistyped).");

      if (e.kind === "quota429") {
        if (optional) {
          metrics.handling.triageSkipped++;
          throw e;
        }
        // 429 while the per-minute budget still has room = the 2-concurrent-requests ceiling (e.g. a request we
        // timed out is still running on the platform). That clears in seconds: short wait, then retry.
        const budgetLeft = (metrics.lastQuota?.remaining ?? 0) > 1;
        if (budgetLeft && parallelRetries < 3) {
          parallelRetries++;
          metrics.handling.waitedAndRetried++;
          notices.add("quota_wait");
          const shortWait = Math.min(e.retryAfterMs ?? 2000, 2000 * parallelRetries);
          release();
          report("waiting_quota", { seconds: Math.ceil(shortWait / 1000) });
          await sleep(shortWait);
          continue;
        }
        // Team quota exhausted: wait the stated delay, then retry (twice at most).
        const wait = e.retryAfterMs ?? 3000;
        if (quotaRetries < 2 && wait <= aiConfig.maxQuotaWaitMs) {
          quotaRetries++;
          metrics.handling.waitedAndRetried++;
          notices.add("quota_wait");
          release();
          report("waiting_quota", { seconds: Math.ceil(wait / 1000) });
          await sleep(wait);
          continue;
        }
        metrics.handling.deferredToChild++;
        throw new Deferred(Math.ceil(wait / 1000));
      }

      if (e.kind === "busy503") {
        if (cls === "mid") {
          // Mid-size saturated: one short retry if the delay is tiny, else fall back to compact.
          if (busyRetries === 0 && (e.retryAfterMs ?? Infinity) <= 2000) {
            busyRetries++;
            metrics.handling.waitedAndRetried++;
            release();
            report("retrying");
            await sleep(e.retryAfterMs ?? 1000);
            continue;
          }
          metrics.handling.fellBackToCompact++;
          notices.add("fallback");
          cls = "compact";
          tokens = Math.min(tokens, aiConfig.maxTokens.compact);
          release();
          report("busy_fallback");
          continue;
        }
        const wait = Math.min(e.retryAfterMs ?? 3000, 8000);
        if (busyRetries < 1) {
          busyRetries++;
          metrics.handling.waitedAndRetried++;
          release();
          report("waiting_quota", { seconds: Math.ceil(wait / 1000) });
          await sleep(wait);
          continue;
        }
        metrics.handling.deferredToChild++;
        throw new Deferred(Math.ceil(wait / 1000));
      }

      if (e.kind === "bad400" && !shrunk) {
        // Request beyond a ceiling: the message says which. Halve the answer budget, drop extra context, retry once.
        shrunk = true;
        metrics.handling.shrankAndRetried++;
        notices.add("shrunk");
        tokens = Math.max(80, Math.floor(tokens / 2));
        msgs = msgs
          .filter((m, i) => m.role === "system" || i === msgs.length - 1)
          .map((m) => (m.role === "system" ? { ...m, content: m.content.replace(/Curriculum notes[\s\S]*?(?=\nMaximum)/, "") } : { ...m, content: m.content.slice(0, 600) }));
        release();
        report("fixing_request");
        continue;
      }

      if ((e.kind === "timeout" || e.kind === "network" || e.kind === "other") && netRetries < 1) {
        netRetries++;
        release();
        if (cls === "mid") {
          metrics.handling.fellBackToCompact++;
          notices.add("fallback");
          cls = "compact";
          tokens = Math.min(tokens, aiConfig.maxTokens.compact);
          report("busy_fallback");
        } else {
          report("retrying");
          await sleep(1000);
        }
        continue;
      }
      throw e;
    } finally {
      release();
    }
  }
  throw new LlmError("other", 0, null, "Too many attempts");
}

/** The last sentence holding a calculation ("…7 × 3 is 21. Now try 6 × 5." → "Now try 6 × 5."). */
function lastCalcSentence(text: string): string {
  const parts = text.split(/(?<=[.!?؟\n])\s+/).reverse();
  return parts.find((p) => parseCalculation(p)?.kind === "op") ?? "";
}

/** System prompt for translating an answer. The quiz rule is added only when the text really is a quiz. */
function translatePrompt(target: Lang, grade: number, text: string): string {
  const isQuiz = /^\s*A[).:]/m.test(text) && /^\s*B[).:]/m.test(text);
  return [
    `Session tags: task=translate lang=${target}. Translate the text into ${LANG_NAME[target]} for a child of about ${grade + 5}.`,
    "Keep the same meaning, every number and emoji, and the same line breaks. Do not add anything.",
    isQuiz ? 'Keep the "A)" and "B)" option lines exactly as lines starting with A) and B).' : "",
    target === "fr" ? "Speak to the child with « tu », never « vous »." : "",
    "Output only the translation.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Compares a bare-number reply with the exact result of the calculation in the recent conversation. */
function gradeNumber(reply: string, sources: string[]): { right: boolean; given: string; expected: string; question: string } | null {
  const m = reply.match(/^\s*(-?\d+)(?:\s*\/\s*(\d+))?\s*[.!]?\s*$/);
  if (!m) return null;
  for (const src of sources) {
    const c = src ? parseCalculation(src) : null;
    if (!c || c.kind !== "op") continue;
    const given = { n: Number(m[1]), d: m[2] ? Number(m[2]) : 1 };
    if (!given.d) return null;
    const show = (f: { n: number; d: number }) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
    // Whole-number division with a remainder (17 ÷ 3): grades 3–6 answer "5 remainder 2", so the quotient is right.
    if (c.op === "÷" && c.a.d === 1 && c.b.d === 1 && c.r.d !== 1) {
      const q = Math.floor(c.a.n / c.b.n);
      return { right: given.d === 1 && given.n === q, given: show(given), expected: `${q} remainder ${c.a.n % c.b.n}`, question: `${show(c.a)} ${c.op} ${show(c.b)}` };
    }
    return { right: given.n * c.r.d === c.r.n * given.d, given: show(given), expected: show(c.r), question: `${show(c.a)} ${c.op} ${show(c.b)}` };
  }
  return null;
}

/** Keeps only "<question>\nA) …\nB) …" from a model's quiz, or returns null when the format is broken. */
function cleanQuiz(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const ia = lines.findIndex((l) => /^\(?A[).:]/i.test(l));
  const ib = lines.findIndex((l) => /^\(?B[).:]/i.test(l));
  if (ia < 1 || ib !== ia + 1) return null;
  const q = lines[ia - 1];
  if (!/[?؟]\s*$/.test(q)) return null;
  const opt = (l: string) => l.replace(/^\(?[AB][).:]\s*/i, "").trim();
  const a = opt(lines[ia]);
  const b = opt(lines[ib]);
  if (!a || !b || a === b) return null;
  return `🎯 ${q}\nA) ${a}\nB) ${b}`;
}

function local(answer: string, lang: Lang, route: string, started: number, extra: Partial<ChatResult> = {}): ChatResult {
  metrics.localAnswers++;
  recordRoute(route);
  return { answer, lang, modelClass: "local", route, notices: [], confused: false, sources: [], calls: 0, ms: Date.now() - started, ...extra };
}

export async function answerQuestion(input: AskInput, report: Report): Promise<ChatResult> {
  const started = Date.now();
  metrics.requests++;
  report("reading");

  const raw = input.text.trim().slice(0, 600);
  const lang = chooseLanguage(raw, input.defaultLang);
  if (!raw) return local(LOCAL_REPLIES.empty[lang], lang, "local_empty", started);

  const flag = localSafetyFlag(raw);
  if (flag) return local(LOCAL_REPLIES[flag][lang], lang, `local_${flag}`, started);
  if (isGreeting(raw) && input.mode !== "summary") return local(LOCAL_REPLIES.greeting[lang], lang, "local_greeting", started);

  const ready = aiReady();
  if (!ready.ok) throw new Error(`AI not configured: missing ${ready.missing.join(", ")} (or set MOCK_MODE=true).`);

  const { text, masked } = maskPersonalData(raw);
  const history = input.history.slice(-6).map((h) => ({ role: h.role, text: maskPersonalData(h.text.slice(0, 500)).text }));
  // The conversation so far always goes with the question: without it, a reply like "15" or "yes" makes no sense.
  const needsHistory = history.length > 0;

  // A short reply right after Nouri asked something is an ANSWER: check it, whatever mode button is still selected.
  const lastNova = [...history].reverse().find((h) => h.role === "assistant")?.text ?? "";
  const novaAsked = /[?؟]\s*\W*$/u.test(lastNova.trim()) || /\nA\)[\s\S]*\nB\)/.test(lastNova);
  const looksLikeReply = text.split(/\s+/).length <= 10 && !/[?؟]\s*$/.test(text);
  // A bare number or fraction ("15", "3/4") after a maths exchange is an answer even if Nouri didn't end on a question.
  const bareNumber = /^\s*-?\d+(?:\s*\/\s*\d+)?\s*[.!]?\s*$/.test(text);
  // Any selected mode except "sum up": a stale Quiz/Hint button must never turn a child's answer into a new question.
  const autoCheck = (novaAsked || bareNumber) && history.length > 0 && looksLikeReply && input.mode !== "check" && input.mode !== "summary";
  if (autoCheck) input = { ...input, mode: "check" };

  const key = cacheKey([
    input.mode, input.grade, lang, input.subject.toLowerCase(), input.group ? "g" : "s", normalize(text),
    needsHistory ? normalize(history.map((h) => h.text).join(" ")) : "",
  ]);
  const cached = cacheGet<ChatResult>(key);
  if (cached) {
    metrics.cacheHits++;
    recordRoute("cache");
    report("cache_hit");
    return { ...cached, modelClass: "cache", calls: 0, ms: Date.now() - started, notices: masked.length ? ["masked"] : [] };
  }
  const pending = getInflight<ChatResult>(key);
  if (pending) {
    metrics.coalesced++;
    recordRoute("coalesced");
    const r = await pending;
    return { ...r, modelClass: "cache", calls: 0, ms: Date.now() - started };
  }

  const work = (async (): Promise<ChatResult> => {
    const notices = new Set<string>(masked.length ? ["masked"] : []);
    const counters = { calls: 0 };

    report("notes");
    const lastChildQuestion = [...history].reverse().find((h) => h.role === "user")?.text ?? "";
    // Follow-ups search the notes with the earlier question too, so "and why?" still finds the right note.
    const ragQuery = needsHistory && text.split(/\s+/).length <= 10 ? `${lastChildQuestion} ${text}` : text;
    const hits: Retrieved[] = await retrieve(ragQuery, input.subject);
    const noteId = hits[0]?.note.id ?? "";
    const context = contextBlock(hits);
    const sources = hits.map((h) => noteText(h.note, lang).title);

    const q = metrics.lastQuota;
    const lowQuota = q?.remaining != null && q.remaining <= aiConfig.lowQuotaThreshold;

    const convo: ChatMessage[] = needsHistory
      ? history.map((h) => ({ role: h.role, content: h.text }) as ChatMessage)
      : [];
    convo.push({ role: "user", content: text });

    try {
      // Narrow before generating: exact arithmetic is computed locally and handed to the model as a fact.
      // Exact arithmetic also for replies: "15" after "what is 3 × 5?" is checked against the real result.
      // Most recent first: the calculation Nouri just asked about, then the child's earlier question.
      const calc = verifiedCalculation(text) ?? (needsHistory ? verifiedCalculation(lastCalcSentence(lastNova)) ?? verifiedCalculation(lastChildQuestion) : null);
      if (autoCheck) notices.add("auto_check");
      // Grade numeric answers in code: the model only phrases the verdict, it never decides it.
      const verdict = input.mode === "check" ? gradeNumber(text, [lastCalcSentence(lastNova), lastChildQuestion]) : null;
      if (calc) notices.add("verified_math");
      // On a wrong answer the exact result stays out of the prompt, so the model cannot give it away.
      let ctx = calc && !(verdict && !verdict.right) ? `${context}\nVerified calculation (exact, computed by the app; never contradict it): ${calc}`.trim() : context;
      if (verdict) {
        notices.add("verified_math");
        ctx += verdict.right
          ? `\nAnswer check (computed by the app): for ${verdict.question}, the child's answer ${verdict.given} is RIGHT. Start with ✅ and praise it.`
          : `\nAnswer check (computed by the app): for ${verdict.question}, the child's answer ${verdict.given} is NOT right (the right result is ${verdict.expected}). Do NOT say the right result. Say kindly it is not quite, and give ONE small hint about ${verdict.question} only.`;
      }
      const confusedLocal = CONFUSED_RE.test(text);

      // Arabic & Darija: in the 17 Nov comparison every model on the platform wrote unreliable Arabic/Darija.
      // When a teacher-written note matches, the child gets that note in their own language (exact numbers added);
      // compact triage still double-checks safety. With no matching note, the mid-size model answers in Arabic.
      if ((lang === "ar" || lang === "darija") && hits.length && CURATED_MODES.includes(input.mode)) {
        const triage = !lowQuota && TRIAGE_MODES.includes(input.mode)
          ? await resilientCall("compact", [{ role: "system", content: triagePrompt(lang, noteId) }, { role: "user", content: text }], 60, report, notices, counters, 0, true)
              .then((t) => (recordRoute("compact_triage"), parseTriage(t.text)))
              .catch(() => null)
          : null;
        if (triage && (!triage.safe || triage.intent === "unsafe") && (await confirmUnsafe(text, report, notices, counters))) return finishLocal(LOCAL_REPLIES.unsafe[lang], "triage_unsafe");
        if (triage?.intent === "greeting") return finishLocal(LOCAL_REPLIES.greeting[lang], "triage_greeting");
        const body = curatedAnswer(input.mode, lang, noteId, text);
        const curatedText = calc && input.mode !== "hint" && input.mode !== "quiz" ? `✅ ${calc}\n\n${body}` : body;
        notices.add("curated");
        recordRoute(`curated_${input.mode}`);
        metrics.localAnswers++;
        const result: ChatResult = { answer: curatedText, lang, modelClass: "local", route: `curated_${input.mode}`, notices: [...notices], confused: confusedLocal || Boolean(triage?.confused), sources, calls: counters.calls, ms: Date.now() - started };
        cacheSet(key, result);
        report("done");
        return result;
      }

      // Final child-facing writing goes to the mid-size model (API Guide §7); compact when quota is low.
      const writer: ModelClass = lowQuota || COMPACT_WRITES.includes(input.mode) ? "compact" : "mid";
      const route = `${writer}_${input.mode}`;
      // No model on the platform writes usable Darija (17 Nov comparison). Without a matching team note we say so
      // kindly instead of showing a made-up answer: Darija in Arabic letters goes to Arabic, Latin-letter Darija gets a local reply.
      if (lang === "darija" && !/[\u0600-\u06FF]/.test(text) && detectLanguage(text, "darija") === "darija") return finishLocal(DARIJA_NO_NOTE, "local_darija_no_note");
      const writeLang: Lang = lang === "darija" ? "ar" : lang;
      const sys = systemPrompt({ task: input.mode, lang: writeLang, grade: input.grade, noteId, words: WORDS[input.mode], group: input.group, confused: confusedLocal, context: ctx, rules: TASK_RULES[input.mode] });

      // Compact triage and the answer run in PARALLEL: the key allows 2 concurrent requests, so the child
      // waits for the slower call only. Triage still has the last word on safety: an unsafe verdict discards the answer.
      let triageP: Promise<Triage | null> = Promise.resolve(null);
      if (lowQuota) {
        metrics.handling.lowQuotaRouting++;
        notices.add("low_quota");
        report("low_quota");
      } else if (TRIAGE_MODES.includes(input.mode)) {
        report("triage");
        triageP = resilientCall("compact", [{ role: "system", content: triagePrompt(lang, noteId) }, { role: "user", content: text }], 60, report, notices, counters, 0, true)
          .then((t) => {
            recordRoute("compact_triage");
            return parseTriage(t.text);
          })
          .catch((e: unknown) => {
            // Triage is a safety net on top of the local filter: its failure never blocks the child.
            if (!(e instanceof LlmError && e.kind === "quota429")) metrics.handling.triageSkipped++;
            return null;
          });
      }
      const answerP = resilientCall(writer, [{ role: "system", content: sys }, ...convo], aiConfig.maxTokens[writer], report, notices, counters).then(
        (v) => ({ ok: true as const, v }),
        (e: unknown) => ({ ok: false as const, e }),
      );
      // The child never waits long for the double-check: once the answer is ready, triage gets 3 more seconds.
      const answer = await answerP;
      let triageLate = false;
      const triage = await Promise.race([
        triageP,
        sleep(3000).then(() => {
          triageLate = true;
          return null;
        }),
      ]);
      if (triageLate) metrics.handling.triageSkipped++;

      if (triage && (!triage.safe || triage.intent === "unsafe") && (await confirmUnsafe(text, report, notices, counters))) return finishLocal(LOCAL_REPLIES.unsafe[lang], "triage_unsafe");
      if (triage?.intent === "greeting") return finishLocal(LOCAL_REPLIES.greeting[lang], "triage_greeting");
      // Off-topic verdicts are not used to block: the compact model flagged real school questions as off-topic in testing.
      if (!answer.ok) throw answer.e;

      const confused = confusedLocal || Boolean(triage?.confused);
      recordRoute(answer.v.cls === writer ? route : `${answer.v.cls}_${input.mode}`);

      // Translation safety net: if the model answered in the child's typing language instead of the selected one,
      // one short mid-size call translates it (only on a mismatch, so it rarely costs anything).
      let finalText = answer.v.text;
      if (wrongLanguage(finalText, writeLang)) {
        try {
          const tr = await resilientCall(
            "mid",
            [
              {
                role: "system",
                content: translatePrompt(writeLang, input.grade, finalText),
              },
              { role: "user", content: finalText },
            ],
            aiConfig.maxTokens.mid,
            report,
            notices,
            counters,
            0.2,
          );
          if (!wrongLanguage(tr.text, writeLang)) {
            finalText = tr.text;
            notices.add("translated");
            metrics.handling.translated++;
          }
        } catch {
          /* keep the original answer rather than leave the child without one */
        }
      }
      // Quiz: validate the fixed format locally (question + "A)" + "B)"). A malformed quiz is replaced by the
      // team's quiz for the matching note, so the child never sees a broken question.
      if (input.mode === "quiz") {
        const fixed = cleanQuiz(finalText);
        if (fixed) return finish(fixed, answer.v.cls, route, confused);
        if (hits.length) {
          metrics.handling.quizRepaired++;
          notices.add("curated");
          return finish(curatedAnswer("quiz", lang, noteId, text), answer.v.cls, `${route}_repaired`, confused);
        }
      }
      return finish(finalText, answer.v.cls, route, confused);
    } catch (e) {
      if (e instanceof Deferred) {
        const msg: Record<Lang, string> = {
          en: `I'm catching my breath: lots of learners are asking right now. I'll be ready in about ${e.retryAfterSec} seconds. ⏳`,
          fr: `Je reprends mon souffle : beaucoup d'élèves posent des questions. Je suis prêt dans environ ${e.retryAfterSec} secondes. ⏳`,
          ar: `أنا ألتقط أنفاسي: كثير من التلاميذ يسألون الآن. سأكون جاهزًا بعد ${e.retryAfterSec} ثانية تقريبًا. ⏳`,
          darija: `نرتاح شوية: برشا تلامذة يسألو توا. نكون حاضر بعد ${e.retryAfterSec} ثانية تقريبًا. ⏳`,
        };
        return { answer: msg[lang], lang, modelClass: "local", route: "deferred_quota", notices: ["deferred"], confused: false, sources, calls: counters.calls, retryAfterSec: e.retryAfterSec, ms: Date.now() - started };
      }
      throw e;
    }

    function finishLocal(answer: string, route: string): ChatResult {
      recordRoute(route);
      metrics.localAnswers++;
      return { answer, lang, modelClass: "local", route, notices: [...notices], confused: false, sources: [], calls: counters.calls, ms: Date.now() - started };
    }

    function finish(answer: string, cls: ModelClass, route: string, confused = false): ChatResult {
      // The model's own refusal ("I cannot provide…") is a third safety layer; show the kind, child-friendly version.
      if (MODEL_REFUSAL.test(answer.trim())) {
        metrics.handling.modelRefusals++;
        return finishLocal(LOCAL_REPLIES.unsafe[lang], "model_refusal");
      }
      const clean = answer.replace(/https?:\/\/\S+/g, "").trim();
      const result: ChatResult = { answer: clean, lang, modelClass: cls, route, notices: [...notices], confused, sources, calls: counters.calls, ms: Date.now() - started };
      // Don't cache degraded answers (fallback / low quota): next time the better model can answer.
      if (!notices.has("fallback") && !notices.has("low_quota") && !notices.has("shrunk")) cacheSet(key, result);
      report("done");
      return result;
    }
  })();

  setInflight(key, work);
  return work;
}

/**
 * Translates an answer already on the child's screen when they switch language.
 * No call when the text is already in that language; one short mid-size call otherwise, cached so
 * switching back and forth never pays twice. Darija is written in simple Modern Standard Arabic
 * (no platform model writes reliable Darija), which an Arabic voice can also read aloud.
 */
export async function translateAnswer(text: string, to: Lang, grade: number): Promise<{ text: string; translated: boolean }> {
  const clean = text.slice(0, 2000);
  const target: Lang = to === "darija" ? "ar" : to;
  if (!wrongLanguage(clean, target)) return { text: clean, translated: false };
  const key = cacheKey(["translate", target, grade, normalize(clean)]);
  const hit = cacheGet<string>(key);
  if (hit) {
    metrics.cacheHits++;
    return { text: hit, translated: true };
  }
  metrics.requests++;
  const r = await resilientCall(
    "mid",
    [
      {
        role: "system",
        content: translatePrompt(target, grade, clean),
      },
      { role: "user", content: clean },
    ],
    aiConfig.maxTokens.mid,
    () => {},
    new Set<string>(),
    { calls: 0 },
    0.2,
  );
  if (wrongLanguage(r.text, target)) throw new Error("translation came back in the wrong language");
  metrics.handling.translated++;
  recordRoute("mid_translate");
  cacheSet(key, r.text);
  return { text: r.text, translated: true };
}
