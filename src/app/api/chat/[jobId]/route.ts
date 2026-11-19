import { fail, ok } from "@/lib/http";
import { getChild } from "@/lib/security/auth";
import { getJob } from "@/lib/ai/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const child = await getChild();
  if (!child) return fail(401, "Sign in first.");
  const { jobId } = await ctx.params;
  const job = getJob(jobId);
  if (!job || job.owner !== child.id) return fail(404, "This question has ended. Ask it again.");
  return ok({ jobId: job.id, status: job.status, stages: job.stages, result: job.result, error: job.error });
}
