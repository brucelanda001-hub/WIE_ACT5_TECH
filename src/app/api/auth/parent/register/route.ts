import { prisma } from "@/lib/prisma";
import { fail, ok, readJson, str } from "@/lib/http";
import { generateFamilyCode, hashPassword } from "@/lib/security/crypto";
import { logEvent, startParentSession } from "@/lib/security/auth";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 3600);
  if (!rl.ok) return fail(429, "Too many accounts created from this network. Try again later.", { retryAfterSec: rl.retryAfterSec });

  const body = await readJson(req);
  const email = str(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Enter a valid email address.");
  if (password.length < 10) return fail(400, "Use a password of at least 10 characters.");
  if (password.length > 200) return fail(400, "That password is too long.");

  const existing = await prisma.parent.findUnique({ where: { email } });
  if (existing) return fail(409, "An account already uses this email. Sign in instead.");

  let familyCode = generateFamilyCode();
  for (let i = 0; i < 5 && (await prisma.parent.findUnique({ where: { familyCode } })); i++) familyCode = generateFamilyCode();

  const parent = await prisma.parent.create({ data: { email, passwordHash: await hashPassword(password), familyCode } });
  await logEvent(parent.id, "account_created");
  await startParentSession(parent.id);
  return ok({ parent: { email: parent.email, familyCode: parent.familyCode } }, 201);
}
