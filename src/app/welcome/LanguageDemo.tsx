"use client";
import { useState } from "react";
import { NovaFace } from "@/components/Brand";
import { NOTES_I18N } from "@/lib/ai/knowledge-i18n";
import { NOTES } from "@/lib/ai/knowledge";

const LANGS = [
  { k: "en", label: "English", q: "Why does the Moon change shape?" },
  { k: "fr", label: "Français", q: "Pourquoi la Lune change-t-elle de forme ?" },
  { k: "ar", label: "العربية", q: "لماذا يتغيّر شكل القمر؟" },
  { k: "darija", label: "تونسي", q: "علاش القمر يبدّل شكلو؟" },
] as const;

const moon = NOTES.find((n) => n.id === "space-moon")!;

export function LanguageDemo() {
  const [k, setK] = useState<(typeof LANGS)[number]["k"]>("darija");
  const cur = LANGS.find((l) => l.k === k)!;
  const text = k === "en" ? { analogy: moon.analogy, hint: moon.hint } : NOTES_I18N["space-moon"][k];
  const rtl = k === "ar" || k === "darija";
  return (
    <div>
      <div role="tablist" aria-label="Language" className="inline-flex flex-wrap gap-1.5 rounded-full bg-white border-2 border-night p-1.5">
        {LANGS.map((l) => (
          <button
            key={l.k}
            role="tab"
            aria-selected={k === l.k}
            onClick={() => setK(l.k)}
            className={`h-12 px-5 rounded-full font-bold ${k === l.k ? "bg-ink text-white" : "text-night hover:bg-ink-soft"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div dir={rtl ? "rtl" : "ltr"} className="mt-6 space-y-5 max-w-2xl">
        <p className="note inline-block px-4 py-3 text-lg font-bold text-night -rotate-1">{cur.q}</p>
        <div className="flex gap-3 items-start">
          <NovaFace className="w-11 h-11 shrink-0" />
          <div className="text-[19px] leading-8 text-night">
            <p>🤫 {text.hint}</p>
            <p className="mt-2 text-muted">{text.analogy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
