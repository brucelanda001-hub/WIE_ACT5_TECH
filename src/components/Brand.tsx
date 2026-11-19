import { NovaBuddy } from "@/components/NovaBuddy";
// EdNova wordmark: a hand-drawn four-point "nova" star over the ink-blue name.
export function NovaStar({ className = "w-7 h-7", color = "var(--color-marker)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2c1.2 7.4 4.6 10.8 12 12-7.4 1.2-10.8 4.6-12 12-1.2-7.4-4.6-10.8-12-12 7.4-1.2 10.8-4.6 12-12z" fill={color} stroke="var(--color-night)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand({ tone = "ink" }: { tone?: "ink" | "light" }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label="EdNova">
      <NovaStar />
      <span className={`font-[family-name:var(--font-display)] text-[26px] font-extrabold leading-none ${tone === "ink" ? "text-ink" : "text-white"}`}>
        EdNova
      </span>
    </span>
  );
}

/** Nouri, EdNova's mascot, in avatar size (a mini version of the full character in NovaBuddy.tsx). */
export function NovaFace({
  className = "w-12 h-12",
  mood = "happy",
  animated = false,
}: {
  className?: string;
  mood?: "happy" | "thinking" | "excited";
  /** Float gently (big hero uses); small avatars stay still. */
  animated?: boolean;
}) {
  return <NovaBuddy className={className} mood={mood} track={animated} still={!animated} />;
}
