import { aiConfig, type ModelClass } from "./config";

// If LLM_MODEL_COMPACT / LLM_MODEL_MID are not set, ask the platform (GET /v1/models) and pick:
//   compact = largest model under 3B parameters, mid = largest model up to 16B (API Guide §2).
// Sizes are read from the model id (e.g. "qwen2.5-1.5b-instruct", "llama-3.1-8b").

export type Resolved = Record<ModelClass, string> & { available: string[]; source: "env" | "platform" };

const g = globalThis as unknown as { __ednovaModels?: Promise<Resolved> };

function sizeB(id: string): number | null {
  const m = id.toLowerCase().match(/(\d+(?:\.\d+)?)\s*b(?![a-z])/);
  return m ? Number(m[1]) : null;
}

export function pickModels(ids: string[]): { compact: string; mid: string } {
  const sized = ids.map((id) => ({ id, b: sizeB(id) })).filter((x): x is { id: string; b: number } => x.b !== null);
  const compact = sized.filter((x) => x.b < 3).sort((a, b) => b.b - a.b)[0]?.id;
  const mid = sized.filter((x) => x.b >= 3 && x.b <= 16).sort((a, b) => b.b - a.b)[0]?.id;
  return { compact: compact || ids[0] || "", mid: mid || compact || ids[0] || "" };
}

async function discover(): Promise<Resolved> {
  const env = aiConfig.models;
  if (env.compact && env.mid) return { ...env, available: [env.compact, env.mid], source: "env" };
  const res = await fetch(`${aiConfig.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${aiConfig.apiKey}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401 || res.status === 403) throw new Error("AUTH");
  if (!res.ok) throw new Error(`models HTTP ${res.status}`);
  const data = (await res.json()) as { data?: { id: string }[] };
  const ids = (data.data || []).map((d) => d.id).filter(Boolean);
  const picked = pickModels(ids);
  const out: Resolved = { compact: env.compact || picked.compact, mid: env.mid || picked.mid, available: ids, source: "platform" };
  console.log(`[ai] models from platform: compact=${out.compact} mid=${out.mid} (available: ${ids.join(", ")})`);
  return out;
}

export function resolveModels(): Promise<Resolved> {
  if (!g.__ednovaModels) {
    g.__ednovaModels = discover().catch((e) => {
      g.__ednovaModels = undefined; // try again on the next question
      throw e;
    });
  }
  return g.__ednovaModels;
}

export function knownModels(): Promise<Resolved | null> {
  return g.__ednovaModels ? g.__ednovaModels.catch(() => null) : Promise.resolve(null);
}
