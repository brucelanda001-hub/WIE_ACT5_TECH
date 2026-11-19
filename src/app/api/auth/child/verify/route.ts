import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { deviceLabel, logEvent, setDeviceCookie, startChildSession } from "@/lib/security/auth";
import { verifyChallenge } from "@/lib/security/challenge";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const MESSAGES: Record<string, string> = {
  not_found: "This code request has ended. Ask for a new code.",
  expired: "This code has expired. Ask for a new one.",
  denied: "Your parent said no to this sign-in.",
  locked: "Too many wrong codes. Ask for a new code.",
  used: "This code was already used.",
  wrong_code: "That code isn't right. Check the numbers with your parent.",
};

export async function POST(req: Request) {
  const rl = rateLimit(`verify:${clientIp(req)}`, 15, 600);
  if (!rl.ok) return fail(429, "Too many tries. Wait a little and ask for a new code.", { retryAfterSec: rl.retryAfterSec });

  const body = await readJson(req);
  const challengeId = str(body.challengeId, 40);
  const code = str(body.code, 6).replace(/\D/g, "");

  const result = await verifyChallenge(challengeId, code, deviceLabel(req));
  if (!result.ok) {
    return fail(result.reason === "wrong_code" ? 401 : 410, MESSAGES[result.reason], { reason: result.reason, attemptsLeft: result.attemptsLeft });
  }

  await setDeviceCookie(result.deviceToken);
  await startChildSession(result.childId, result.parentId, result.deviceId);
  const child = await prisma.child.findUnique({ where: { id: result.childId } });
  await logEvent(result.parentId, "child_signed_in", `${child?.nickname ?? "child"} · new device`);
  return ok({ signedIn: true });
}
