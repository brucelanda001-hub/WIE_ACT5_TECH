import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { getParent, logEvent } from "@/lib/security/auth";
import { pendingForParent } from "@/lib/security/challenge";

export async function GET() {
  const parent = await getParent();
  if (!parent) return fail(401, "Sign in as a parent first.");
  const [requests, devices, events] = await Promise.all([
    pendingForParent(parent.id),
    prisma.trustedDevice.findMany({
      where: { parentId: parent.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      include: { child: { select: { nickname: true, avatar: true } } },
    }),
    prisma.securityEvent.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  return ok({
    familyCode: parent.familyCode,
    requests,
    devices: devices.map((d) => ({ id: d.id, label: d.label, child: d.child, lastSeenAt: d.lastSeenAt, expiresAt: d.expiresAt })),
    events,
  });
}

export async function POST(req: Request) {
  const parent = await getParent();
  if (!parent) return fail(401, "Sign in as a parent first.");
  const body = await readJson(req);
  const action = str(body.action, 20);
  const id = str(body.id, 40);

  if (action === "deny") {
    const r = await prisma.loginChallenge.updateMany({ where: { id, parentId: parent.id, status: "pending" }, data: { status: "denied", resolvedAt: new Date() } });
    if (r.count) await logEvent(parent.id, "code_denied");
    return ok({ updated: r.count });
  }
  if (action === "revoke") {
    const r = await prisma.trustedDevice.updateMany({ where: { id, parentId: parent.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (r.count) await logEvent(parent.id, "device_revoked");
    return ok({ updated: r.count });
  }
  return fail(400, "Unknown action.");
}
