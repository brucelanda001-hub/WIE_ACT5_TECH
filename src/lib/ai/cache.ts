import { createHash } from "node:crypto";
import { aiConfig } from "./config";

// Equivalent requests are never regenerated: answer cache + in-flight coalescing.
type Entry<T> = { value: T; at: number };
const MAX = 500;

const g = globalThis as unknown as { __ednovaCache?: Map<string, Entry<unknown>>; __ednovaInflight?: Map<string, Promise<unknown>> };
const store = (g.__ednovaCache ??= new Map());
const inflight = (g.__ednovaInflight ??= new Map());

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[ً-ْ]/g, "") // Arabic diacritics
    .replace(/[?!.,;:'"«»()¿¡،؟]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cacheKey(parts: (string | number | undefined)[]): string {
  return createHash("sha256").update(parts.map((p) => String(p ?? "")).join("|")).digest("base64url");
}

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key) as Entry<T> | undefined;
  if (!e) return undefined;
  if (Date.now() - e.at > aiConfig.cacheTtlMs) {
    store.delete(key);
    return undefined;
  }
  store.delete(key); // refresh LRU order
  store.set(key, e);
  return e.value;
}

export function cacheSet<T>(key: string, value: T) {
  store.set(key, { value, at: Date.now() });
  while (store.size > MAX) store.delete(store.keys().next().value as string);
}

export function getInflight<T>(key: string): Promise<T> | undefined {
  return inflight.get(key) as Promise<T> | undefined;
}

export function setInflight<T>(key: string, p: Promise<T>) {
  inflight.set(key, p);
  p.finally(() => inflight.delete(key)).catch(() => {});
}
