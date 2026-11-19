import type { ModelClass } from "./config";

type ClassStats = { calls: number; ok: number; tokensIn: number; tokensOut: number; totalMs: number };
export type QuotaSnapshot = {
  remaining: number | null;
  limit: number | null;
  resetSec: number | null;
  parallelLimit?: number | null;
  raw: Record<string, string>;
  at: string;
};

function blank(): ClassStats {
  return { calls: 0, ok: 0, tokensIn: 0, tokensOut: 0, totalMs: 0 };
}

function fresh() {
  return {
    startedAt: new Date().toISOString(),
    requests: 0,
    byClass: { compact: blank(), mid: blank() } as Record<ModelClass, ClassStats>,
    embeddings: { calls: 0, ok: 0, cached: 0 },
    cacheHits: 0,
    coalesced: 0,
    localAnswers: 0,
    refusals: { quota429: 0, busy503: 0, bad400: 0, auth: 0, timeout: 0, network: 0, other: 0 },
    handling: { waitedAndRetried: 0, fellBackToCompact: 0, shrankAndRetried: 0, deferredToChild: 0, lowQuotaRouting: 0, pacedBeforeSend: 0, quizRepaired: 0, triageSkipped: 0, unsafeEscalated: 0, unsafeOverruled: 0, modelRefusals: 0, translated: 0 },
    routing: {} as Record<string, number>,
    lastQuota: null as QuotaSnapshot | null,
    peakQueue: { compact: 0, mid: 0 } as Record<ModelClass, number>,
  };
}

const g = globalThis as unknown as { __ednovaMetrics?: ReturnType<typeof fresh> };
export const metrics = (g.__ednovaMetrics ??= fresh());
// After a hot reload the stored object may predate new counters: add any that are missing.
for (const [k, v] of Object.entries(fresh().handling)) (metrics.handling as Record<string, number>)[k] ??= v;

export function recordCall(cls: ModelClass, okCall: boolean, ms: number, tokensIn = 0, tokensOut = 0) {
  const s = metrics.byClass[cls];
  s.calls++;
  if (okCall) s.ok++;
  s.totalMs += ms;
  s.tokensIn += tokensIn;
  s.tokensOut += tokensOut;
}

export function recordRoute(task: string) {
  metrics.routing[task] = (metrics.routing[task] || 0) + 1;
}

export function snapshot() {
  const c = metrics.byClass.compact;
  const m = metrics.byClass.mid;
  const llmCalls = c.calls + m.calls;
  return {
    ...metrics,
    split: {
      compactPct: llmCalls ? Math.round((c.calls / llmCalls) * 100) : 0,
      midPct: llmCalls ? Math.round((m.calls / llmCalls) * 100) : 0,
    },
    avgLatencyMs: {
      compact: c.calls ? Math.round(c.totalMs / c.calls) : 0,
      mid: m.calls ? Math.round(m.totalMs / m.calls) : 0,
    },
    cacheHitRate: metrics.requests ? Math.round(((metrics.cacheHits + metrics.coalesced) / metrics.requests) * 100) : 0,
  };
}
