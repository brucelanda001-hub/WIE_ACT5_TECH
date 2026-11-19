import { ok } from "@/lib/http";
import { aiConfig, aiReady, ROUTING_TABLE } from "@/lib/ai/config";
import { snapshot } from "@/lib/ai/metrics";
import { queueDepth } from "@/lib/ai/queue";
import { knownModels } from "@/lib/ai/models";

// Proof for the jury: calls per model, compact/mid split, tokens, cache hits, quota refusals and how each was handled.
// Never includes the base URL or the key.
export async function GET() {
  const models = await knownModels();
  return ok({
    models: models ? { compact: models.compact, mid: models.mid, available: models.available, source: models.source } : null,
    mode: aiConfig.mock ? "mock" : "platform",
    configured: aiReady().ok,
    concurrency: aiConfig.concurrency,
    queue: { compact: queueDepth("compact"), mid: queueDepth("mid") },
    routingTable: ROUTING_TABLE,
    metrics: snapshot(),
  });
}
