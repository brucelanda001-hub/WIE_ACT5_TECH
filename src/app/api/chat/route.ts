import { fail, ok, readJson, str } from "@/lib/http";
import { getChild } from "@/lib/security/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { answerQuestion, MODES, type Mode } from "@/lib/ai/orchestrator";
import { createJob, stageReporter } from "@/lib/ai/jobs";
import type { Lang } from "@/lib/ai/safety";
import { prisma } from "@/lib/prisma";
import { COINS_PER_ANSWER } from "@/lib/companions";

const LANGS: Lang[] = ["en", "fr", "ar", "darija"];

// POST returns a job id at once; the child's screen polls /api/chat/<jobId> for real progress stages.
// A cached answer comes back immediately (no job needed).
export async function POST(req: Request) {
  const child = await getChild();
  if (!child) return fail(401, "Sign in first. Ask your parent for the code.");

  const rl = rateLimit(`chat:${child.id}`, 12, 60);
  if (!rl.ok) return fail(429, "Slow down a little, then ask again.", { retryAfterSec: rl.retryAfterSec });

  const body = await readJson(req);
  const mode = (MODES.includes(body.mode as Mode) ? body.mode : "explain") as Mode;
  const lang = LANGS.includes(body.language as Lang) ? (body.language as Lang) : ((LANGS.includes(child.language as Lang) ? child.language : "en") as Lang);
  const history = Array.isArray(body.history)
    ? (body.history as unknown[])
        .filter((h): h is { role: string; text: string } => !!h && typeof h === "object" && typeof (h as { text?: unknown }).text === "string")
        .map((h) => ({ role: h.role === "user" ? ("user" as const) : ("assistant" as const), text: h.text }))
    : [];

  const job = createJob(child.id);
  const report = stageReporter(job);
  const run = answerQuestion(
    { text: str(body.message, 600), mode, subject: str(body.subject, 40) || "General", grade: child.grade, defaultLang: lang, history, group: body.isGroupMode === true },
    report,
  )
    .then(async (result) => {
      job.result = result;
      job.status = "done";
      // Learning earns coins for companions (not safety replies, not "come back later" answers).
      if (result.modelClass !== "local") {
        await prisma.user
          .upsert({
            where: { id: child.id },
            update: { coins: { increment: COINS_PER_ANSWER }, answers: { increment: 1 } },
            create: { id: child.id, coins: 40 + COINS_PER_ANSWER, sproutXP: 0, streak: 0, answers: 1 },
          })
          .catch(() => {});
      }
    })
    .catch((e: unknown) => {
      job.status = "error";
      job.error =
        e instanceof Error && (e.message.startsWith("AI not configured") || e.message.startsWith("AI key refused"))
          ? e.message
          : "The AI service didn't answer. Please try again.";
      console.error("[ai] job failed:", e instanceof Error ? e.message : e);
    });

  // Fast path: answers from cache or local rules finish within a few ms.
  await Promise.race([run, new Promise((r) => setTimeout(r, 60))]);
  if (job.status !== "running") return ok({ jobId: job.id, status: job.status, stages: job.stages, result: job.result, error: job.error });
  return ok({ jobId: job.id, status: "running", stages: job.stages }, 202);
}
