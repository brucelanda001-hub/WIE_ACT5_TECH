import { ok, readJson } from "@/lib/http";
import { endSession } from "@/lib/security/auth";

export async function POST(req: Request) {
  const body = await readJson(req);
  const who = body.who === "parent" || body.who === "child" ? body.who : "all";
  await endSession(who);
  return ok({});
}
