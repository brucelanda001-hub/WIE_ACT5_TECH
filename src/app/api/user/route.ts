import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { getChild } from "@/lib/security/auth";
import { COMPANIONS, GROW_COST } from "@/lib/companions";

// Progress belongs to the signed-in child; the browser can't pick another id or set its own coins.
async function progressFor(childId: string) {
  return prisma.user.upsert({ where: { id: childId }, update: {}, create: { id: childId, coins: 40, sproutXP: 0, streak: 0 } });
}

const view = (u: { coins: number; sproutXP: number; unlocked: string; answers: number }) => ({
  coins: u.coins,
  sproutXP: u.sproutXP,
  answers: u.answers,
  unlocked: u.unlocked.split(",").filter(Boolean),
});

export async function GET() {
  const child = await getChild();
  if (!child) return fail(401, "Sign in first.");
  return ok({ progress: view(await progressFor(child.id)) });
}

export async function POST(req: Request) {
  const child = await getChild();
  if (!child) return fail(401, "Sign in first.");
  const body = await readJson(req);
  const action = str(body.action, 20);
  const u = await progressFor(child.id);

  if (action === "grow") {
    if (u.coins < GROW_COST) return fail(400, "Not enough coins yet. Ask a few more questions!");
    if (u.sproutXP >= 300) return fail(400, "Sproutley is fully grown!");
    const updated = await prisma.user.update({ where: { id: child.id }, data: { coins: u.coins - GROW_COST, sproutXP: Math.min(300, u.sproutXP + 50) } });
    return ok({ progress: view(updated) });
  }

  if (action === "unlock") {
    const c = COMPANIONS.find((x) => x.id === str(body.companion, 20));
    const owned = u.unlocked.split(",").filter(Boolean);
    if (!c || owned.includes(c.id)) return fail(400, "Already in your album.");
    if (u.coins < c.cost) return fail(400, "Not enough coins yet. Ask a few more questions!");
    const updated = await prisma.user.update({ where: { id: child.id }, data: { coins: u.coins - c.cost, unlocked: [...owned, c.id].join(",") } });
    return ok({ progress: view(updated) });
  }

  return fail(400, "Unknown action.");
}
