"use client";
import { useEffect, useState } from "react";
import type { UiLang } from "@/lib/i18n";

export type Kid = { id: string; nickname: string; avatar: string; grade: number; language: UiLang; dailyLimitMin: number };

export function useKid(skip = false) {
  const [kid, setKid] = useState<Kid | null>(null);
  useEffect(() => {
    if (skip) return;
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.child) setKid(d.child);
        else window.location.assign("/login");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [skip]);
  return kid;
}

export async function signOut(who: "child" | "parent") {
  await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ who }) });
  window.location.assign(who === "child" ? "/login" : "/parent/login");
}
