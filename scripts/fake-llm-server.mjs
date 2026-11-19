// Local stand-in for the OpenAI-compatible platform, to rehearse the API Guide §6 error contract
// against the REAL HTTP client (MOCK_MODE=false). Never uses real credentials.
//
//   node scripts/fake-llm-server.mjs            # port 8787
//   FAULT=503 node scripts/fake-llm-server.mjs  # every mid-size call answers 503 + Retry-After
//   FAULT=429 / FAULT=400 / FAULT=slow / FAULT=auth
//
// then in .env.local: MOCK_MODE=false, LLM_BASE_URL=http://localhost:8787/v1, LLM_API_KEY=local-test,
// and leave LLM_MODEL_COMPACT / LLM_MODEL_MID empty to test model discovery
import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const FAULT = process.env.FAULT || "";
let remaining = 30;
setInterval(() => (remaining = Math.min(30, remaining + 1)), 2000);

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", "x-ratelimit-limit-requests": "30", "x-ratelimit-remaining-requests": String(remaining), ...headers });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (FAULT === "auth") return send(res, 401, { error: { message: "Invalid API key" } });
      if (req.url === "/v1/models") return send(res, 200, { data: [{ id: "compact-test-1.5b" }, { id: "mid-test-7b" }, { id: "huge-70b" }] });
      if (req.url !== "/v1/chat/completions") return send(res, 404, { error: { message: "not found" } });
      const body = JSON.parse(raw || "{}");
      const isMid = String(body.model).includes("mid");
      const sys = body.messages?.find((m) => m.role === "system")?.content || "";
      const task = sys.match(/task=(\w+)/)?.[1];
      if (FAULT === "429") return send(res, 429, { error: { message: "Team quota exhausted" } }, { "retry-after": "2" });
      if (FAULT === "503" && isMid) return send(res, 503, { error: { message: "Model class saturated" } }, { "retry-after": "5" });
      if (FAULT === "400" && body.max_tokens > 300) return send(res, 400, { error: { message: "max_tokens 380 exceeds ceiling 300" } });
      remaining = Math.max(0, remaining - 1);
      const content =
        task === "triage"
          ? JSON.stringify({ intent: "learning", safe: true, confused: false, needs_deep: true, quick_answer: "" })
          : `(${isMid ? "mid" : "compact"} model, task ${task}) Here is a short, kind answer.`;
      setTimeout(
        () => send(res, 200, { choices: [{ message: { role: "assistant", content } }], usage: { prompt_tokens: Math.ceil(raw.length / 4), completion_tokens: Math.ceil(content.length / 4) } }),
        FAULT === "slow" ? 4000 : isMid ? 1200 : 300,
      );
    });
  })
  .listen(PORT, () => console.log(`fake LLM platform on http://localhost:${PORT}/v1 (FAULT=${FAULT || "none"})`));
