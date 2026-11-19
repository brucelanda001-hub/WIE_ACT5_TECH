"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { signOut } from "@/components/useKid";

type Child = { id: string; nickname: string; avatar: string; grade: number; language: string; dailyLimitMin: number };
type Request = { id: string; code: string; child: { nickname: string; avatar: string }; deviceLabel: string; attempts: number; expiresAt: string };
type Device = { id: string; label: string; child: { nickname: string; avatar: string }; lastSeenAt: string; expiresAt: string };
type Event = { id: string; type: string; detail: string; createdAt: string };
type Metrics = {
  mode: string;
  models: { compact: string; mid: string; available: string[]; source: string } | null;
  configured: boolean;
  concurrency: { compact: number; mid: number };
  queue: { compact: number; mid: number };
  routingTable: { task: string; model: string; why: string }[];
  metrics: {
    requests: number;
    byClass: Record<"compact" | "mid", { calls: number; ok: number; tokensIn: number; tokensOut: number }>;
    embeddings: { calls: number; ok: number; cached: number };
    cacheHits: number;
    coalesced: number;
    localAnswers: number;
    refusals: Record<string, number>;
    handling: Record<string, number>;
    lastQuota: { remaining: number | null; limit: number | null } | null;
    split: { compactPct: number; midPct: number };
    avgLatencyMs: { compact: number; mid: number };
    cacheHitRate: number;
    peakQueue: { compact: number; mid: number };
  };
};

const LANG_NAMES: Record<string, string> = { en: "English", fr: "Français", ar: "العربية", darija: "Darija" };
const EVENT_TEXT: Record<string, string> = {
  account_created: "Parent space created",
  parent_signed_in: "You signed in",
  account_locked: "Account paused after wrong passwords",
  child_added: "Learner added",
  child_removed: "Learner removed",
  code_sent: "Sign-in code sent",
  code_denied: "You denied a sign-in",
  code_locked: "Code locked after 5 wrong tries",
  device_approved: "New device approved",
  device_revoked: "Device signed out",
  child_signed_in: "Child signed in",
};

const fmtTime = (iso: string) => new Date(iso).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });

export default function ParentSpace() {
  const [familyCode, setFamilyCode] = useState("");
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState(false);
  // True while the server can't be reached (restart, Wi-Fi drop): shown as a calm banner, never a silent failure.
  const [offline, setOffline] = useState(false);

  const loadSecurity = useCallback(async () => {
    let r: Response;
    let d: { ok?: boolean; familyCode: string; requests: Request[]; devices: Device[]; events: Event[] };
    try {
      r = await fetch("/api/parent/security", { cache: "no-store" });
      if (r.status === 401) return window.location.assign("/parent/login");
      d = await r.json();
    } catch {
      setOffline(true); // polling continues every 3 s and clears this when the server answers
      return;
    }
    setOffline(false);
    if (!d.ok) return;
    setNow(Date.now());
    setFamilyCode(d.familyCode);
    setRequests(d.requests);
    setDevices(d.devices);
    setEvents(d.events);
  }, []);

  const loadChildren = useCallback(async () => {
    const d = await fetch("/api/parent/children", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => {
        setOffline(true);
        return { ok: false };
      });
    if (d.ok) {
      setChildren(d.children);
      setAvatars(d.avatars);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from the server
    fetch("/api/auth/me").then((r) => r.json()).then((d) => d.parent && setEmail(d.parent.email)).catch(() => setOffline(true));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from the server
    loadSecurity();
    loadChildren();
    const loadMetrics = () => fetch("/api/metrics", { cache: "no-store" }).then((r) => r.json()).then((d) => d.ok && setMetrics(d)).catch(() => {});
    loadMetrics();
    // The sign-in code must appear quickly: poll every 3 s.
    const a = setInterval(loadSecurity, 3000);
    const b = setInterval(loadMetrics, 5000);
    const c = setInterval(() => setNow(Date.now()), 1000);
    return () => [a, b, c].forEach(clearInterval);
  }, [loadSecurity, loadChildren]);

  async function act(action: "deny" | "revoke", id: string) {
    try {
      await fetch("/api/parent/security", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id }) });
    } catch {
      setOffline(true);
      return;
    }
    loadSecurity();
  }

  return (
    <div className="min-h-screen bg-paper-deep">
      <header className="bg-white border-b-2 border-line">
        <div className="mx-auto max-w-6xl h-[68px] px-5 flex items-center gap-4">
          <Brand />
          <span className="hidden sm:inline-flex h-8 px-3 rounded-full bg-ink-soft text-ink text-sm font-extrabold items-center">Parent space</span>
          <span className="ms-auto hidden md:inline text-sm text-muted truncate">{email}</span>
          <button onClick={() => signOut("parent")} className="h-12 px-4 rounded-full border-2 border-line font-bold text-sm">Sign out</button>
        </div>
      </header>
      {offline && (
        <div role="status" className="bg-marker-soft border-b-2 border-marker">
          <p className="mx-auto max-w-6xl px-5 py-2.5 text-sm font-bold text-night flex items-center gap-2">
            <span aria-hidden>🔌</span> Reconnecting to EdNova… This page will update by itself. Nothing is lost.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-5 py-8 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* Sign-in requests: the 2FA codes */}
          <section aria-labelledby="req-title" className={`rounded-[var(--radius-card)] p-6 border-2 ${requests.length ? "bg-white border-night shadow-[6px_6px_0_var(--color-night)]" : "bg-white border-line"}`}>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${requests.length ? "bg-margin animate-pulse" : "bg-leaf"}`} aria-hidden />
              <h2 id="req-title" className="text-2xl font-extrabold text-night">Sign-in requests</h2>
            </div>
            {requests.length === 0 ? (
              <p className="mt-2 text-muted">
                No one is waiting. When your child signs in on a new device, a 6-digit code appears here. Read it to them, or type it on their device yourself.
              </p>
            ) : (
              <ul className="mt-5 space-y-5">
                {requests.map((r) => {
                  const left = Math.max(0, Math.round((Date.parse(r.expiresAt) - now) / 1000));
                  return (
                    <li key={r.id} className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
                      <div>
                        <p className="text-lg text-night">
                          <span className="text-2xl me-1" aria-hidden>{r.child.avatar}</span>
                          <strong>{r.child.nickname}</strong> wants to sign in on <strong>{r.deviceLabel}</strong>
                        </p>
                        <div className="mt-3 flex gap-2" dir="ltr" aria-label={`Code ${r.code.split("").join(" ")}`}>
                          {r.code.split("").map((d, i) => (
                            <span key={i} className="w-12 h-16 sm:w-14 sm:h-[72px] rounded-xl bg-marker-soft border-[3px] border-night grid place-items-center text-4xl font-extrabold font-[family-name:var(--font-display)] text-night">
                              {d}
                            </span>
                          ))}
                        </div>
                        <p className={`mt-2 text-sm font-bold tabular-nums ${left < 60 ? "text-margin" : "text-muted"}`}>
                          Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
                          {r.attempts > 0 ? ` · ${r.attempts} wrong ${r.attempts === 1 ? "try" : "tries"}` : ""}
                        </p>
                      </div>
                      <button onClick={() => act("deny", r.id)} className="h-14 px-6 rounded-full border-2 border-margin text-margin font-extrabold hover:bg-margin-soft">
                        Deny, this wasn&apos;t us
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <Learners learners={children} avatars={avatars} reload={loadChildren} />

          <AiPanel m={metrics} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-[var(--radius-card)] bg-ink text-white p-6">
            <h2 className="text-lg font-extrabold">Family code</h2>
            <p className="text-white/80 text-sm mt-1">Your child types this first. It only reveals nicknames, and each sign-in still needs your 6-digit code.</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex-1 h-14 rounded-xl bg-white/10 border-2 border-white/30 grid place-items-center text-2xl font-extrabold tracking-[0.12em] font-[family-name:var(--font-display)]">{familyCode || "…"}</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(familyCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="h-14 px-4 rounded-xl bg-marker text-night font-extrabold"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] bg-white border-2 border-line p-6">
            <h2 className="text-lg font-extrabold text-night">Trusted devices</h2>
            <p className="text-sm text-muted">Approved by you. Each stays trusted for 30 days.</p>
            {devices.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No devices yet.</p>
            ) : (
              <ul className="mt-3 divide-y-2 divide-line">
                {devices.map((d) => (
                  <li key={d.id} className="py-3 flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>{d.child.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-night truncate">{d.label}</p>
                      <p className="text-xs text-muted">{d.child.nickname} · last used {fmtTime(d.lastSeenAt)}</p>
                    </div>
                    <button onClick={() => act("revoke", d.id)} className="h-12 px-3 rounded-full border-2 border-line text-sm font-bold hover:border-margin hover:text-margin">
                      Sign out
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] bg-white border-2 border-line p-6">
            <h2 className="text-lg font-extrabold text-night">Security log</h2>
            <ul className="mt-3 space-y-2.5">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-bold text-night">{EVENT_TEXT[e.type] ?? e.type}</p>
                  <p className="text-xs text-muted">{fmtTime(e.createdAt)}{e.detail ? ` · ${e.detail}` : ""}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[var(--radius-card)] bg-leaf-soft p-6">
            <h2 className="text-lg font-extrabold text-night">What EdNova keeps</h2>
            <ul className="mt-2 text-sm text-night space-y-1.5 list-disc ps-5">
              <li>Your email and a hashed password.</li>
              <li>Each child&apos;s nickname, emoji, grade and language. No real name, photo or voice.</li>
              <li>Questions are not stored. Emails, phone numbers and names typed by a child are masked before the AI sees them.</li>
              <li>Read-aloud runs in the browser and is never recorded.</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

function Learners({ learners, avatars, reload }: { learners: Child[]; avatars: string[]; reload: () => void }) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [grade, setGrade] = useState(4);
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const d = await fetch("/api/parent/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, avatar, grade, language }),
    }).then((r) => r.json());
    if (!d.ok) return setError(d.error);
    setNickname("");
    setOpen(false);
    reload();
  }

  async function update(id: string, patch: Partial<Child>) {
    await fetch("/api/parent/children", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    reload();
  }

  async function remove(c: Child) {
    if (!confirm(`Remove ${c.nickname}? Their devices will be signed out.`)) return;
    await fetch(`/api/parent/children?id=${c.id}`, { method: "DELETE" });
    reload();
  }

  return (
    <section aria-labelledby="kids-title" className="rounded-[var(--radius-card)] bg-white border-2 border-line p-6">
      <div className="flex items-center gap-3">
        <h2 id="kids-title" className="text-2xl font-extrabold text-night">Learners</h2>
        <button onClick={() => setOpen((o) => !o)} className="ms-auto h-12 px-4 rounded-full bg-ink text-white font-bold">
          {open ? "Close" : "+ Add a learner"}
        </button>
      </div>

      {learners.length === 0 && !open && <p className="mt-2 text-muted">Add a learner so your child can sign in. Use a nickname, not their real name.</p>}

      <ul className="mt-4 grid sm:grid-cols-2 gap-3">
        {learners.map((c) => (
          <li key={c.id} className="rounded-2xl bg-paper border-2 border-line p-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-marker-soft grid place-items-center text-3xl" aria-hidden>{c.avatar}</span>
              <div className="flex-1">
                <p className="text-lg font-extrabold text-night">{c.nickname}</p>
                <p className="text-sm text-muted">Grade {c.grade} · {LANG_NAMES[c.language] ?? c.language}</p>
              </div>
              <button onClick={() => remove(c)} aria-label={`Remove ${c.nickname}`} className="w-12 h-12 rounded-full text-muted hover:text-margin hover:bg-margin-soft text-xl">×</button>
            </div>
            <label className="mt-3 block text-sm font-bold text-night">
              Daily time: {c.dailyLimitMin} min
              <input type="range" min={10} max={120} step={5} defaultValue={c.dailyLimitMin} onMouseUp={(e) => update(c.id, { dailyLimitMin: Number((e.target as HTMLInputElement).value) })} onTouchEnd={(e) => update(c.id, { dailyLimitMin: Number((e.target as HTMLInputElement).value) })} className="w-full accent-[var(--color-ink)] h-8" />
            </label>
          </li>
        ))}
      </ul>

      {open && (
        <form onSubmit={add} className="mt-4 rounded-2xl border-2 border-dashed border-ink p-4 space-y-4">
          <div>
            <label htmlFor="nick" className="block font-bold text-night">Nickname</label>
            <input id="nick" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} placeholder="e.g. Star Fox" className="mt-1 w-full h-14 rounded-xl border-2 border-line px-4 text-lg focus:border-ink focus:outline-none" />
            <p className="text-xs text-muted mt-1">Not their real name. Kids recognise themselves by the emoji.</p>
          </div>
          <fieldset>
            <legend className="font-bold text-night">Emoji</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {avatars.map((a) => (
                <button type="button" key={a} onClick={() => setAvatar(a)} aria-pressed={avatar === a} className={`w-14 h-14 rounded-xl text-3xl border-2 ${avatar === a ? "border-ink bg-ink-soft" : "border-line bg-white"}`}>
                  {a}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="font-bold text-night">
              Grade
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="mt-1 w-full h-14 rounded-xl border-2 border-line px-3 bg-white">
                {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </label>
            <label className="font-bold text-night">
              Language
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full h-14 rounded-xl border-2 border-line px-3 bg-white">
                {Object.entries(LANG_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
          {error && <p role="alert" className="rounded-xl bg-margin-soft px-4 py-2 font-semibold text-night">{error}</p>}
          <button className="btn-press w-full h-14 rounded-full bg-ink text-white font-extrabold">Add learner</button>
        </form>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="text-3xl font-extrabold text-night font-[family-name:var(--font-display)] tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function AiPanel({ m }: { m: Metrics | null }) {
  const [showTable, setShowTable] = useState(false);
  if (!m) return null;
  const s = m.metrics;
  const totalCalls = s.byClass.compact.calls + s.byClass.mid.calls;
  const tokens = s.byClass.compact.tokensIn + s.byClass.compact.tokensOut + s.byClass.mid.tokensIn + s.byClass.mid.tokensOut;
  const refusals = Object.values(s.refusals).reduce((a, b) => a + b, 0);
  return (
    <section aria-labelledby="ai-title" className="rounded-[var(--radius-card)] bg-white border-2 border-line p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="ai-title" className="text-2xl font-extrabold text-night">How the AI was used</h2>
        <span className={`h-8 px-3 rounded-full text-xs font-extrabold inline-flex items-center ${m.mode === "mock" ? "bg-marker-soft text-night" : "bg-leaf-soft text-night"}`}>
          {m.mode === "mock" ? "Offline rehearsal mode" : "Live platform"}
        </span>
        <Link href="/api/metrics" className="ms-auto text-sm font-bold text-ink underline underline-offset-4">Raw metrics (JSON)</Link>
      </div>
      {m.models && (
        <p className="mt-2 text-sm text-night">
          ⚡ Compact: <strong>{m.models.compact}</strong> · 🧠 Mid-size: <strong>{m.models.mid}</strong>
          {m.models.source === "platform" ? " (picked from the platform's model list)" : ""}
        </p>
      )}
      <p className="mt-1 text-sm text-muted">Since the server started. Quick questions go to the compact model; only reasoning and final writing use the mid-size model.</p>

      <div className="mt-4">
        <div className="flex justify-between text-sm font-bold text-night">
          <span>⚡ Compact {s.split.compactPct}% ({s.byClass.compact.calls})</span>
          <span>🧠 Mid-size {s.split.midPct}% ({s.byClass.mid.calls})</span>
        </div>
        <div className="mt-1 h-4 rounded-full bg-ink-soft overflow-hidden flex" role="img" aria-label={`Compact ${s.split.compactPct} percent, mid-size ${s.split.midPct} percent`}>
          <div className="bg-marker h-full" style={{ width: `${totalCalls ? s.split.compactPct : 0}%` }} />
          <div className="bg-ink h-full" style={{ width: `${totalCalls ? s.split.midPct : 0}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Questions" value={s.requests} sub={`${totalCalls} model calls`} />
        <Stat label="Served from cache" value={`${s.cacheHitRate}%`} sub={`${s.cacheHits + s.coalesced} repeats, 0 calls`} />
        <Stat label="Tokens" value={tokens.toLocaleString()} sub={`${s.localAnswers} answered locally`} />
        <Stat label="Avg wait" value={`${(s.avgLatencyMs.mid / 1000).toFixed(1)}s`} sub={`mid · compact ${(s.avgLatencyMs.compact / 1000).toFixed(1)}s`} />
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-line p-4">
          <p className="font-extrabold text-night">Platform refusals: {refusals}</p>
          <ul className="mt-1 text-sm text-muted space-y-0.5">
            <li>429 quota: {s.refusals.quota429} · 503 busy: {s.refusals.busy503} · 400 too big: {s.refusals.bad400}</li>
            <li>Timeouts / network: {s.refusals.timeout + s.refusals.network} · Key refused: {s.refusals.auth ?? 0}</li>
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-line p-4">
          <p className="font-extrabold text-night">How each was handled</p>
          <ul className="mt-1 text-sm text-muted space-y-0.5">
            <li>Waited the stated delay and retried: {s.handling.waitedAndRetried}</li>
            <li>Switched to compact: {s.handling.fellBackToCompact} · Shrunk and retried: {s.handling.shrankAndRetried}</li>
            <li>Low-quota routing: {s.handling.lowQuotaRouting} · Asked child to wait: {s.handling.deferredToChild}</li>
          </ul>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Quota left: <strong className="text-night">{s.lastQuota?.remaining ?? "unknown"}{s.lastQuota?.limit ? ` / ${s.lastQuota.limit}` : ""}</strong> · max parallel calls {m.concurrency.compact} compact / {m.concurrency.mid} mid · peak queue {s.peakQueue.compact}/{s.peakQueue.mid} · embeddings {s.embeddings.calls} calls, {s.embeddings.cached} cached
      </p>

      <button onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="mt-4 h-12 px-4 rounded-full border-2 border-line font-bold text-sm">
        {showTable ? "Hide" : "Show"} the routing table
      </button>
      {showTable && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-muted">
                <th className="py-2 pe-3 text-start font-bold">Step</th>
                <th className="py-2 pe-3 text-start font-bold">Model</th>
                <th className="py-2 text-start font-bold">Why</th>
              </tr>
            </thead>
            <tbody>
              {m.routingTable.map((r) => (
                <tr key={r.task} className="border-t-2 border-line align-top">
                  <td className="py-2 pe-3 text-night font-semibold">{r.task}</td>
                  <td className="py-2 pe-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${r.model === "mid" ? "bg-ink text-white" : r.model === "compact" ? "bg-marker" : "bg-leaf-soft"}`}>{r.model}</span>
                  </td>
                  <td className="py-2 text-muted">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
