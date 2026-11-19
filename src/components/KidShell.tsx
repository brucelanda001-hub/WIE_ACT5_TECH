"use client";
import { MagicSky } from "@/components/MagicSky";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { PwaLayer } from "./PwaLayer";
import { signOut, useKid, type Kid } from "./useKid";
import { isRtl, LANG_LABEL, t, type UiLang } from "@/lib/i18n";

type Tab = "ask" | "mySpace" | "companions" | "explore";
const TABS: { key: Tab; href: string; icon: string }[] = [
  { key: "ask", href: "/", icon: "💬" },
  { key: "mySpace", href: "/dashboard", icon: "🏠" },
  { key: "companions", href: "/companions", icon: "🐾" },
  { key: "explore", href: "/explore", icon: "🧭" },
];

/** UI language: the child's choice on this device, defaulting to the language the parent set. */
export function useUiLang(kid: Kid | null): [UiLang, (l: UiLang) => void] {
  const [lang, setLang] = useState<UiLang>("en");
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("ednova_lang");
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    if (saved && saved in LANG_LABEL) setLang(saved as UiLang);
    else if (kid?.language) setLang(kid.language);
  }, [kid?.language]);
  const update = (l: UiLang) => {
    setLang(l);
    try {
      localStorage.setItem("ednova_lang", l);
    } catch {}
  };
  return [lang, update];
}

const BREAK_AFTER_MIN = 20;

export function KidShell({ active, children, lang: langProp, kid: kidProp }: { active: Tab; children: React.ReactNode; lang?: UiLang; kid?: Kid | null }) {
  const ownKid = useKid(kidProp !== undefined);
  const kid = kidProp ?? ownKid;
  const [ownLang] = useUiLang(kid);
  const lang = langProp ?? ownLang;
  const [showBreak, setShowBreak] = useState(false);
  const [menu, setMenu] = useState(false);

  // Gentle break reminder: no streak pressure, no countdown shaming (UK Children's Code, nudge techniques).
  useEffect(() => {
    let start = Date.now();
    try {
      const s = Number(sessionStorage.getItem("ednova_session_start"));
      if (s) start = s;
      else sessionStorage.setItem("ednova_session_start", String(start));
    } catch {}
    const id = setInterval(() => {
      if (Date.now() - start > BREAK_AFTER_MIN * 60_000) {
        setShowBreak(true);
        start = Date.now();
        try {
          sessionStorage.setItem("ednova_session_start", String(start));
        } catch {}
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div dir={isRtl(lang) ? "rtl" : "ltr"} lang={lang === "darija" ? "ar-TN" : lang} className="kid-space relative isolate flex flex-col flex-1 min-h-dvh">
      <MagicSky />
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b-2 border-grape-soft">
        <div className="mx-auto max-w-6xl h-[68px] px-4 flex items-center gap-4">
          <Link href="/" className="shrink-0 rounded-lg" aria-label="EdNova home">
            <Brand />
          </Link>
          <nav className="hidden md:flex items-center gap-1 mx-auto" aria-label="Main">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active === tab.key ? "page" : undefined}
                className={`h-12 px-4 inline-flex items-center gap-2 rounded-full text-[15px] font-bold transition-colors ${
                  active === tab.key ? "bg-magic shadow-[0_4px_14px_-4px_rgb(124_58_237_/_0.6)]" : "text-night hover:bg-grape-soft"
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {t(lang, tab.key)}
              </Link>
            ))}
          </nav>
          <div className="relative ms-auto md:ms-0">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="h-12 ps-1.5 pe-4 rounded-full bg-white border-2 border-line flex items-center gap-2 font-bold"
            >
              <span className="w-9 h-9 rounded-full bg-marker-soft grid place-items-center text-xl" aria-hidden>
                {kid?.avatar ?? "🙂"}
              </span>
              <span className="max-w-[9rem] truncate">{kid?.nickname ?? "…"}</span>
            </button>
            {menu && (
              <div className="absolute end-0 mt-2 w-56 rounded-2xl bg-white border-2 border-line shadow-[var(--shadow-sheet)] p-2 z-50">
                <button onClick={() => signOut("child")} className="w-full h-12 rounded-xl px-3 text-start font-bold hover:bg-margin-soft text-margin">
                  {t(lang, "signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <PwaLayer lang={lang} />

      {/* Mobile: big icon-led tabs (≥56 px) */}
      <nav aria-label="Main" className="mobile-tabs md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-line grid grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={`h-[72px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-bold ${active === tab.key ? "text-ink" : "text-muted"}`}
          >
            <span className={`text-2xl leading-none w-12 h-9 grid place-items-center rounded-full ${active === tab.key ? "bg-ink-soft" : ""}`} aria-hidden>
              {tab.icon}
            </span>
            {t(lang, tab.key)}
          </Link>
        ))}
      </nav>

      {showBreak && (
        <div role="dialog" aria-modal="true" aria-labelledby="break-title" className="fixed inset-0 z-50 grid place-items-center bg-night/40 p-6">
          <div className="max-w-sm w-full rounded-[var(--radius-card)] bg-white p-6 text-center shadow-[var(--shadow-sheet)]">
            <div className="text-5xl mb-2" aria-hidden>🧘</div>
            <h2 id="break-title" className="text-2xl font-extrabold text-night">{t(lang, "breakTitle")}</h2>
            <p className="mt-2 text-muted">{t(lang, "breakBody")}</p>
            <button onClick={() => setShowBreak(false)} className="btn-press mt-5 w-full h-14 rounded-full bg-ink text-white text-lg font-extrabold">
              {t(lang, "breakOk")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
