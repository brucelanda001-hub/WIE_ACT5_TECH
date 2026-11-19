import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { deviceLabel, findTrustedDevice, logEvent, startChildSession } from "@/lib/security/auth";
import { createChallenge } from "@/lib/security/challenge";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

// Step 2: the child picks a profile. A phone the parent already approved signs in straight away;
// any other device triggers a 6-digit code sent to the parent.
export async function POST(req: Request) {
  const body = await readJson(req);
  const familyCode = str(body.familyCode, 20).toUpperCase();
  const childId = str(body.childId, 40);

  const child = await prisma.child.findUnique({ where: { id: childId }, include: { parent: true } });
  if (!child || child.parent.familyCode !== familyCode) return fail(404, "Profile not found. Start again with the family code.");

  const trusted = await findTrustedDevice(child.id);
  if (trusted) {
    await prisma.trustedDevice.update({ where: { id: trusted.id }, data: { lastSeenAt: new Date() } });
    await startChildSession(child.id, child.parentId, trusted.id);
    await logEvent(child.parentId, "child_signed_in", `${child.nickname} · ${trusted.label} (trusted device)`);
    return ok({ signedIn: true });
  }

  const perChild = rateLimit(`code:${child.id}`, 3, 900);
  const perIp = rateLimit(`code-ip:${clientIp(req)}`, 6, 900);
  if (!perChild.ok || !perIp.ok) {
    const retryAfterSec = Math.max(perChild.ok ? 0 : perChild.retryAfterSec, perIp.ok ? 0 : perIp.retryAfterSec);
    return fail(429, "A code was sent a moment ago. Ask your parent to check their EdNova space.", { retryAfterSec });
  }

  const ch = await createChallenge({
    parentId: child.parentId,
    parentEmail: child.parent.email,
    childId: child.id,
    childNickname: child.nickname,
    deviceLabel: deviceLabel(req),
  });
  return ok({ signedIn: false, challengeId: ch.challengeId, expiresAt: ch.expiresAt.toISOString(), channels: ch.channels });
}
