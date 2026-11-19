"use client";
import Link from "next/link";
import { KidShell } from "@/components/KidShell";

// Subjects match the curriculum notes Nouri searches before answering (RAG).
const SUBJECTS = [
  { key: "Math", title: "Maths", icon: "🔢", color: "bg-marker", desc: "Fractions, times tables, sharing, perimeter and area.", starter: "What is 3/4 of a pizza?" },
  { key: "Science", title: "Science", icon: "🌋", color: "bg-leaf-soft", desc: "Volcanoes, the water cycle, plants, the human heart.", starter: "Why do volcanoes erupt?" },
  { key: "Space", title: "Space", icon: "🪐", color: "bg-ink-soft", desc: "Planets, the Sun, and why the Moon changes shape.", starter: "Why does the Moon change shape?" },
  { key: "Language", title: "Words", icon: "📖", color: "bg-margin-soft", desc: "Nouns, verbs, adjectives, and finding the main idea.", starter: "What is a verb?" },
  { key: "History", title: "History", icon: "🏛️", color: "bg-marker-soft", desc: "Carthage, Hannibal, and the pyramids of Egypt.", starter: "Who was Hannibal?" },
];

export default function Explore() {
  return (
    <KidShell active="explore">
      <main className="cahier cahier-margin flex-1" style={{ "--col": "64rem" } as React.CSSProperties}>
        <div className="mx-auto max-w-5xl ps-10 pe-4 sm:ps-20 py-8">
          <h1 className="text-4xl font-extrabold text-night">Pick a subject</h1>
          <p className="mt-1 text-lg text-muted">Tap one and Nouri starts with a question. You can always ask your own.</p>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBJECTS.map((s, i) => (
              <li key={s.key}>
                <Link
                  href={`/?subject=${encodeURIComponent(s.key)}&q=${encodeURIComponent(s.starter)}`}
                  className={`block h-full rounded-[var(--radius-card)] bg-white border-2 border-night p-5 shadow-[5px_5px_0_var(--color-night)] hover:-translate-y-0.5 transition-transform ${i % 2 ? "rotate-[0.4deg]" : "-rotate-[0.4deg]"}`}
                >
                  <span className={`w-16 h-16 rounded-2xl grid place-items-center text-4xl ${s.color}`} aria-hidden>{s.icon}</span>
                  <h2 className="mt-3 text-2xl font-extrabold text-night">{s.title}</h2>
                  <p className="mt-1 text-muted">{s.desc}</p>
                  <p className="mt-4 note inline-block px-3 py-2 font-bold text-night">“{s.starter}”</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </KidShell>
  );
}
