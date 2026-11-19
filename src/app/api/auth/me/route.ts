import { ok } from "@/lib/http";
import { getChild, getParent } from "@/lib/security/auth";

export async function GET() {
  const [parent, child] = await Promise.all([getParent(), getChild()]);
  return ok({
    parent: parent ? { email: parent.email, familyCode: parent.familyCode } : null,
    child: child ? { id: child.id, nickname: child.nickname, avatar: child.avatar, grade: child.grade, language: child.language, dailyLimitMin: child.dailyLimitMin } : null,
  });
}
