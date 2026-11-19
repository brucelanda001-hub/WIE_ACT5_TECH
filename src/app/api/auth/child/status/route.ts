import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";

// Lets the child's screen notice when the parent denies the request or the code expires.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  const ch = await prisma.loginChallenge.findUnique({ where: { id }, select: { status: true, expiresAt: true } });
  if (!ch) return fail(404, "Not found");
  const status = ch.status === "pending" && ch.expiresAt < new Date() ? "expired" : ch.status;
  return ok({ status, expiresAt: ch.expiresAt.toISOString() });
}
