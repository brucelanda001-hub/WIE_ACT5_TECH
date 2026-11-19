import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

// Step 1 on the child's device: the family code (from the parent) unlocks the list of nicknames.
export async function POST(req: Request) {
  const rl = rateLimit(`family:${clientIp(req)}`, 10, 600);
  if (!rl.ok) return fail(429, "Too many tries. Ask your parent to check the family code.", { retryAfterSec: rl.retryAfterSec });

  const body = await readJson(req);
  const familyCode = str(body.familyCode, 20).toUpperCase().replace(/\s+/g, "").replace(/^NOVA(?!-)/, "NOVA-");
  const parent = await prisma.parent.findUnique({
    where: { familyCode },
    include: { children: { select: { id: true, nickname: true, avatar: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!parent) return fail(404, "That family code doesn't match. Ask your parent for it again.");
  if (parent.children.length === 0) return fail(404, "Your parent hasn't added your profile yet.");
  return ok({ familyCode, profiles: parent.children });
}
