import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { getParent, logEvent } from "@/lib/security/auth";

const AVATARS = ["🦊", "🐢", "🦉", "🐬", "🦁", "🐼", "🐝", "🦄", "🐙", "🐧"];
const LANGS = ["en", "fr", "ar", "darija"];

export async function GET() {
  const parent = await getParent();
  if (!parent) return fail(401, "Sign in as a parent first.");
  const children = await prisma.child.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: "asc" } });
  return ok({ children, avatars: AVATARS });
}

export async function POST(req: Request) {
  const parent = await getParent();
  if (!parent) return fail(401, "Sign in as a parent first.");
  const body = await readJson(req);
  const nickname = str(body.nickname, 24);
  const avatar = AVATARS.includes(str(body.avatar, 8)) ? str(body.avatar, 8) : AVATARS[0];
  const grade = Math.min(6, Math.max(1, Number(body.grade) || 4));
  const language = LANGS.includes(str(body.language, 10)) ? str(body.language, 10) : "en";

  if (nickname.length < 2) return fail(400, "Pick a nickname of at least 2 letters.");
  if (/\d{4,}|@/.test(nickname)) return fail(400, "Use a nickname only, no numbers or emails.");
  const count = await prisma.child.count({ where: { parentId: parent.id } });
  if (count >= 6) return fail(400, "A family can have up to 6 learner profiles.");

  const child = await prisma.child.create({ data: { parentId: parent.id, nickname, avatar, grade, language } });
  await logEvent(parent.id, "child_added", nickname);
  return ok({ child }, 201);
}

export async function PATCH(req: Request) {
  const parent = await getParent();
  if (!parent) return fail(401, "Sign in as a parent first.");
  const body = await readJson(req);
  const id = str(body.id, 40);
  const child = await prisma.child.findUnique({ where: { id } });
  if (!child || child.parentId !== parent.id) return fail(404, "Profile not found.");
  const dailyLimitMin = Math.min(120, Math.max(10, Number(body.dailyLimitMin) || child.dailyLimitMin));
  const language = LANGS.includes(str(body.language, 10)) ? str(body.language, 10) : child.language;
  const updated = await prisma.child.update({ where: { id }, data: { dailyLimitMin, language } });
  return ok({ child: updated });
}

export async function DELETE(req: Request) {
  const parent = await getParent();
  if (!parent) return fail(401, "Sign in as a parent first.");
  const id = new URL(req.url).searchParams.get("id") || "";
  const child = await prisma.child.findUnique({ where: { id } });
  if (!child || child.parentId !== parent.id) return fail(404, "Profile not found.");
  await prisma.trustedDevice.deleteMany({ where: { childId: id } });
  await prisma.loginChallenge.deleteMany({ where: { childId: id } });
  await prisma.child.delete({ where: { id } });
  await logEvent(parent.id, "child_removed", child.nickname);
  return ok({});
}
