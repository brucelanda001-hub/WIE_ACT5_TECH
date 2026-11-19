import { aiConfig, type ModelClass } from "./config";
import { metrics, recordCall, type QuotaSnapshot } from "./metrics";
import { MockError, mockChat } from "./mock";
import { resolveModels } from "./models";

// Plain fetch to the OpenAI-compatible /chat/completions endpoint (no SDK), so that:
//  - there are no hidden automatic retries: every retry is ours, visible and counted;
//  - we read the quota headers on every response (API Guide §5–6).

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type CallResult = { text: string; tokensIn: number; tokensOut: number; ms: number; model: string };

export class LlmError extends Error {
  constructor(
    public kind: "quota429" | "busy503" | "bad400" | "auth" | "timeout" | "network" | "other",
    public status: number,
    public retryAfterMs: number | null,
    message: string,
  ) {
    super(message);
  }
}

function parseRetryAfter(h: Headers): number | null {
  const ms = h.get("retry-after-ms");
  if (ms && !Number.isNaN(Number(ms))) return Number(ms);
  const ra = h.get("retry-after");
  if (!ra) return null;
  if (!Number.isNaN(Number(ra))) return Number(ra) * 1000;
  const date = Date.parse(ra);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

const firstNum = (h: Headers, names: string[]) => {
  for (const n of names) {
    const v = h.get(n);
    if (v != null && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
};

/** Reads whatever quota headers the platform sends ("200 + quota headers"). */
export function readQuota(h: Headers): QuotaSnapshot | null {
  const raw: Record<string, string> = {};
  h.forEach((v, k) => {
    if (/ratelimit|quota|remaining|retry-after/i.test(k)) raw[k] = v;
  });
  if (!Object.keys(raw).length) return null;
  // The challenge platform (LiteLLM) sends per-key headers such as
  // x-ratelimit-api_key-remaining-requests / -limit-requests / -remaining-max_parallel_requests.
  return {
    remaining: firstNum(h, [
      "x-ratelimit-api_key-remaining-requests",
      "x-ratelimit-remaining-requests",
      "x-ratelimit-remaining",
      "ratelimit-remaining",
      "x-quota-remaining",
    ]),
    limit: firstNum(h, ["x-ratelimit-api_key-limit-requests", "x-litellm-key-rpm-limit", "x-ratelimit-limit-requests", "x-ratelimit-limit", "ratelimit-limit", "x-quota-limit"]),
    resetSec: firstNum(h, ["x-ratelimit-reset-requests", "x-ratelimit-reset", "ratelimit-reset", "x-quota-reset"]),
    parallelLimit: firstNum(h, ["x-ratelimit-api_key-limit-max_parallel_requests"]),
    raw,
    at: new Date().toISOString(),
  };
}

// ---- Pacing (API Guide §5–6: "read the remaining quota and pace requests accordingly") ----
// The key allows N requests per rolling minute (token bucket, continuous refill). We keep our own
// record of sent requests so we wait *before* the platform has to refuse us with a 429.
const pg = globalThis as unknown as { __ednovaSent?: number[] };
const sent = (pg.__ednovaSent ??= []);

/** Milliseconds to wait before the next call fits the per-minute budget (0 = go now). */
export function paceDelayMs(now = Date.now()): number {
  if (aiConfig.mock) return 0;
  while (sent.length && now - sent[0] >= 60_000) sent.shift();
  const limit = metrics.lastQuota?.limit ?? aiConfig.rpmLimit;
  const remaining = metrics.lastQuota?.remaining;
  const freshHeaders = metrics.lastQuota && now - Date.parse(metrics.lastQuota.at) < 60_000;
  let wait = 0;
  // Keep one unit spare so a child's follow-up is never the request that hits the wall.
  if (sent.length >= Math.max(1, limit - 1)) wait = sent[0] + 60_000 - now;
  // Headers say the bucket is empty: one unit refills every 60/limit seconds.
  if (freshHeaders && remaining != null && remaining <= 0) wait = Math.max(wait, Math.ceil(60_000 / Math.max(1, limit)));
  return Math.max(0, wait);
}

function markSent() {
  sent.push(Date.now());
}

/** Reasoning models (e.g. Qwen3) may wrap thoughts in <think>…</think>: never show those to a child. */
function stripThinking(t: string) {
  return t.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*<\/think>/i, "").trim();
}

export async function callChat(cls: ModelClass, messages: ChatMessage[], opts: { maxTokens: number; temperature?: number }): Promise<CallResult> {
  const started = Date.now();

  if (aiConfig.mock) {
    try {
      const r = await mockChat(cls, messages, opts.maxTokens);
      metrics.lastQuota = r.quota;
      recordCall(cls, true, Date.now() - started, r.tokensIn, r.tokensOut);
      return { text: r.text, tokensIn: r.tokensIn, tokensOut: r.tokensOut, ms: Date.now() - started, model: `mock-${cls}` };
    } catch (e) {
      recordCall(cls, false, Date.now() - started);
      if (e instanceof MockError) throw new LlmError(e.kind, e.status, e.retryAfterMs, e.message);
      throw e;
    }
  }

  let model: string;
  try {
    model = (await resolveModels())[cls];
  } catch (e) {
    if (e instanceof Error && e.message === "AUTH") throw new LlmError("auth", 401, null, "API key refused");
    throw new LlmError("network", 0, null, "Could not list the platform models");
  }
  let res: Response;
  try {
    markSent();
    res = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiConfig.apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens, temperature: opts.temperature ?? 0.4, stream: false }),
      signal: AbortSignal.timeout(aiConfig.timeoutMs[cls]),
    });
  } catch (e) {
    recordCall(cls, false, Date.now() - started);
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new LlmError(timeout ? "timeout" : "network", 0, null, timeout ? "The model took too long" : "Network error");
  }

  const quota = readQuota(res.headers);
  if (quota) metrics.lastQuota = quota;

  if (!res.ok) {
    recordCall(cls, false, Date.now() - started);
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } | string; message?: string };
      detail = typeof body.error === "string" ? body.error : body.error?.message || body.message || "";
    } catch {
      /* body not JSON */
    }
    const retryAfterMs = parseRetryAfter(res.headers);
    const kind =
      res.status === 429 ? "quota429" : res.status === 503 ? "busy503" : res.status === 400 ? "bad400" : res.status === 401 || res.status === 403 ? "auth" : "other";
    throw new LlmError(kind, res.status, retryAfterMs, detail.slice(0, 300) || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = stripThinking(data.choices?.[0]?.message?.content || "");
  const tokensIn = data.usage?.prompt_tokens ?? 0;
  const tokensOut = data.usage?.completion_tokens ?? 0;
  recordCall(cls, Boolean(text), Date.now() - started, tokensIn, tokensOut);
  if (!text) throw new LlmError("other", 200, null, "Empty answer");
  return { text, tokensIn, tokensOut, ms: Date.now() - started, model };
}
