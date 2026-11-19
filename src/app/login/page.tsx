"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand, NovaFace } from "@/components/Brand";
import { CodeInput } from "@/components/CodeInput";
import { isRtl, LANG_LABEL, t, type UiLang } from "@/lib/i18n";

type Profile = { id: string; nickname: string; avatar: string };
type Step = "family" | "who" | "code";

export default function KidLogin() {
  const [lang, setLang] = useState<UiLang>("en");
  const [step, setStep] = useState<Step>("family");
  const [familyCode, setFamilyCode] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [who, setWho] = useState<Profile | null>(null);
  const [challenge, setChallenge] = useState<{ id: string; expiresAt: number } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [closed, setClosed] = useState(false); // denied, expired or locked: a new code is needed

  useEffect(() => {
    try {
      const l = localStorage.getItem("ednova_lang");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
      if (l && l in LANG_LABEL) setLang(l as UiLang);
      const f = localStorage.getItem("ednova_family");
      if (f) setFamilyCode(f);
    } catch {}
  }, []);

  useEffect(() => {
    if (step !== "code") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  // Notice when the parent presses "Deny" or the code expires.
  useEffect(() => {
    if (step !== "code" || !challenge) return;
    const id = setInterval(async () => {
      const r = await fetch(`/api/auth/child/status?id=${challenge.id}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (r?.status === "denied") {
        setError(t(lang, "login_denied"));
        setClosed(true);
      }
      if (r?.status === "expired" || r?.status === "locked") {
        setError(t(lang, "login_expired"));
        setClosed(true);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [step, challenge, lang]);

  function chooseLang(l: UiLang) {
    setLang(l);
    try {
      localStorage.setItem("ednova_lang", l);
    } catch {}
  }

  async function post(url: string, body: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: res.status, data: await res.json().catch(() => ({ ok: false, error: "Network error" })) };
  }

  async function submitFamily(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data } = await post("/api/auth/child/profiles", { familyCode });
    setBusy(false);
    if (!data.ok) return setError(data.error);
    setFamilyCode(data.familyCode);
    try {
      localStorage.setItem("ednova_family", data.familyCode);
    } catch {}
    setProfiles(data.profiles);
    setStep("who");
  }

  async function pick(p: Profile) {
    setWho(p);
    setBusy(true);
    setError("");
    const { data } = await post("/api/auth/child/request", { familyCode, childId: p.id });
    setBusy(false);
    if (!data.ok) return setError(data.error);
    if (data.signedIn) return window.location.assign("/");
    setNow(Date.now());
    setChallenge({ id: data.challengeId, expiresAt: Date.parse(data.expiresAt) });
    setCode("");
    setClosed(false);
    setStep("code");
  }

  async function verify(full = code) {
    if (!challenge || full.length !== 6) return;
    setBusy(true);
    setError("");
    const { data } = await post("/api/auth/child/verify", { challengeId: challenge.id, code: full });
    setBusy(false);
    if (data.ok) return window.location.assign("/");
    setError(data.error + (typeof data.attemptsLeft === "number" ? ` (${data.attemptsLeft})` : ""));
    if (data.reason && data.reason !== "wrong_code") setClosed(true);
    setCode("");
  }

  const secondsLeft = challenge ? Math.max(0, Math.round((challenge.expiresAt - now) / 1000)) : 0;
  const ended = closed || (challenge !== null && secondsLeft === 0);

  return (
    <main dir={isRtl(lang) ? "rtl" : "ltr"} className="cahier cahier-margin min-h-screen flex flex-col" style={{ "--col": "36rem" } as React.CSSProperties}>
      <div className="mx-auto w-full max-w-xl ps-10 pe-5 sm:ps-20 pt-6 flex items-center justify-between gap-3">
        <Link href="/welcome" aria-label="About EdNova"><Brand /></Link>
        <Link href="/parent/login" className="h-12 px-4 rounded-full bg-white border-2 border-line font-bold text-sm inline-flex items-center">
          👪 {t(lang, "login_parent")}
        </Link>
      </div>

      <div className="mx-auto w-full max-w-xl ps-10 pe-5 sm:ps-20 mt-4 flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Language">
        {(Object.keys(LANG_LABEL) as UiLang[]).map((l) => (
          <button key={l} role="radio" aria-checked={lang === l} onClick={() => chooseLang(l)} className={`h-12 px-4 rounded-full text-sm font-bold border-2 ${lang === l ? "bg-ink text-white border-ink" : "bg-white border-line"}`}>
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      <section className="mx-auto w-full max-w-xl ps-10 pe-5 sm:ps-20 py-8 flex-1">
        <div className="flex items-end gap-3 mb-6">
          <NovaFace className="w-16 h-16 shrink-0" mood={step === "code" ? "thinking" : "happy"} />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-night leading-tight">
            {step === "family" ? t(lang, "login_title") : step === "who" ? t(lang, "login_who") : t(lang, "login_codeTitle")}
          </h1>
        </div>

        {step === "family" && (
          <form onSubmit={submitFamily} className="rounded-[var(--radius-card)] bg-white border-2 border-night shadow-[5px_5px_0_var(--color-night)] p-5">
            <label htmlFor="family" className="block text-lg font-bold text-night">🔑 {t(lang, "login_family")}</label>
            <input
              id="family"
              dir="ltr"
              autoCapitalize="characters"
              autoComplete="off"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              placeholder={t(lang, "login_familyPh")}
              className="mt-3 w-full h-16 rounded-xl border-[3px] border-line bg-paper px-4 text-2xl font-extrabold tracking-[0.15em] text-night font-[family-name:var(--font-display)] focus:border-ink focus:outline-none"
            />
            <button disabled={busy || familyCode.trim().length < 6} className="btn-press mt-4 w-full h-14 rounded-full bg-ink text-white text-lg font-extrabold disabled:opacity-50 disabled:shadow-none">
              {busy ? "…" : t(lang, "next")}
            </button>
          </form>
        )}

        {step === "who" && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profiles.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  disabled={busy}
                  className={`note min-h-[120px] p-4 flex flex-col items-center justify-center gap-1 hover:brightness-95 disabled:opacity-60 ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                >
                  <span className="text-5xl" aria-hidden>{p.avatar}</span>
                  <span className="text-lg font-extrabold text-night">{p.nickname}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("family")} className="mt-5 h-12 px-4 rounded-full font-bold text-ink">← {t(lang, "login_back")}</button>
          </div>
        )}

        {step === "code" && who && (
          <div className="rounded-[var(--radius-card)] bg-white border-2 border-night shadow-[5px_5px_0_var(--color-night)] p-5">
            <p className="text-lg text-night">
              <span className="text-3xl align-middle me-1" aria-hidden>{who.avatar}</span>
              <strong>{who.nickname}</strong> · {t(lang, "login_codeBody")}
            </p>
            <div className="my-6">
              <CodeInput
                value={code}
                label="Code"
                invalid={!!error && !ended}
                disabled={busy || ended}
                onChange={(v) => {
                  setCode(v);
                  setError("");
                  if (v.length === 6) verify(v);
                }}
              />
            </div>
            <p className={`text-center font-bold tabular-nums ${secondsLeft < 60 ? "text-margin" : "text-muted"}`}>
              ⏱️ {t(lang, "login_expires")} {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </p>
            {error && <p role="alert" className="mt-3 text-center font-bold text-margin">{error}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => { setStep("who"); setError(""); }} className="h-14 rounded-full border-2 border-line font-bold">← {t(lang, "login_back")}</button>
              {ended ? (
                <button onClick={() => pick(who)} disabled={busy} className="btn-press h-14 rounded-full bg-ink text-white font-extrabold disabled:opacity-50">
                  {t(lang, "login_resend")}
                </button>
              ) : (
                <button onClick={() => verify()} disabled={busy || code.length !== 6} className="btn-press h-14 rounded-full bg-ink text-white font-extrabold disabled:opacity-50 disabled:shadow-none">
                  {t(lang, "login_verify")}
                </button>
              )}
            </div>
          </div>
        )}

        {error && step !== "code" && <p role="alert" className="mt-4 font-bold text-margin">{error}</p>}
      </section>
    </main>
  );
}
