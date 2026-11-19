"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KidShell, useUiLang } from "@/components/KidShell";
import { NovaFace } from "@/components/Brand";
import { useKid } from "@/components/useKid";
import { COMPANIONS, stageFor } from "@/lib/companions";
import { isRtl, t, type UiLang } from "@/lib/i18n";

const PAGES: Record<UiLang, { subject: string; icon: string; q: string; tint: string }[]> = {
  en: [
    { subject: "Science", icon: "🌋", q: "Why do volcanoes erupt?", tint: "bg-leaf-soft" },
    { subject: "Math", icon: "🍕", q: "What is 3/4 of a pizza?", tint: "bg-marker-soft" },
    { subject: "History", icon: "🏛️", q: "Who was Hannibal?", tint: "bg-margin-soft" },
  ],
  fr: [
    { subject: "Science", icon: "🌋", q: "Pourquoi les volcans entrent-ils en éruption ?", tint: "bg-leaf-soft" },
    { subject: "Math", icon: "🍕", q: "C'est quoi une fraction ?", tint: "bg-marker-soft" },
    { subject: "History", icon: "🏛️", q: "Qui était Hannibal ?", tint: "bg-margin-soft" },
  ],
  ar: [
    { subject: "Science", icon: "🌋", q: "لماذا تثور البراكين؟", tint: "bg-leaf-soft" },
    { subject: "Math", icon: "🍕", q: "ما هو الكسر؟", tint: "bg-marker-soft" },
    { subject: "History", icon: "🏛️", q: "من هو حنبعل؟", tint: "bg-margin-soft" },
  ],
  darija: [
    { subject: "Science", icon: "🌋", q: "علاش البركان يتفجّر؟", tint: "bg-leaf-soft" },
    { subject: "Math", icon: "🍕", q: "شنوة معناها كسر في الحساب؟", tint: "bg-marker-soft" },
    { subject: "History", icon: "🏛️", q: "شكون حنبعل؟", tint: "bg-margin-soft" },
  ],
};

export default function MySpace() {
  const router = useRouter();
  const kid = useKid();
  const [lang] = useUiLang(kid);
  const [q, setQ] = useState("");
  const [p, setP] = useState<{ coins: number; sproutXP: number; answers: number; unlocked: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/user", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.ok && setP(d.progress))
      .catch(() => {});
  }, []);

  const today = new Intl.DateTimeFormat(lang === "darija" ? "ar-TN" : lang, { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const latest = COMPANIONS.filter((c) => p?.unlocked.includes(c.id) && c.id !== "sprout").pop();

  return (
    <KidShell active="mySpace" lang={lang} kid={kid}>
      <main className="cahier cahier-margin flex-1" style={{ "--col": "64rem" } as React.CSSProperties}>
        <div className="mx-auto max-w-5xl ps-10 pe-4 sm:ps-20 py-8 space-y-8">
          {/* Notebook cover label: name tag like the one on a real cahier */}
          <section className="flex flex-wrap items-center gap-5">
            <div className="relative w-24 h-24 rounded-3xl bg-white border-2 border-night shadow-[4px_4px_0_var(--color-night)] grid place-items-center text-6xl -rotate-3" aria-hidden>
              {kid?.avatar ?? "🙂"}
            </div>
            <div className="rounded-2xl bg-white border-2 border-night px-6 py-4 min-w-[260px]">
              <p className="text-sm text-muted capitalize" dir="auto">{today}</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-night leading-tight" dir="auto">
                {isRtl(lang) ? `${t(lang, "d_notebook")} ${kid?.nickname ?? ""}` : `${kid?.nickname ?? "…"}'s ${t(lang, "d_notebook")}`}
              </h1>
              <p className="text-sm font-bold text-ink">{t(lang, "d_grade")} {kid?.grade ?? "…"}</p>
            </div>
          </section>

          {/* The big question line */}
          <section className="rounded-[var(--radius-card)] bg-white border-2 border-night shadow-[6px_6px_0_var(--color-night)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <NovaFace className="w-12 h-12" />
              <h2 className="text-2xl font-extrabold text-night" dir="auto">{t(lang, "d_askTitle")}</h2>
            </div>
            <form
              className="mt-4 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) router.push(`/?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <label htmlFor="bigq" className="sr-only">{t(lang, "d_askTitle")}</label>
              <input
                id="bigq"
                dir="auto"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t(lang, "d_askPh")}
                className="flex-1 h-16 rounded-xl bg-paper border-b-4 border-ink px-4 text-xl text-night placeholder:text-muted focus:outline-none focus:bg-ink-soft"
              />
              <button disabled={!q.trim()} className="btn-press h-16 px-7 rounded-full bg-ink text-white text-lg font-extrabold disabled:opacity-50 disabled:shadow-none">
                {t(lang, "d_askBtn")}
              </button>
            </form>
            <p className="mt-3 text-sm text-muted" dir="auto">💡 {t(lang, "d_kind")}</p>
          </section>

          {/* Pages to open: three starting questions */}
          <section>
            <h2 className="text-2xl font-extrabold text-night mb-4">{t(lang, "d_pages")}</h2>
            <ul className="grid sm:grid-cols-3 gap-4">
              {PAGES[lang].map((pg, i) => (
                <li key={pg.q}>
                  <Link
                    href={`/?subject=${pg.subject}&q=${encodeURIComponent(pg.q)}`}
                    className={`note block h-full p-5 hover:brightness-95 ${i === 1 ? "rotate-1" : "-rotate-1"}`}
                  >
                    <span className={`w-14 h-14 rounded-2xl grid place-items-center text-3xl ${pg.tint}`} aria-hidden>{pg.icon}</span>
                    <p className="mt-3 text-lg font-extrabold text-night leading-snug" dir="auto">{pg.q}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Companion corner */}
          <section className="grid sm:grid-cols-[auto_1fr_auto] items-center gap-5 rounded-[var(--radius-card)] bg-white border-2 border-line p-5">
            <div className="flex -space-x-3 rtl:space-x-reverse text-5xl" aria-hidden>
              <span className="w-20 h-20 rounded-full bg-leaf-soft grid place-items-center border-2 border-white">{stageFor(p?.sproutXP ?? 0).emoji}</span>
              {latest && <span className={`w-20 h-20 rounded-full ${latest.color} grid place-items-center border-2 border-white`}>{latest.emoji}</span>}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-night">{t(lang, "d_companion")}</h2>
              <p className="text-muted">
                🪙 <strong className="text-night">{p?.coins ?? "…"}</strong> {t(lang, "d_coins")} · {p?.answers ?? 0} {t(lang, "d_answers")}
              </p>
            </div>
            <Link href="/companions" className="h-14 px-5 rounded-full bg-marker border-2 border-night font-extrabold text-night grid place-items-center">
              {t(lang, "d_toAlbum")}
            </Link>
          </section>
        </div>
      </main>
    </KidShell>
  );
}
