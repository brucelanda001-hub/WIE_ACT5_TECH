// All platform settings come from the environment. Nothing here is a secret or a URL default.
export type ModelClass = "compact" | "mid";

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const aiConfig = {
  mock: process.env.MOCK_MODE === "true",
  /** e.g. "mid503=0.3,quota429=0.1,bad400=0.05": inject platform errors in mock mode to rehearse the fallback demo. */
  mockFaults: process.env.MOCK_FAULTS || "",
  baseUrl: (process.env.LLM_BASE_URL || "").replace(/\/+$/, ""),
  apiKey: process.env.LLM_API_KEY || "",
  models: {
    compact: process.env.LLM_MODEL_COMPACT || "",
    mid: process.env.LLM_MODEL_MID || "",
  } as Record<ModelClass, string>,
  embeddingsBaseUrl: (process.env.EMBEDDINGS_BASE_URL || process.env.LLM_BASE_URL || "").replace(/\/+$/, ""),
  embeddingsModel: process.env.LLM_MODEL_EMBEDDINGS || "",
  concurrency: {
    compact: num(process.env.LLM_MAX_CONCURRENCY_COMPACT, 3),
    mid: num(process.env.LLM_MAX_CONCURRENCY_MID, 2),
  } as Record<ModelClass, number>,
  timeoutMs: {
    compact: num(process.env.LLM_TIMEOUT_COMPACT_MS, 30_000),
    mid: num(process.env.LLM_TIMEOUT_MID_MS, 90_000),
  } as Record<ModelClass, number>,
  maxTokens: {
    compact: num(process.env.LLM_MAX_TOKENS_COMPACT, 220),
    mid: num(process.env.LLM_MAX_TOKENS_MID, 380),
  } as Record<ModelClass, number>,
  /** Longest wait we accept for a quota refill before telling the child to come back. */
  maxQuotaWaitMs: num(process.env.LLM_MAX_QUOTA_WAIT_MS, 20_000),
  /** When the platform says this few requests remain, explanations switch to the compact model. */
  lowQuotaThreshold: num(process.env.LLM_LOW_QUOTA_THRESHOLD, 3),
  cacheTtlMs: num(process.env.LLM_CACHE_TTL_MS, 6 * 3600_000),
  /** Requests per minute allowed for the key, used until the platform's headers tell us the real value. */
  rpmLimit: num(process.env.LLM_RPM_LIMIT, 20),
};

export function aiReady(): { ok: boolean; missing: string[] } {
  if (aiConfig.mock) return { ok: true, missing: [] };
  const missing: string[] = [];
  if (!aiConfig.baseUrl) missing.push("LLM_BASE_URL");
  if (!aiConfig.apiKey) missing.push("LLM_API_KEY");
  // Model names are optional: if missing they are read from GET /v1/models (see models.ts).
  return { ok: missing.length === 0, missing };
}

/**
 * The routing table: which model class handles which step, and why.
 * Shown in the parent "AI usage" panel, the README and the pitch.
 */
export const ROUTING_TABLE: { task: string; model: ModelClass | "local"; why: string }[] = [
  { task: "Language detection, personal-data masking, safety and confusion keywords", model: "local", why: "Rules are instant and free: no call needed" },
  { task: "Exact arithmetic (7×8, 3/4 + 1/4) handed to the model as a verified fact", model: "local", why: "Code is always right; small models were not (\"7×8 = 54\" in testing)" },
  { task: "Repeated question (same mode, level, language)", model: "local", why: "Served from cache, never regenerated" },
  { task: "Curriculum search (RAG) before generating", model: "local", why: "Narrow the context first: fewer tokens, better relevance" },
  { task: "Triage: intent and safety double-check, in parallel with the answer", model: "compact", why: "Short JSON classification; running in parallel costs the child no extra wait" },
  { task: "Confirm an \"unsafe\" triage verdict before blocking (escalation)", model: "mid", why: "Compact triage flagged harmless questions in testing; one short mid call decides" },
  { task: "Explanation, example, hint, quiz, say-it-back check, summary (EN/FR)", model: "mid", why: "Final child-facing writing: compact models were slower and often wrong in our comparison" },
  { task: "Arabic and Darija with a matching team note", model: "local", why: "No platform model writes reliable Arabic/Darija: the child gets the teacher-written note" },
  { task: "Quiz format check; broken quiz replaced by the team's quiz", model: "local", why: "Validate the model's output before a child sees it" },
  { task: "Same tasks when mid-size is busy (503), times out, or quota is low", model: "compact", why: "Fallback keeps the child moving; we tell them" },
];
