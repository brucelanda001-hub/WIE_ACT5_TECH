import { NextResponse } from "next/server";

export function ok<T extends object>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (typeof extra.retryAfterSec === "number") headers["Retry-After"] = String(extra.retryAfterSec);
  return NextResponse.json({ ok: false, error, ...extra }, { status, headers });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
