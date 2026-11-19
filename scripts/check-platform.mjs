// Smoke test for the organisers' platform (API Guide §3, §5, §6).
// Reads .env.local, never prints the key or the base URL, writes scripts/check-platform.out.json.
//   node scripts/check-platform.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const base = (env.LLM_BASE_URL || "").replace(/\/+$/, "");
const key = env.LLM_API_KEY || "";
const out = { at: new Date().toISOString(), configured: { baseUrl: Boolean(base), apiKey: Boolean(key) }, steps: [] };
const auth = { Authorization: `Bearer ${key}` };

const quotaHeaders = (h) => {
  const o = {};
  h.forEach((v, k) => /ratelimit|quota|remaining|retry-after|limit/i.test(k) && (o[k] = v));
  return o;
};
const sizeB = (id) => {
  const m = id.toLowerCase().match(/(\d+(?:\.\d+)?)\s*b(?![a-z])/);
  return m ? Number(m[1]) : null;
};

async function step(name, fn) {
  const t = Date.now();
  try {
    const r = await fn();
    out.steps.push({ name, ok: true, ms: Date.now() - t, ...r });
    return r;
  } catch (e) {
    out.steps.push({ name, ok: false, ms: Date.now() - t, error: String(e?.message || e).slice(0, 300) });
    return null;
  }
}

async function json(res) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { raw: txt.slice(0, 300) };
  }
}

const models = await step("GET /models", async () => {
  const res = await fetch(`${base}/models`, { headers: auth, signal: AbortSignal.timeout(20000) });
  const body = await json(res);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  const ids = (body.data || []).map((d) => d.id);
  return { status: res.status, ids, details: (body.data || []).map((d) => ({ id: d.id, owned_by: d.owned_by, type: d.type || d.object })), quota: quotaHeaders(res.headers) };
});

const ids = models?.ids || [];
const isEmb = (id) => /embed|bge|e5|minilm|nomic|gte/i.test(id);
const sized = ids.filter((id) => !isEmb(id)).map((id) => ({ id, b: sizeB(id) }));
const compact = env.LLM_MODEL_COMPACT || sized.filter((x) => x.b !== null && x.b < 3).sort((a, b) => b.b - a.b)[0]?.id;
const mid = env.LLM_MODEL_MID || sized.filter((x) => x.b !== null && x.b >= 3 && x.b <= 16).sort((a, b) => b.b - a.b)[0]?.id;
const emb = env.LLM_MODEL_EMBEDDINGS || ids.find(isEmb);
out.picked = { compact, mid, embeddings: emb };

for (const [cls, model] of [["compact", compact], ["mid", mid]]) {
  if (!model) continue;
  await step(`chat ${cls} (${model})`, async () => {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a kind tutor for a 9-year-old. Max 25 words." },
          { role: "user", content: "Why is 3 x 4 the same as 4 x 3?" },
        ],
        max_tokens: 80,
        temperature: 0.3,
        stream: false,
      }),
      signal: AbortSignal.timeout(cls === "mid" ? 120000 : 60000),
    });
    const body = await json(res);
    const r = { status: res.status, quota: quotaHeaders(res.headers), usage: body.usage, answer: body.choices?.[0]?.message?.content?.slice(0, 300), error: res.ok ? undefined : JSON.stringify(body).slice(0, 300) };
    if (!res.ok) throw new Error(`HTTP ${res.status} ${r.error}`);
    return r;
  });
}

// Ceiling probe: ask for a very large max_tokens to read the 400 message (API Guide §6: "the error message identifies the ceiling").
if (compact)
  await step("ceiling probe (max_tokens=100000)", async () => {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ model: compact, messages: [{ role: "user", content: "Say hi" }], max_tokens: 100000, stream: false }),
      signal: AbortSignal.timeout(60000),
    });
    const body = await json(res);
    return { status: res.status, quota: quotaHeaders(res.headers), message: JSON.stringify(body.error || body).slice(0, 300) };
  });

const embBase = (env.EMBEDDINGS_BASE_URL || base).replace(/\/+$/, "");
if (emb)
  await step(`embeddings (${emb})`, async () => {
    const res = await fetch(`${embBase}/embeddings`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ model: emb, input: ["fractions are parts of a whole"] }),
      signal: AbortSignal.timeout(30000),
    });
    const body = await json(res);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
    return { status: res.status, dims: body.data?.[0]?.embedding?.length, quota: quotaHeaders(res.headers) };
  });

// Vector collection: the guide says one dedicated collection per team but not the endpoint. Probe common paths (read-only GETs).
for (const p of ["/collections", "/vector_stores", "/vectors/collections"]) {
  await step(`probe GET ${p}`, async () => {
    const res = await fetch(`${base}${p}`, { headers: auth, signal: AbortSignal.timeout(15000) });
    const body = await json(res);
    return { status: res.status, body: JSON.stringify(body).slice(0, 400) };
  });
}

const file = path.join(root, "scripts", "check-platform.out.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2));
for (const s of out.steps) console.log(`${s.ok ? "OK  " : "FAIL"} ${s.name}  ${s.ms} ms  ${s.status ?? ""} ${s.error ?? ""}`);
console.log("picked:", out.picked);
console.log("Full result:", file);
