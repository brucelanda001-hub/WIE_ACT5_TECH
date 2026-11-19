import { prisma } from "@/lib/prisma";
import { generateSixDigitCode, hashCode, randomToken, safeEqual, seal, sha256, unseal } from "./crypto";
import { deliverCodeToParent } from "./delivery";
import { logEvent } from "./auth";
import { DEVICE_TRUST_SECONDS } from "./tokens";

export const CODE_TTL_MIN = 5;
export const MAX_ATTEMPTS = 5;

/** Creates a challenge, cancels older pending ones for the same child, and sends the code to the parent. */
export async function createChallenge(opts: { parentId: string; parentEmail: string; childId: string; childNickname: string; deviceLabel: string }) {
  await prisma.loginChallenge.updateMany({
    where: { childId: opts.childId, status: "pending" },
    data: { status: "expired", resolvedAt: new Date() },
  });

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);
  const created = await prisma.loginChallenge.create({
    data: {
      parentId: opts.parentId,
      childId: opts.childId,
      codeHash: "pending",
      codeSealed: seal(code),
      deviceLabel: opts.deviceLabel,
      expiresAt,
    },
  });
  // Hash is bound to the challenge id, so it is written once the id exists.
  await prisma.loginChallenge.update({ where: { id: created.id }, data: { codeHash: hashCode(code, created.id) } });

  const { channels } = await deliverCodeToParent({
    email: opts.parentEmail,
    code,
    childNickname: opts.childNickname,
    deviceLabel: opts.deviceLabel,
    minutesValid: CODE_TTL_MIN,
  });
  await logEvent(opts.parentId, "code_sent", `${opts.childNickname} · ${opts.deviceLabel} · via ${channels.join("+")}`);
  return { challengeId: created.id, expiresAt, channels };
}

export type VerifyResult =
  | { ok: true; childId: string; parentId: string; deviceId: string; deviceToken: string }
  | { ok: false; reason: "not_found" | "expired" | "denied" | "locked" | "wrong_code" | "used"; attemptsLeft?: number };

export async function verifyChallenge(challengeId: string, code: string, label: string): Promise<VerifyResult> {
  const ch = await prisma.loginChallenge.findUnique({ where: { id: challengeId } });
  if (!ch) return { ok: false, reason: "not_found" };
  if (ch.status === "denied") return { ok: false, reason: "denied" };
  if (ch.status === "locked") return { ok: false, reason: "locked" };
  if (ch.status !== "pending") return { ok: false, reason: ch.status === "approved" ? "used" : "expired" };
  if (ch.expiresAt < new Date()) {
    await prisma.loginChallenge.update({ where: { id: ch.id }, data: { status: "expired", resolvedAt: new Date() } });
    return { ok: false, reason: "expired" };
  }

  const attempts = ch.attempts + 1;
  const good = /^\d{6}$/.test(code) && safeEqual(hashCode(code, ch.id), ch.codeHash);

  if (!good) {
    const locked = attempts >= MAX_ATTEMPTS;
    await prisma.loginChallenge.update({
      where: { id: ch.id },
      data: { attempts, status: locked ? "locked" : "pending", resolvedAt: locked ? new Date() : null },
    });
    if (locked) await logEvent(ch.parentId, "code_locked", `Too many wrong codes on ${ch.deviceLabel}`);
    return locked ? { ok: false, reason: "locked" } : { ok: false, reason: "wrong_code", attemptsLeft: MAX_ATTEMPTS - attempts };
  }

  // Single use: mark approved only if still pending (protects against double submit).
  const claimed = await prisma.loginChallenge.updateMany({
    where: { id: ch.id, status: "pending" },
    data: { status: "approved", attempts, resolvedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "used" };

  const deviceToken = randomToken();
  const device = await prisma.trustedDevice.create({
    data: {
      parentId: ch.parentId,
      childId: ch.childId,
      tokenHash: sha256(deviceToken),
      label,
      expiresAt: new Date(Date.now() + DEVICE_TRUST_SECONDS * 1000),
    },
  });
  await logEvent(ch.parentId, "device_approved", label);
  return { ok: true, childId: ch.childId, parentId: ch.parentId, deviceId: device.id, deviceToken };
}

/** Pending requests with their code, for the parent's own dashboard only. */
export async function pendingForParent(parentId: string) {
  const now = new Date();
  await prisma.loginChallenge.updateMany({
    where: { parentId, status: "pending", expiresAt: { lt: now } },
    data: { status: "expired", resolvedAt: now },
  });
  const rows = await prisma.loginChallenge.findMany({
    where: { parentId, status: "pending" },
    orderBy: { createdAt: "desc" },
    include: { child: { select: { nickname: true, avatar: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    code: unseal(r.codeSealed) ?? "------",
    child: r.child,
    deviceLabel: r.deviceLabel,
    attempts: r.attempts,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}
