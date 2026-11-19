import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { verifyPassword } from "@/lib/security/crypto";
import { logEvent, startParentSession } from "@/lib/security/auth";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  const body = await readJson(req);
  const email = str(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  const rl = rateLimit(`login:${clientIp(req)}`, 20, 900);
  if (!rl.ok) return fail(429, "Too many sign-in attempts. Wait a few minutes.", { retryAfterSec: rl.retryAfterSec });

  const parent = email ? await prisma.parent.findUnique({ where: { email } }) : null;
  if (parent?.lockedUntil && parent.lockedUntil > new Date()) {
    const retryAfterSec = Math.ceil((parent.lockedUntil.getTime() - Date.now()) / 1000);
    return fail(423, "This account is paused after several wrong passwords. Try again later.", { retryAfterSec });
  }

  // Same message whether the email exists or not, so accounts can't be discovered.
  const good = parent ? await verifyPassword(password, parent.passwordHash) : false;
  if (!parent || !good) {
    if (parent) {
      const failed = parent.failedLogins + 1;
      const lock = failed >= LOCK_AFTER;
      await prisma.parent.update({
        where: { id: parent.id },
        data: { failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
      });
      if (lock) await logEvent(parent.id, "account_locked", `${LOCK_AFTER} wrong passwords`);
    }
    return fail(401, "Email or password is not right.");
  }

  await prisma.parent.update({ where: { id: parent.id }, data: { failedLogins: 0, lockedUntil: null } });
  await logEvent(parent.id, "parent_signed_in");
  await startParentSession(parent.id);
  return ok({ parent: { email: parent.email, familyCode: parent.familyCode } });
}
