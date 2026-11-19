"use client";
import { useRef } from "react";

// Six big tiles for the parent's code: numeric keypad on phones, paste-friendly, 56 px targets.
export function CodeInput({ value, onChange, disabled, invalid, label }: { value: string; onChange: (v: string) => void; disabled?: boolean; invalid?: boolean; label: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function setAt(i: number, d: string) {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).replace(/\D/g, "").slice(0, 6);
    onChange(next);
  }

  return (
    <div role="group" aria-label={label} dir="ltr" className="flex gap-2 sm:gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${label} ${i + 1}`}
          maxLength={1}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (text) {
              e.preventDefault();
              onChange(text);
              refs.current[Math.min(text.length, 5)]?.focus();
            }
          }}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) {
              onChange(v.slice(0, 6));
              refs.current[Math.min(v.length, 5)]?.focus();
              return;
            }
            setAt(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              setAt(i - 1, "");
              refs.current[i - 1]?.focus();
            }
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
          className={`w-12 h-16 sm:w-14 sm:h-[72px] rounded-xl border-[3px] bg-white text-center text-3xl font-extrabold font-[family-name:var(--font-display)] text-night outline-none transition-colors
            ${invalid ? "border-margin bg-margin-soft" : d ? "border-ink tile-pop" : "border-line"} focus:border-ink focus:bg-ink-soft disabled:opacity-60`}
        />
      ))}
    </div>
  );
}
