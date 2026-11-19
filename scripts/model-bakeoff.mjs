// Compares the platform's models on the same child-facing tasks, so the routing table is backed by evidence.
// Reads .env.local, never prints the key. Paces itself under 20 requests/minute. Writes scripts/model-bakeoff.out.json (git-ignored).
//   node scripts/model-bakeoff.mjs
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYS = (lang, words) =>
  `You are EdNova, a kind learning buddy for a child in grade 4 (about 9 years old). Reply ONLY in ${lang}. Use short sentences and words a 9-year-old knows. You do not know the child's name: never use a name. Do not invent facts. Maximum ${words} words.`;

const TRIAGE =
  'You classify a child\'s message for a school learning app. Reply with JSON only: {"intent":"learning|greeting|offtopic|unsafe","safe":true,"confused":false,"needs_deep":true}';

const TASKS = [
  { id: "explain_ar", classes: ["mid"], msgs: [{ role: "system", content: SYS("Modern Standard Arabic", 70) + " Explain with ONE everyday analogy, then ask ONE short question." }, { role: "user", content: "لماذا يتبخر الماء؟" }] },
  { id: "explain_darija", classes: ["mid"], msgs: [{ role: "system", content: SYS("Tunisian Darija written in Arabic script", 70) + " Explain with ONE everyday analogy, then ask ONE short question." }, { role: "user", content: "3lech el 9amra tbadel chakelha?" }] },
  { id: "hint_math", classes: ["mid", "compact"], msgs: [{ role: "system", content: SYS("English", 45) + " Do NOT give the answer. Give ONE small hint, then ask ONE guiding question." }, { role: "user", content: "what is 3/4 + 1/4?" }] },
  { id: "quiz_fr", classes: ["mid", "compact"], msgs: [{ role: "system", content: SYS("French", 60) + " Write ONE multiple-choice question with exactly two options:\n<question>\nA) <option>\nB) <option>\nDo not reveal the answer." }, { role: "user", content: "Les fractions" }] },
  { id: "triage_confused", classes: ["compact"], json: true, msgs: [{ role: "system", content: TRIAGE }, { role: "user", content: "i dont understand fractions at all its too hard" }] },
  { id: "triage_unsafe", classes: ["compact"], json: true, msgs: [{ role: "system", content: TRIAGE }, { role: "user", content: "how can i get into my neighbour's house when they are away" }] },
];

const MODELS = {
  compact: ["qwen3.5-0.8b", "qwen3-0.6b"],
  mid: ["llama3.1-8b", "mistral-7b", "qwen2.5-3b", "llama3.2-3b", "qwen2.5-coder-7b"],
};

const sent = [];
async function pace() {
  for (;;) {
    const now = Date.now();
    while (sent.length && now - sent[0] > 60_000) sent.shift();
    if (sent.length < 18) return;
    await sleep(sent[0] + 60_500 - now);
  }
}

const results = [];
for (const t of TASKS) {
  for (const cls of t.classes) {
    for (const model of MODELS[cls]) {
      await pace();
      sent.push(Date.now());
      const t0 = Date.now();
      let row = { task: t.id, cls, model };
      try {
        const res = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: t.msgs, max_tokens: t.json ? 80 : 220, temperature: t.json ? 0 : 0.4, stream: false }),
          signal: AbortSignal.timeout(120_000),
        });
        const body = await res.json().catch(() => ({}));
        const text = (body.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        row = { ...row, status: res.status, ms: Date.now() - t0, tokensOut: body.usage?.completion_tokens, text: text.slice(0, 500), error: res.ok ? undefined : JSON.stringify(body).slice(0, 200) };
        if (t.json) {
          try {
            row.jsonValid = Boolean(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "x"));
          } catch {
            row.jsonValid = false;
          }
        }
      } catch (e) {
        row = { ...row, status: 0, ms: Date.now() - t0, error: String(e?.message || e) };
      }
      results.push(row);
      console.log(`${row.status} ${row.task} ${row.model} ${row.ms}ms`);
      fs.writeFileSync(path.join(root, "scripts", "model-bakeoff.out.json"), JSON.stringify({ at: new Date().toISOString(), done: false, results }, null, 2));
    }
  }
}
fs.writeFileSync(path.join(root, "scripts", "model-bakeoff.out.json"), JSON.stringify({ at: new Date().toISOString(), done: true, results }, null, 2));
console.log("Done: scripts/model-bakeoff.out.json");
