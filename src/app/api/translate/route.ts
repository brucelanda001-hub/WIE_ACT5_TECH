import { fail, ok, readJson, str } from "@/lib/http";
import { getChild } from "@/lib/security/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { translateAnswer } from "@/lib/ai/orchestrator";
import type { Lang } from "@/lib/ai/safety";

const LANGS: Lang[] = ["en", "fr", "ar", "darija"];

// Translates an answer already shown to the child when they switch language (answers are not stored server-side:
// the text comes from the child's own screen). Rate-limited like questions.
export async function POST(req: Request) {
  const child = await getChild();
  if (!child) return fail(401, "Sign in first. Ask your parent for the code.");
  const rl = rateLimit(`translate:${child.id}`, 20, 60);
  if (!rl.ok) return fail(429, "Slow down a little, then try again.", { retryAfterSec: rl.retryAfterSec });

  const body = await readJson(req);
  const to = body.to as Lang;
  const text = str(body.text, 2000);
  if (!LANGS.includes(to) || !text) return fail(400, "Nothing to translate.");
  try {
    const r = await translateAnswer(text, to, child.grade);
    return ok({ text: r.text, translated: r.translated, lang: to });
  } catch (e) {
    console.error("[ai] translate failed:", e instanceof Error ? e.message : e);
    return fail(503, "Translation is busy right now. Try switching again in a moment.");
  }
}
