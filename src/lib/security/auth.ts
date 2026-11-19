import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sha256 } from "./crypto";
import {
  COOKIE_CHILD,
  COOKIE_DEVICE,
  COOKIE_PARENT,
  CHILD_SESSION_SECONDS,
  DEVICE_TRUST_SECONDS,
  PARENT_SESSION_SECONDS,
  nowSeconds,
  signSession,
  verifySession,
} from "./tokens";

const secureCookie = process.env.NODE_ENV === "production";

function cookieOpts(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: secureCookie, path: "/", maxAge };
}

export async function startParentSession(parentId: string) {
  const token = await signSession({ k: "parent", pid: parentId, exp: nowSeconds() + PARENT_SESSION_SECONDS });
  (await cookies()).set(COOKIE_PARENT, token, cookieOpts(PARENT_SESSION_SECONDS));
}

export async function startChildSession(childId: string, parentId: string, deviceId: string) {
  const token = await signSession({ k: "child", cid: childId, pid: parentId, did: deviceId, exp: nowSeconds() + CHILD_SESSION_SECONDS });
  (await cookies()).set(COOKIE_CHILD, token, cookieOpts(CHILD_SESSION_SECONDS));
}

export async function setDeviceCookie(rawToken: string) {
  (await cookies()).set(COOKIE_DEVICE, rawToken, cookieOpts(DEVICE_TRUST_SECONDS));
}

export async function readDeviceCookie(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_DEVICE)?.value;
}

export async function endSession(which: "parent" | "child" | "all") {
  const jar = await cookies();
  if (which !== "child") jar.delete(COOKIE_PARENT);
  if (which !== "parent") jar.delete(COOKIE_CHILD);
}

/** Signed-in parent, or null. */
export async function getParent() {
  const s = await verifySession((await cookies()).get(COOKIE_PARENT)?.value);
  if (!s || s.k !== "parent") return null;
  return prisma.parent.findUnique({ where: { id: s.pid } });
}

/**
 * Signed-in child, or null. Also checks the device is still trusted, so a parent's
 * "Sign out this device" takes effect on the very next request.
 */
export async function getChild() {
  const s = await verifySession((await cookies()).get(COOKIE_CHILD)?.value);
  if (!s || s.k !== "child") return null;
  const device = await prisma.trustedDevice.findUnique({ where: { id: s.did } });
  if (!device || device.revokedAt || device.expiresAt < new Date() || device.childId !== s.cid) return null;
  return prisma.child.findUnique({ where: { id: s.cid } });
}

/** Device token check used to skip the code on a phone the parent already approved. */
export async function findTrustedDevice(childId: string) {
  const raw = await readDeviceCookie();
  if (!raw) return null;
  const device = await prisma.trustedDevice.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!device || device.childId !== childId || device.revokedAt || device.expiresAt < new Date()) return null;
  return device;
}

export async function logEvent(parentId: string, type: string, detail = "") {
  try {
    await prisma.securityEvent.create({ data: { parentId, type, detail: detail.slice(0, 200) } });
  } catch (e) {
    console.error("[security] could not write event", type, e instanceof Error ? e.message : e);
  }
}

/** Short, non-identifying device label from the User-Agent (no IP, no fingerprint). */
export function deviceLabel(req: Request): string {
  const ua = req.headers.get("user-agent") || "";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iPhone/iPad" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${browser} on ${os}`;
}
