// Signed, expiring session tokens. Web Crypto only, so the same code runs in proxy.ts and in route handlers.
// Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, SESSION_SECRET))

export type SessionPayload =
  | { k: "parent"; pid: string; exp: number }
  | { k: "child"; cid: string; pid: string; did: string; exp: number };

export const COOKIE_PARENT = "ednova_parent";
export const COOKIE_CHILD = "ednova_child";
export const COOKIE_DEVICE = "ednova_device";

export const PARENT_SESSION_SECONDS = 60 * 60 * 12; // 12 h
export const CHILD_SESSION_SECONDS = 60 * 60 * 8; // one school day
export const DEVICE_TRUST_SECONDS = 60 * 60 * 24 * 30; // 30 days, then the parent approves again

const enc = new TextEncoder();
let devSecretWarned = false;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ characters) in production.");
  }
  if (!devSecretWarned) {
    devSecretWarned = true;
    console.warn("[security] SESSION_SECRET missing or short: using an insecure development secret. Set it in .env.local.");
  }
  return "ednova-dev-only-secret-change-me-0123456789";
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || token.length > 2048) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig) as BufferSource, enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
