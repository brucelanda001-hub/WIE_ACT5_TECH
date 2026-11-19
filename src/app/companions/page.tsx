"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KidShell, useUiLang } from "@/components/KidShell";
import { useKid } from "@/components/useKid";
import { COINS_PER_ANSWER, COMPANIONS, GROW_COST, GROW_STAGES, stageFor } from "@/lib/companions";
import { t, type UiLang } from "@/lib/i18n";

// Companions are earned by learning (5 coins per answered question), never bought, never lost.
// No streaks, no countdowns, no "you'll lose it" messages (UK Children's Code, nudge techniques).

type Progress = { coins: number; sproutXP: number; answers: number; unlocked: string[] };

const MAX_XP = GROW_STAGES[GROW_STAGES.length - 1].xp;
const XP_PER_WATER = 50;

/* Per-companion colours for the halo behind each sticker */
const HALO: Record<string, string> = {
  owl: "from-[#c7d2fe] to-[#a5b4fc]",
  turtle: "from-[#fde68a] to-[#fcd34d]",
  camel: "from-[#fecdd3] to-[#fda4af]",
  rocket: "from-[#ddd6fe] to-[#c4b5fd]",
};

const fill = (tpl: string, vars: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

function Coin({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="coin-shine inline-grid place-items-center rounded-full border-2 border-[#b7791f] font-extrabold text-[#7a4f12] shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42, background: "radial-gradient(circle at 32% 28%, #fff7cc 0%, #ffd23f 38%, #f5a524 100%)" }}
    >
      ★
    </span>
  );
}

/** The wallet: coins and a ring that fills towards the next friend. */
function Wallet({ lang, coins, next }: { lang: UiLang; coins: number | null; next?: { name: string; emoji: string; cost: number } }) {
  const pct = next && coins !== null ? Math.min(100, Math.round((coins / next.cost) * 100)) : 100;
  return (
    <div className="glass-card rounded-[28px] px-5 py-4 flex items-center gap-4">
      <div className="relative w-[76px] h-[76px] shrink-0 rounded-full grid place-items-center" style={{ background: `conic-gradient(var(--color-grape) ${pct * 3.6}deg, rgb(124 58 237 / 0.15) 0deg)` }}>
        <div className="w-[62px] h-[62px] rounded-full bg-white grid place-items-center">
          <Coin size={44} />
        </div>
      </div>
      <div>
        <p className="text-4xl font-extrabold text-night tabular-nums leading-none font-[family-name:var(--font-display)]">{coins ?? "…"}</p>
        <p className="text-sm font-bold text-muted">{t(lang, "d_coins")}</p>
        {next && (
          <p className="mt-1 text-xs font-bold text-grape" dir="auto">
            {t(lang, "c_nextFriend")}: {next.emoji} {next.name} · {pct}%
          </p>
        )}
      </div>
    </div>
  );
}

/** Sproutley's little world: sky, sun, grass, the plant, and water drops when watered. */
function Garden({ emoji, name, watering }: { emoji: string; name: string; watering: boolean }) {
  return (
    <div className="relative h-64 rounded-[24px] overflow-hidden" style={{ background: "linear-gradient(180deg, #dbeafe 0%, #e9f8f1 70%)" }}>
      <span className="garden-sun absolute top-5 end-6 w-14 h-14 rounded-full" style={{ background: "radial-gradient(circle, #fff3b0 0%, #ffd23f 60%, #ffd23f00 72%)" }} aria-hidden />
      <span className="garden-cloud absolute top-8 start-6 w-20 h-7 rounded-full bg-white/90" aria-hidden />
      <span className="garden-cloud absolute top-16 start-24 w-12 h-5 rounded-full bg-white/80" style={{ animationDelay: "-6s" }} aria-hidden />
      {/* ground */}
      <div className="absolute bottom-0 inset-x-0 h-16 rounded-t-[50%]" style={{ background: "linear-gradient(180deg, #8bd17c 0%, #5fb35a 30%, #b88b5e 31%, #9a6f45 100%)" }} aria-hidden />
      {[12, 30, 64, 82].map((x) => (
        <span key={x} className="absolute bottom-[54px] text-xl" style={{ left: `${x}%` }} aria-hidden>🌱</span>
      ))}
      {/* water drops */}
      {watering &&
        [0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="water-drop absolute top-0 text-2xl" style={{ left: `${38 + i * 6}%`, animationDelay: `${i * 120}ms` }} aria-hidden>
            💧
          </span>
        ))}
      {/* the plant */}
      <div className="absolute inset-x-0 bottom-9 grid place-items-center">
        <span key={emoji} className="plant-sway tile-pop text-[118px] leading-none" role="img" aria-label={name}>
          {emoji}
        </span>
      </div>
      {[[18, 40], [76, 30], [60, 62]].map(([x, y], i) => (
        <span key={i} className="garden-spark absolute text-lg" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }} aria-hidden>✨</span>
      ))}
    </div>
  );
}

export default function Companions() {
  const kid = useKid();
  const [lang] = useUiLang(kid);
  const [p, setP] = useState<Progress | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [justGot, setJustGot] = useState<string | null>(null);
  const [watering, setWatering] = useState(false);

  useEffect(() => {
    fetch("/api/user", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.ok && setP(d.progress))
      .catch(() => setMsg(t(lang, "c_offline")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(body: { action: string; companion?: string }, id?: string) {
    setBusy(true);
    setMsg("");
    let d: { ok: boolean; error?: string; progress?: Progress };
    try {
      d = await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
    } catch {
      setBusy(false);
      return setMsg(t(lang, "c_offline"));
    }
    setBusy(false);
    if (!d.ok || !d.progress) return setMsg(d.error ?? t(lang, "c_offline"));
    if (body.action === "grow") {
      setWatering(true);
      setTimeout(() => setWatering(false), 1400);
    }
    setP(d.progress);
    if (id) {
      setJustGot(id);
      setTimeout(() => setJustGot(null), 1600);
    }
  }

  const xp = p?.sproutXP ?? 0;
  const coins = p?.coins ?? null;
  const stage = stageFor(xp);
  const nextStage = GROW_STAGES.find((s) => s.xp > xp);
  const wateringsToNext = nextStage ? Math.ceil((nextStage.xp - xp) / XP_PER_WATER) : 0;
  const canWater = !!p && !!nextStage && p.coins >= GROW_COST;
  const friends = COMPANIONS.filter((c) => c.id !== "sprout");
  const nextFriend = friends.find((c) => !p?.unlocked.includes(c.id));

  return (
    <KidShell active="companions" lang={lang} kid={kid}>
      <main className="cahier cahier-margin flex-1" style={{ "--col": "64rem" } as React.CSSProperties}>
        <div className="mx-auto max-w-5xl ps-10 pe-4 sm:ps-20 py-8">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-5 justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight bg-gradient-to-r from-ink to-grape bg-clip-text text-transparent">
                {t(lang, "c_title")} ✨
              </h1>
              <div className="mt-3 flex flex-wrap gap-2" dir="auto">
                {[
                  `💬 ${fill(t(lang, "c_rule_q"), { n: COINS_PER_ANSWER })}`,
                  `💧 ${fill(t(lang, "c_rule_w"), { n: GROW_COST })}`,
                  `🔒 ${t(lang, "c_rule_safe")}`,
                ].map((chip) => (
                  <span key={chip} className="h-9 px-3 rounded-full bg-white/80 border border-grape-soft text-sm font-bold text-night inline-flex items-center">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <Wallet lang={lang} coins={coins} next={nextFriend} />
          </div>

          {/* Sproutley's garden */}
          <section className="mt-8 glass-card rounded-[32px] p-5 sm:p-6 grid md:grid-cols-[320px_1fr] gap-6 items-center">
            <Garden emoji={stage.emoji} name={stage.name} watering={watering} />
            <div>
              <span className="inline-flex h-8 px-3 rounded-full bg-leaf-soft text-leaf text-sm font-extrabold items-center">🌱 {t(lang, "c_garden")}</span>
              <h2 className="mt-2 text-3xl font-extrabold text-night">
                Sproutley <span className="text-muted font-bold">· {stage.name}</span>
              </h2>

              {/* Growth path: nodes on a track that fills up */}
              <div className="mt-6 relative" aria-label="Growth stages">
                <div className="absolute top-7 inset-x-7 h-2 rounded-full bg-grape-soft" aria-hidden />
                <div className="absolute top-7 start-7 h-2 rounded-full bg-gradient-to-r from-leaf to-[#34d399] transition-all duration-700" style={{ width: `calc((100% - 3.5rem) * ${xp / MAX_XP})` }} aria-hidden />
                <ol className="relative flex justify-between">
                  {GROW_STAGES.map((s) => {
                    const reached = xp >= s.xp;
                    const current = s.xp === stage.xp;
                    return (
                      <li key={s.xp} className="flex flex-col items-center gap-1.5 w-16">
                        <span
                          className={`w-14 h-14 rounded-full grid place-items-center text-2xl border-[3px] transition-all ${
                            current ? "bg-white border-leaf shadow-[0_0_0_6px_rgb(18_165_122_/_0.18)] scale-110" : reached ? "bg-leaf-soft border-leaf" : "bg-white border-grape-soft grayscale-[60%]"
                          }`}
                        >
                          {s.emoji}
                        </span>
                        <span className={`text-[11px] font-bold text-center leading-tight ${current ? "text-leaf" : "text-muted"}`}>{s.name}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-6">
                {nextStage ? (
                  <p className="text-sm font-bold text-night" dir="auto">
                    {t(lang, "c_next")}: {nextStage.emoji} {nextStage.name} · {wateringsToNext} {t(lang, "c_waterings")}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-leaf">🌳 {t(lang, "c_grown")}</p>
                )}
                {nextStage && (
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => act({ action: "grow" })}
                      disabled={busy || !canWater}
                      className="water-btn h-14 px-6 rounded-2xl text-white text-lg font-extrabold inline-flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                      💧 {t(lang, "c_grow")} · {GROW_COST} <Coin size={22} />
                    </button>
                    {p && !canWater && (
                      <div className="min-w-[200px] flex-1">
                        <div className="h-3 rounded-full bg-grape-soft overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#ffd23f] to-[#f5a524]" style={{ width: `${Math.min(100, (p.coins / GROW_COST) * 100)}%` }} />
                        </div>
                        <p className="mt-1 text-xs font-bold text-muted" dir="auto">
                          {p.coins}/{GROW_COST} 🪙 · {fill(t(lang, "c_questionsLeft"), { n: Math.ceil((GROW_COST - p.coins) / COINS_PER_ANSWER) })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {p && <p className="mt-3 text-xs font-bold text-muted">✅ {p.answers} {t(lang, "d_answers")}</p>}
                {msg && <p role="alert" className="mt-3 font-bold text-margin">{msg}</p>}
              </div>
            </div>
          </section>

          {/* Friends to wake up */}
          <h2 className="mt-10 text-2xl font-extrabold text-night" dir="auto">🎴 {t(lang, "c_friends")}</h2>
          <ul className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-5">
            {friends.map((c) => {
              const owned = p?.unlocked.includes(c.id);
              const have = p?.coins ?? 0;
              const missing = Math.max(0, c.cost - have);
              const ready = !owned && !!p && missing === 0;
              const pct = Math.min(100, Math.round((have / c.cost) * 100));
              return (
                <li key={c.id}>
                  <div
                    className={`friend-card relative h-full rounded-[26px] bg-white/85 backdrop-blur border-2 p-4 pt-5 flex flex-col items-center text-center ${
                      owned ? "border-leaf" : ready ? "border-grape friend-ready" : "border-white"
                    }`}
                  >
                    {owned && (
                      <span className="absolute -top-3 start-1/2 -translate-x-1/2 h-7 px-3 rounded-full bg-leaf text-white text-xs font-extrabold grid place-items-center whitespace-nowrap shadow">
                        ✓ {t(lang, "c_myFriend")}
                      </span>
                    )}
                    <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${HALO[c.id] ?? "from-grape-soft to-ink-soft"} grid place-items-center`}>
                      <span
                        className={`text-6xl ${owned ? "friend-bob" : "grayscale-[85%] opacity-55"} ${justGot === c.id ? "tile-pop" : ""}`}
                        aria-hidden
                      >
                        {c.emoji}
                      </span>
                      {!owned && (
                        <span className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-white border-2 border-grape-soft grid place-items-center text-lg shadow-sm" aria-hidden>
                          {ready ? "✨" : "🔒"}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xl font-extrabold text-night">{c.name}</p>
                    <p className="text-xs text-muted mt-1 min-h-8" dir="auto">
                      {t(lang, "c_loves")}: {c.loves}
                    </p>
                    <div className="mt-auto pt-4 w-full">
                      {owned ? (
                        <p className="h-12 grid place-items-center font-extrabold text-leaf">🤝 {t(lang, "c_owned")}</p>
                      ) : ready ? (
                        <button
                          onClick={() => act({ action: "unlock", companion: c.id }, c.id)}
                          disabled={busy}
                          className="w-full h-12 rounded-2xl bg-magic font-extrabold shadow-[0_6px_16px_-6px_rgb(124_58_237_/_0.7)]"
                        >
                          ✨ {t(lang, "c_unlock")} · {c.cost}
                        </button>
                      ) : (
                        <Link href="/" className="block rounded-2xl bg-paper/80 px-3 py-2.5 hover:bg-grape-soft transition-colors">
                          <div className="h-2.5 rounded-full bg-grape-soft overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-ink to-grape" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="mt-1.5 text-xs font-extrabold text-night" dir="auto">
                            🪙 {missing} {t(lang, "c_need")}
                          </p>
                          <p className="text-[11px] font-bold text-muted" dir="auto">
                            ≈ {fill(t(lang, "c_questionsLeft"), { n: Math.ceil(missing / COINS_PER_ANSWER) })}
                          </p>
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </KidShell>
  );
}
