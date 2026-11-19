import type { Metadata } from "next";
import Link from "next/link";
import { Brand, NovaFace } from "@/components/Brand";
import { LanguageDemo } from "./LanguageDemo";

export const metadata: Metadata = {
  title: "EdNova: a safe AI study buddy for curious kids",
  description:
    "EdNova gives children aged 8–11 hints before answers, in Arabic, Tunisian Darija, French and English. Parents approve every device; teachers stay in charge. No ads, no data sold.",
};

// Handwritten touches use the app's own display font: no extra font download, works offline at the demo.
const penCls = "font-[family-name:var(--font-display)] font-bold italic text-ink";
/* Calm landing palette: warm paper, one ink-blue accent, soft tinted panels, round cards, gentle shadows. */
const card = "rounded-[28px] bg-white shadow-[0_1px_0_rgba(19,32,74,0.04),0_18px_40px_-24px_rgba(19,32,74,0.35)]";
const warm = "bg-[#faf8f5]";

/* ---------- Illustrations (drawn in SVG: no stock images, no real children) ---------- */

function HeroScene() {
  return (
    <svg viewBox="0 0 520 440" className="w-full h-auto" role="img" aria-label="Nouri, a small friendly star-buddy, sitting on an open exercise book under an olive tree and showing a pizza cut in quarters">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3e9ff" />
          <stop offset="1" stopColor="#fdf6e7" />
        </linearGradient>
        <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14 0H0V14" fill="none" stroke="#d6ddf5" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="520" height="440" rx="36" fill="url(#sky)" />
      {/* sun and soft hills */}
      <circle cx="430" cy="78" r="34" fill="#ffd23f" opacity=".9" />
      <path d="M0 330 C120 290 210 300 300 320 S460 350 520 320 V440 H0Z" fill="#d9f6ec" />
      <path d="M0 360 C140 330 260 345 360 362 S480 380 520 370 V440 H0Z" fill="#bfeedd" />
      {/* olive tree */}
      <path d="M108 330 C110 280 104 240 118 200" stroke="#7a5a3a" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M116 235 C140 220 150 205 160 190" stroke="#7a5a3a" strokeWidth="7" fill="none" strokeLinecap="round" />
      {[
        [80, 170, 46], [130, 150, 50], [175, 180, 40], [100, 205, 38], [150, 210, 34],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#8fbf7f" : "#a7cf96"} />
      ))}
      {[[70, 160], [118, 140], [160, 172], [96, 200], [140, 196], [182, 190]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="5" ry="7" fill="#4f6b3a" />
      ))}
      {/* open exercise book */}
      <g transform="translate(190 300) rotate(-4)">
        <path d="M0 10 Q70 -6 140 10 V96 Q70 80 0 96Z" fill="url(#grid)" stroke="#13204a" strokeWidth="2.5" />
        <path d="M0 10 Q70 -6 140 10 V96 Q70 80 0 96Z" fill="#fff" opacity=".55" />
        <path d="M140 10 Q210 -6 280 10 V96 Q210 80 140 96Z" fill="url(#grid)" stroke="#13204a" strokeWidth="2.5" />
        <path d="M140 10 Q210 -6 280 10 V96 Q210 80 140 96Z" fill="#fff" opacity=".55" />
        <line x1="22" y1="6" x2="22" y2="92" stroke="#e8475b" strokeWidth="2" opacity=".6" />
        <line x1="162" y1="6" x2="162" y2="92" stroke="#e8475b" strokeWidth="2" opacity=".6" />
        <text x="40" y="55" fontFamily="var(--font-display), sans-serif" fontWeight="700" fontSize="26" fill="#2340c8">3/4 ?</text>
        <text x="180" y="58" fontFamily="var(--font-display), sans-serif" fontWeight="700" fontSize="24" fill="#2340c8">✓ 3 of 4</text>
      </g>
      {/* Nouri on the book */}
      <g transform="translate(270 200)">
        <ellipse cx="34" cy="104" rx="34" ry="8" fill="#13204a" opacity=".12" />
        <foreignObject x="-6" y="0" width="84" height="100">
          <div style={{ width: 84, height: 100 }}>
            <NovaFace className="w-[84px] h-[84px]" animated />
          </div>
        </foreignObject>
      </g>
      {/* speech bubble with the pizza */}
      <g transform="translate(350 120)">
        <path d="M0 18 Q0 0 18 0 H130 Q148 0 148 18 V92 Q148 110 130 110 H40 L18 132 L22 110 H18 Q0 110 0 92Z" fill="#fff" stroke="#13204a" strokeWidth="2.5" />
        {[0, 1, 2, 3].map((i) => {
          const a0 = (i / 4) * 2 * Math.PI - Math.PI / 2;
          const a1 = ((i + 1) / 4) * 2 * Math.PI - Math.PI / 2;
          const cx = 74, cy = 55, r = 38;
          return (
            <path
              key={i}
              d={`M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`}
              fill={i < 3 ? "#2340c8" : "#ffd23f"}
              stroke="#13204a"
              strokeWidth="2"
            />
          );
        })}
      </g>
      {/* little stars */}
      {[[250, 70], [300, 40], [480, 200]].map(([x, y], i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(.7)`} d="M16 2c1.2 7.4 4.6 10.8 12 12-7.4 1.2-10.8 4.6-12 12-1.2-7.4-4.6-10.8-12-12 7.4-1.2 10.8-4.6 12-12z" fill="#ffd23f" stroke="#13204a" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function VignetteAsk() {
  return (
    <svg viewBox="0 0 300 170" className="w-full h-auto" aria-hidden>
      <rect width="300" height="170" rx="22" fill="#fdf6e7" />
      {[
        { x: 18, y: 22, t: "Why is the sky blue?", c: "#fff4c2" },
        { x: 120, y: 66, t: "لماذا يتبخّر الماء؟", c: "#dfe5ff" },
        { x: 30, y: 112, t: "C'est quoi une fraction ?", c: "#d9f6ec" },
      ].map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${i % 2 ? 2 : -2})`}>
          <rect width="160" height="36" rx="18" fill={b.c} stroke="#13204a" strokeWidth="2" />
          <text x="80" y="23" textAnchor="middle" fontSize="13" fontWeight="700" fill="#13204a" fontFamily="var(--font-nunito), sans-serif">{b.t}</text>
        </g>
      ))}
      <foreignObject x="232" y="18" width="56" height="56"><NovaFace className="w-14 h-14" /></foreignObject>
    </svg>
  );
}

function VignetteLearn() {
  const steps = ["🤫 hint", "🍎 example", "🎯 quiz", "🔁 say it back"];
  return (
    <svg viewBox="0 0 300 170" className="w-full h-auto" aria-hidden>
      <rect width="300" height="170" rx="22" fill="#eef2ff" />
      {steps.map((s, i) => (
        <g key={s} transform={`translate(${20 + i * 64} ${118 - i * 26})`}>
          <rect width="76" height="34" rx="12" fill="#fff" stroke="#13204a" strokeWidth="2" />
          <text x="38" y="22" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#13204a" fontFamily="var(--font-nunito), sans-serif">{s}</text>
        </g>
      ))}
      <foreignObject x="236" y="14" width="50" height="50"><NovaFace className="w-12 h-12" mood="excited" /></foreignObject>
    </svg>
  );
}

function VignetteSee() {
  return (
    <svg viewBox="0 0 300 170" className="w-full h-auto" aria-hidden>
      <rect width="300" height="170" rx="22" fill="#e9f8f1" />
      {/* 4 rows of 6 dots */}
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={36 + c * 20} cy={42 + r * 22} r="7" fill={r % 2 ? "#ffd23f" : "#2340c8"} stroke="#13204a" strokeWidth="1.8" />
        )),
      )}
      <text x="36" y="148" fontSize="16" fontWeight="800" fill="#13204a" fontFamily="var(--font-nunito), sans-serif">4 rows of 6 = 24</text>
      {/* 3 boxes of 5 dates + 2 left */}
      {[0, 1, 2].map((g) => (
        <g key={g} transform={`translate(${176 + g * 38} 30)`}>
          <rect width="32" height="62" rx="8" fill="#fff" stroke="#13204a" strokeWidth="1.8" />
          {Array.from({ length: 5 }, (_, i) => <circle key={i} cx="16" cy={10 + i * 10.5} r="4" fill="#7a5a3a" />)}
        </g>
      ))}
      <g transform="translate(206 104)">
        <rect width="32" height="26" rx="8" fill="#ffe3e7" stroke="#e8475b" strokeDasharray="4 3" strokeWidth="1.8" />
        <circle cx="10" cy="13" r="4" fill="#7a5a3a" />
        <circle cx="22" cy="13" r="4" fill="#7a5a3a" />
      </g>
    </svg>
  );
}

/* ---------- Page ---------- */

const PROMISES = [
  { icon: "🚫", title: "No ads", body: "Never. Not in the app, not in the answers." },
  { icon: "🔒", title: "No data sold", body: "Questions are not stored, and never a product." },
  { icon: "🤫", title: "Hints before answers", body: "Children think it through, step by step." },
  { icon: "🔐", title: "Parents hold the key", body: "Every new device needs the parent's code." },
];

const FAQ = [
  ["Which ages is EdNova for?", "Children aged 8 to 11 (grades 3 to 6). Answers are written for the child's grade, with short sentences and everyday examples."],
  ["Does EdNova just give the answers?", "No. Nouri gives a hint first, then an example, then a quiz, and asks the child to explain it back. When a child types an answer, the app checks it and helps them find their own mistake."],
  ["Can the AI get maths wrong?", "Calculations in a question are worked out exactly by the app itself and handed to the AI as a checked fact. A child's numeric answer is also graded by the app, not by the AI."],
  ["What does EdNova know about my child?", "A nickname, an emoji and a grade. No real name, photo, voice or address. Questions are not stored, and names, emails or phone numbers are hidden before anything reaches the AI service."],
  ["What happens with an unsafe or sad message?", "It never reaches the AI. Nouri replies kindly with a fixed message and suggests talking to a trusted adult. Four safety layers sit behind every answer."],
  ["Does it work in Arabic and Tunisian Darija?", "Yes, plus French and English, right-to-left included, with read-aloud. In Arabic and Darija, answers come from notes written and checked by our team, because today's open AI models don't write those languages reliably."],
  ["Is it certified for COPPA, GDPR or the UK Children's Code?", "We design with those rules in mind (privacy by default, no dark patterns, parental control), but we make no certification claim."],
];

export default function Welcome() {
  return (
    <div className={`${warm} text-night`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/85 backdrop-blur">
        <div className="mx-auto max-w-6xl h-[72px] px-5 flex items-center gap-6">
          <Brand />
          <nav className="hidden md:flex gap-1 text-[15px] font-semibold text-muted" aria-label="Sections">
            {[
              ["#meet", "Meet Nouri"],
              ["#safety", "Safety"],
              ["#how", "How it works"],
              ["#schools", "For schools"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="h-11 px-3 rounded-full grid place-items-center hover:bg-white hover:text-night">
                {label}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex gap-2">
            <Link href="/login" className="hidden sm:grid h-12 px-4 rounded-full bg-white font-bold place-items-center hover:bg-[#eef2ff]">
              🧒 Child sign-in
            </Link>
            <Link href="/parent/login" className="h-12 px-5 rounded-2xl bg-ink text-white font-extrabold grid place-items-center hover:bg-ink-dark">
              Parent space
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <div>
            <span className="inline-flex h-9 px-4 items-center gap-2 rounded-full bg-white text-sm font-bold text-ink shadow-sm">
              <span aria-hidden>✨</span> A safe AI study buddy for curious kids · 8–11
            </span>
            <h1 className="mt-6 text-[42px] sm:text-[58px] font-extrabold leading-[1.04] tracking-tight">
              Big questions.
              <br />
              Small <span className="marker">hints</span>.
              <br />
              Real understanding.
            </h1>
            <p className="mt-6 text-xl text-muted max-w-lg">
              EdNova is a gentle AI for children that helps them understand instead of copy, in Arabic, Tunisian Darija, French and English. Parents approve
              every device. Teachers stay in charge.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/parent/login" className="h-14 px-7 rounded-2xl bg-ink text-white text-lg font-extrabold grid place-items-center hover:bg-ink-dark">
                Try it with your child
              </Link>
              <a href="#schools" className="h-14 px-7 rounded-2xl bg-white text-lg font-extrabold grid place-items-center shadow-sm hover:shadow-md">
                Bring it to your school
              </a>
            </div>
            <p className={`${penCls} mt-6 text-2xl -rotate-1`}>No ads. No streaks. No data sold. Ever.</p>
          </div>
          <div className={`${card} p-3`}>
            <HeroScene />
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="bg-[#f3f1ed]/60 border-y border-black/5">
        <div className="mx-auto max-w-6xl px-5 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {PROMISES.map((p) => (
            <div key={p.title} className="flex gap-3">
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-white grid place-items-center text-2xl shadow-sm" aria-hidden>
                {p.icon}
              </span>
              <div>
                <h2 className="text-lg font-extrabold">{p.title}</h2>
                <p className="text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Meet Nouri */}
      <section id="meet" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <p className="text-sm font-extrabold tracking-[0.18em] text-ink">MEET NOVA</p>
        <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl">A little buddy for a big, curious world.</h2>
        <p className="mt-4 text-lg text-muted max-w-2xl">
          Nouri lives in the child&apos;s exercise book: somewhere between a patient tutor, a playful sidekick and a very good listener. It never makes a
          child feel small for asking.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { tag: "ASK", title: "Big questions welcome", body: "Volcanoes, fractions, the Moon, Carthage. In the child's own words and language, typed or tapped.", art: <VignetteAsk /> },
            { tag: "LEARN", title: "A patient guide", body: "A hint first, then an example, a quiz, and “explain it back”. Nouri checks the child's answer and helps them find their own mistake.", art: <VignetteLearn /> },
            { tag: "SEE IT", title: "Maths you can see", body: "Pizza slices for fractions, rows of dots for times tables, dates shared into groups. Drawn from the exact numbers, so never wrong.", art: <VignetteSee /> },
          ].map((v) => (
            <article key={v.tag} className={`${card} p-4 flex flex-col`}>
              {v.art}
              <p className="mt-5 px-2 text-xs font-extrabold tracking-[0.18em] text-ink">{v.tag}</p>
              <h3 className="mt-1 px-2 text-2xl font-extrabold">{v.title}</h3>
              <p className="mt-2 px-2 pb-3 text-muted">{v.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Four languages */}
      <section className="bg-[#eef2ff]">
        <div className="mx-auto max-w-6xl px-5 py-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-start">
          <div>
            <p className="text-sm font-extrabold tracking-[0.18em] text-ink">FOUR LANGUAGES</p>
            <h2 className="mt-2 text-4xl font-extrabold leading-tight">One question, the child&apos;s language.</h2>
            <p className="mt-4 text-lg text-muted max-w-md">
              Tunisian children think in Darija, read in Arabic, and study in French and English. EdNova follows the child, right-to-left included, and reads
              answers aloud.
            </p>
          </div>
          <div className={`${card} p-5`}>
            <LanguageDemo />
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="relative overflow-hidden bg-[#e9f8f1]/60">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-extrabold tracking-[0.18em] text-ink">SAFETY</p>
            <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold leading-tight">
              Serious about safety.
              <br />
              Gentle about everything else.
            </h2>
            <ul className="mt-8 space-y-5 text-lg">
              {[
                ["🛡️", "Four layers before any answer", "A local filter, a quick AI check, a second AI opinion before blocking, and the model's own refusal, always turned into a kind reply."],
                ["🙈", "A nickname, not a name", "No real name, photo, voice or address. Personal details typed by mistake are hidden before the AI sees them."],
                ["🧘", "A calm, closed world", "No ads, no streaks, no pressure, no links out. A gentle break reminder after 20 minutes."],
                ["👨‍👩‍👧", "Grown-ups stay in the loop", "Unsafe or sad messages point to a trusted adult. Parents see how the AI was used."],
              ].map(([icon, title, body]) => (
                <li key={title} className="flex gap-4">
                  <span className="w-12 h-12 shrink-0 rounded-2xl bg-white grid place-items-center text-2xl shadow-sm" aria-hidden>{icon}</span>
                  <span>
                    <strong className="block font-extrabold">{title}</strong>
                    <span className="text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">Designed with COPPA, GDPR and the UK Children&apos;s Code in mind. A design commitment, not a certification.</p>
          </div>
          <div className={`${card} p-7`}>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-[#fff4c2] grid place-items-center text-2xl" aria-hidden>🦊</span>
              <p className="font-bold">Star Fox wants to sign in on <strong>Chrome on Android</strong></p>
            </div>
            <div className="mt-6 flex gap-2 justify-center" dir="ltr" aria-label="Example code 4 2 9 6 6 3">
              {"429663".split("").map((d, i) => (
                <span key={i} className="w-12 h-16 sm:w-14 sm:h-[72px] rounded-2xl bg-[#eef2ff] grid place-items-center text-4xl font-extrabold font-[family-name:var(--font-display)] text-ink">
                  {d}
                </span>
              ))}
            </div>
            <p className="mt-4 text-center text-sm font-bold text-muted">Expires in 5 minutes · single use · locks after 5 wrong tries</p>
            <p className={`${penCls} mt-4 text-center text-2xl`}>The parent reads it. The child types it.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <p className="text-sm font-extrabold tracking-[0.18em] text-ink">HOW IT WORKS</p>
        <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold leading-tight max-w-3xl">Simple to use. Careful underneath.</h2>
        <ol className="mt-12 grid md:grid-cols-4 gap-5">
          {[
            ["Ask", "The child asks in their own words. Personal details are hidden first."],
            ["Check", "The app searches the curriculum notes and works out any calculation exactly."],
            ["Think", "A quick AI checks the message while a deeper AI writes the answer, at the same time."],
            ["Understand", "Hints, a picture, a quiz, then the child explains it back. Nouri checks the answer."],
          ].map(([title, body], i) => (
            <li key={title} className={`${card} p-6`}>
              <span className="w-11 h-11 rounded-2xl bg-ink text-white grid place-items-center text-xl font-extrabold">{i + 1}</span>
              <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <div className={`${card} p-6 flex gap-4`}>
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#fff4c2] grid place-items-center text-2xl" aria-hidden>⚡</span>
            <div>
              <h3 className="text-xl font-extrabold">Quick brain · compact model</h3>
              <p className="mt-1 text-muted">Checks what the child needs and whether it is safe, in parallel with the answer. Steps in as a backup when the deep brain is busy.</p>
            </div>
          </div>
          <div className={`${card} p-6 flex gap-4`}>
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#dfe5ff] grid place-items-center text-2xl" aria-hidden>🧠</span>
            <div>
              <h3 className="text-xl font-extrabold">Deep brain · mid-size model</h3>
              <p className="mt-1 text-muted">Writes every explanation, hint and quiz a child reads. We chose it after testing every model on the same children&apos;s tasks.</p>
            </div>
          </div>
        </div>
        <p className="mt-6 text-lg text-muted max-w-3xl">
          When a whole class asks at once, EdNova queues fairly, reuses answers it already gave, and always shows the child what is happening. The screen
          never freezes.
        </p>
      </section>

      {/* For schools */}
      <section id="schools" className="bg-[#f3f1ed]/70">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="text-sm font-extrabold tracking-[0.18em] text-ink">FOR SCHOOLS AND LEARNING CENTRES</p>
          <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold leading-tight">Start with one class.</h2>
          <p className="mt-3 text-lg text-muted max-w-2xl">Keep what works. Your curriculum notes, your languages, your rules.</p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { name: "Family", for: "One home, up to 6 children", items: ["Parent-approved sign-in", "4 languages + read-aloud", "Companions earned by learning"], cta: "Create a parent space", featured: false },
              { name: "Classroom", for: "One teacher, one class", items: ["Group mode for small teams", "Curriculum notes for your class", "Usage and learning report"], cta: "Start a pilot class", featured: true },
              { name: "School & centre", for: "Several classes and sites", items: ["Notes aligned with your programme", "Capacity planning for peak hours", "Privacy review with your team"], cta: "Plan a school pilot", featured: false },
            ].map((o) => (
              <div key={o.name} className={`${card} p-7 flex flex-col ${o.featured ? "ring-2 ring-ink" : ""}`}>
                {o.featured && <span className="self-start h-7 px-3 rounded-full bg-ink text-white text-xs font-extrabold grid place-items-center">Most chosen for pilots</span>}
                <h3 className={`${o.featured ? "mt-3" : ""} text-2xl font-extrabold`}>{o.name}</h3>
                <p className="text-muted">{o.for}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {o.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className="text-leaf font-extrabold" aria-hidden>✓</span>
                      {it}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/parent/login"
                  className={`mt-6 h-14 rounded-2xl grid place-items-center font-extrabold ${o.featured ? "bg-ink text-white hover:bg-ink-dark" : "bg-[#eef2ff] text-ink hover:bg-[#dfe5ff]"}`}
                >
                  {o.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20 md:py-28">
        <p className="text-sm font-extrabold tracking-[0.18em] text-ink">FAQ</p>
        <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold leading-tight">Answers, in plain language.</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className={`${card} group px-6 py-5`}>
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-lg font-extrabold min-h-8">
                {q}
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#eef2ff] text-ink grid place-items-center text-xl transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="rounded-[36px] bg-ink text-white px-8 py-14 sm:px-14 grid md:grid-cols-[1fr_auto] gap-8 items-center relative overflow-hidden">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">The wonder of a good question, answered with care.</h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl">Create a parent space in a minute, add a learner with a nickname and an emoji, and let Nouri take it from there.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/parent/login" className="h-14 px-7 rounded-2xl bg-white text-ink text-lg font-extrabold grid place-items-center hover:bg-[#eef2ff]">Get started</Link>
              <Link href="/login" className="h-14 px-7 rounded-2xl bg-white/10 text-white text-lg font-extrabold grid place-items-center hover:bg-white/20">🧒 Child sign-in</Link>
            </div>
          </div>
          <NovaFace className="w-40 h-40 hidden md:block" animated mood="excited" />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 flex flex-wrap items-center gap-4 text-sm text-muted border-t border-black/5">
        <Brand />
        <span>Built for IEEE WIE ACT 5.0 · EdNova Technical Challenge</span>
        <span className="ms-auto">AI supports teachers and parents. It never replaces them.</span>
      </footer>
    </div>
  );
}
