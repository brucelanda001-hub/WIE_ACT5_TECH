"use client";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/components/Brand";

export default function ParentLogin() {
  const [tab, setTab] = useState<"signin" | "create">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(tab === "signin" ? "/api/auth/parent/login" : "/api/auth/parent/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({ ok: false, error: "Network error. Check your connection." }));
    setBusy(false);
    if (!data.ok) {
      setError(data.error + (data.retryAfterSec ? ` (${Math.ceil(data.retryAfterSec / 60)} min)` : ""));
      return;
    }
    window.location.assign("/parent");
  }

  return (
    <main className="min-h-screen bg-paper-deep flex flex-col">
      <div className="mx-auto w-full max-w-5xl px-5 pt-6 flex items-center justify-between">
        <Link href="/welcome" aria-label="About EdNova"><Brand /></Link>
        <Link href="/login" className="h-12 px-4 rounded-full bg-white border-2 border-line font-bold text-sm inline-flex items-center">🧒 Child sign-in</Link>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-10 grid lg:grid-cols-[1fr_440px] gap-10 items-start flex-1">
        <section className="pt-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-night leading-[1.05]">
            You hold the key to your child&apos;s learning space.
          </h1>
          <p className="mt-4 text-lg text-muted max-w-xl">
            Each time your child signs in on a new phone or tablet, EdNova sends <strong className="text-night">you</strong> a 6-digit code. You read it, they type it. No code, no access.
          </p>
          <ol className="mt-8 space-y-4 max-w-lg">
            {[
              ["Your child enters the family code", "It only shows the nicknames in your family. No real names."],
              ["You receive a 6-digit code", "In your parent space (and by email if your school turned it on). It expires after 5 minutes."],
              ["They type it on their device", "Five wrong tries lock the code. You can deny a request or sign a device out at any time."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="w-10 h-10 shrink-0 rounded-full bg-ink text-white grid place-items-center text-lg font-extrabold font-[family-name:var(--font-display)]">{i + 1}</span>
                <div>
                  <p className="font-extrabold text-night">{title}</p>
                  <p className="text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-sheet)] border-2 border-line">
          <div role="tablist" className="grid grid-cols-2 rounded-full bg-paper-deep p-1 mb-6">
            {(["signin", "create"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  setTab(k);
                  setError("");
                }}
                className={`h-12 rounded-full font-bold ${tab === k ? "bg-white text-ink shadow" : "text-muted"}`}
              >
                {k === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-bold text-night mb-1">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 rounded-xl border-2 border-line px-4 text-lg focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label htmlFor="password" className="block font-bold text-night mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={tab === "create" ? 10 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 rounded-xl border-2 border-line ps-4 pe-20 text-lg focus:border-ink focus:outline-none"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-1 top-1 h-12 px-3 rounded-lg text-sm font-bold text-ink">
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              {tab === "create" && <p className="mt-1 text-sm text-muted">At least 10 characters. A short sentence works well.</p>}
            </div>
            {error && <p role="alert" className="rounded-xl bg-margin-soft text-night font-semibold px-4 py-3">{error}</p>}
            <button disabled={busy} className="btn-press w-full h-14 rounded-full bg-ink text-white text-lg font-extrabold disabled:opacity-60">
              {busy ? "Please wait…" : tab === "signin" ? "Sign in" : "Create my parent space"}
            </button>
          </form>
          <p className="mt-5 text-xs text-muted leading-relaxed">
            We store your email and a scrypt hash of your password, nothing else about you. Children are known only by a nickname and an emoji. EdNova is designed with COPPA, GDPR and the UK Children&apos;s Code in mind.
          </p>
        </section>
      </div>
    </main>
  );
}
