import { aiConfig } from "./config";
import { normalize } from "./cache";
import { NOTES, type Note } from "./knowledge";
import { metrics } from "./metrics";

// Narrow-before-generating: find the 1–2 curriculum notes that fit the question, so the
// model receives a short, relevant context instead of a long prompt.
// Retrieval = keyword scoring (free, always on) + embeddings similarity when the platform's
// embeddings endpoint is configured (separate quota, results cached in memory).

export type Retrieved = { note: Note; score: number };

function hasTerm(q: string, tokens: Set<string>, term: string): boolean {
  if (!term) return false;
  // Phrases and Arabic script (prefixes like ال) use substring match; single Latin words match whole tokens.
  if (term.includes(" ") || /[؀-ۿ]/.test(term)) return q.includes(term);
  return tokens.has(term) || tokens.has(term + "s") || tokens.has(term + "es");
}

function keywordScore(q: string, note: Note, subject?: string): number {
  const tokens = new Set(q.split(" "));
  let s = 0;
  for (const k of note.keywords) {
    const kn = normalize(k);
    if (hasTerm(q, tokens, kn)) s += kn.includes(" ") ? 3 : 2;
  }
  for (const w of normalize(note.title).split(" ")) if (w.length > 3 && tokens.has(w)) s += 1;
  if (subject && note.subject.toLowerCase() === subject.toLowerCase()) s += 0.5;
  return s;
}

type EmbStore = { notes?: Promise<number[][] | null>; queries: Map<string, number[]> };
const g = globalThis as unknown as { __ednovaEmb?: EmbStore };
const embStore: EmbStore = (g.__ednovaEmb ??= { queries: new Map<string, number[]>() });

async function embed(texts: string[]): Promise<number[][] | null> {
  if (aiConfig.mock || !aiConfig.embeddingsModel || !aiConfig.embeddingsBaseUrl || !aiConfig.apiKey) return null;
  metrics.embeddings.calls++;
  try {
    const res = await fetch(`${aiConfig.embeddingsBaseUrl}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiConfig.apiKey}` },
      body: JSON.stringify({ model: aiConfig.embeddingsModel, input: texts }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { embedding: number[] }[] };
    if (!data.data || data.data.length !== texts.length) return null;
    metrics.embeddings.ok++;
    return data.data.map((d) => d.embedding);
  } catch {
    return null;
  }
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na * nb) || 1);
}

export async function retrieve(question: string, subject?: string, k = 2): Promise<Retrieved[]> {
  const q = normalize(question);
  const scored = NOTES.map((note) => ({ note, score: keywordScore(q, note, subject) }));

  // Index the notes once (one batched embeddings call), then one call per new question.
  embStore.notes ??= embed(NOTES.map((n) => `${n.title}. ${n.facts}`));
  const noteVecs = await embStore.notes;
  if (noteVecs) {
    let qv = embStore.queries.get(q);
    if (qv) metrics.embeddings.cached++;
    else {
      const r = await embed([question]);
      if (r) {
        qv = r[0];
        embStore.queries.set(q, qv);
        if (embStore.queries.size > 1000) embStore.queries.delete(embStore.queries.keys().next().value as string);
      }
    }
    if (qv) scored.forEach((s, i) => (s.score += Math.max(0, cosine(qv!, noteVecs[i])) * 6));
  } else if (embStore.notes && !noteVecs) {
    embStore.notes = undefined; // retry indexing on a later request
  }

  // Arithmetic written with symbols ("7x3", "3/4", "12 ÷ 4") points straight at the right note.
  const boost = (id: string) => scored.forEach((s) => s.note.id === id && (s.score += 3));
  if (/\d\s*[x×*]\s*\d/i.test(question)) boost("math-multiplication");
  if (/\d\s*\/\s*\d/.test(question)) boost("math-fractions");
  if (/\d\s*[÷:]\s*\d/.test(question)) boost("math-division");

  return scored
    .filter((s) => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function contextBlock(hits: Retrieved[]): string {
  if (!hits.length) return "";
  return hits
    .map((h) => `[${h.note.title}] ${h.note.facts} Analogy: ${h.note.analogy} Example: ${h.note.example}`)
    .join("\n");
}
