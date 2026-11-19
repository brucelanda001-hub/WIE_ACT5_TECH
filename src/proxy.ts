import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_CHILD, COOKIE_PARENT, verifySession } from "@/lib/security/tokens";

// First line of defence: signature + expiry check on every protected page and API.
// Route handlers then re-check in the database (e.g. a device the parent revoked).

const KID_PAGES = ["/", "/dashboard", "/companions", "/explore"];
const KID_APIS = ["/api/chat", "/api/user"];
const PARENT_APIS = ["/api/parent", "/api/insights", "/api/metrics"];

const starts = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + "/"));

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const child = await verifySession(req.cookies.get(COOKIE_CHILD)?.value);
  const parent = await verifySession(req.cookies.get(COOKIE_PARENT)?.value);
  const isChild = child?.k === "child";
  const isParent = parent?.k === "parent";

  if (path === "/parent" || (path.startsWith("/parent/") && path !== "/parent/login")) {
    if (!isParent) return NextResponse.redirect(new URL("/parent/login", req.url));
  } else if (KID_PAGES.includes(path)) {
    // Visitors who are not signed in land on the public page; signed-in parents go to their space.
    if (!isChild) return NextResponse.redirect(new URL(path === "/" ? (isParent ? "/parent" : "/welcome") : "/login", req.url));
  } else if (starts(path, KID_APIS)) {
    if (!isChild) return NextResponse.json({ ok: false, error: "Sign in first. Ask your parent for the code." }, { status: 401 });
  } else if (starts(path, PARENT_APIS)) {
    if (!isParent) return NextResponse.json({ ok: false, error: "Parent sign-in required." }, { status: 401 });
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|offline\\.html|.*\\.(?:svg|png|jpg|ico|webp)$).*)"],
};
