"use client";
// Nouri (from "nour", light): EdNova's mascot. A glossy glass star with a glowing heart of light,
// big shiny eyes that follow the child's pointer, a little red Tunisian chechia, and an outfit for each topic
// (pencil, goggles, planet, laurel, book). Its mouth moves while answers are read aloud, and its heart of light
// pulses while it thinks and sparkles when the child gets it right.
// Pure SVG + CSS: no images, no data. Every movement stops when the device asks for reduced motion.
import { useEffect, useRef, useState } from "react";

export type NovaTopic = "math" | "science" | "space" | "history" | "language" | "general";
export type NovaMood = "happy" | "thinking" | "excited" | "encourage";

/** Guess the topic from the subject chip and the last question, to pick Nova's outfit. */
export function topicOf(subject: string, question: string): NovaTopic {
  const s = `${subject} ${question}`.toLowerCase();
  if (/\d\s*[x×*÷:+\-/]\s*\d|math|maths|fraction|multipl|divi|périmètre|perimeter|area|ksour|كسور|ضرب|قسمة|حساب|رياضيات/.test(s)) return "math";
  if (/space|espace|moon|lune|planet|planète|sun\b|soleil|star|étoile|قمر|شمس|كوكب|9amra|kawkeb/.test(s)) return "space";
  if (/history|histoire|carthage|hannibal|pyramid|pharaoh|قرطاج|حنبعل|أهرام|تاريخ|kartaj/.test(s)) return "history";
  if (/science|volcan|plant|photosynth|water|eau|heart|cœur|coeur|food chain|matter|بركان|نبات|ماء|قلب|علوم|yetbakher/.test(s)) return "science";
  if (/language|langue|noun|verb|nom|verbe|grammar|grammaire|reading|lecture|اسم|فعل|قراءة|لغة/.test(s)) return "language";
  return "general";
}

const INK = "#2340c8";
const NIGHT = "#13204a";
const MARKER = "#ffd23f";
const MARGIN = "#e8475b";

/** The mascot's name: from "nour", light, in Arabic and Tunisian Darija. */
export const MASCOT_NAME = "Nouri";

/** Rounded 5-point star (points rounded with a thick round-joined stroke of the same colour). */
function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** "back" items are drawn behind the body (tucked in), "front" items over the face. */
function Accessory({ topic, layer }: { topic: NovaTopic; layer: "back" | "front" }) {
  const back = topic === "math" || topic === "space";
  if ((layer === "back") !== back) return null;
  switch (topic) {
    case "math":
      // a yellow pencil tucked behind the right point
      return (
        <g transform="translate(86 10) rotate(28)">
          <rect x="0" y="0" width="9" height="34" rx="2" fill={MARKER} stroke={NIGHT} strokeWidth="2" />
          <rect x="0" y="0" width="9" height="6" rx="2" fill={MARGIN} stroke={NIGHT} strokeWidth="2" />
          <path d="M0 34 L4.5 43 L9 34Z" fill="#f4d8b0" stroke={NIGHT} strokeWidth="2" strokeLinejoin="round" />
          <path d="M3 39.5 L4.5 43 L6 39.5Z" fill={NIGHT} />
        </g>
      );
    case "science":
      // lab goggles on the forehead
      return (
        <g>
          <path d="M37 45 Q60 36 83 45" stroke={NIGHT} strokeWidth="3" fill="none" />
          <circle cx="50" cy="43" r="7" fill="#bfeedd" stroke={NIGHT} strokeWidth="2.5" />
          <circle cx="70" cy="43" r="7" fill="#bfeedd" stroke={NIGHT} strokeWidth="2.5" />
          <path d="M57 43 h6" stroke={NIGHT} strokeWidth="2.5" />
          <path d="M46.5 40 l3 -2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <path d="M66.5 40 l3 -2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "space":
      // a small ringed planet orbiting Nouri
      return (
        <g className="nova-orbit" style={{ transformOrigin: "60px 72px" }}>
          <g transform="translate(106 32)">
            <circle r="7" fill="#ff9f68" stroke={NIGHT} strokeWidth="2" />
            <ellipse rx="12" ry="3.5" fill="none" stroke={NIGHT} strokeWidth="2" transform="rotate(-20)" />
          </g>
        </g>
      );
    case "history":
      // a laurel crown (Carthage, Hannibal…)
      return (
        <g fill="#8fbf7f" stroke={NIGHT} strokeWidth="1.6">
          {[-1, 1].map((side) =>
            [0, 1, 2].map((i) => (
              <ellipse key={`${side}-${i}`} cx={60 + side * (7 + i * 7)} cy={27 + i * 4} rx="5" ry="3" transform={`rotate(${side * (25 + i * 15)} ${60 + side * (7 + i * 7)} ${27 + i * 4})`} />
            )),
          )}
        </g>
      );
    case "language":
      // an open book held in front
      return (
        <g transform="translate(40 104)">
          <path d="M0 2 Q10 -2 20 2 V16 Q10 12 0 16Z" fill="#fff" stroke={NIGHT} strokeWidth="2" strokeLinejoin="round" />
          <path d="M20 2 Q30 -2 40 2 V16 Q30 12 20 16Z" fill="#fff" stroke={NIGHT} strokeWidth="2" strokeLinejoin="round" />
          <path d="M5 7 h10 M25 7 h10 M5 11 h8 M25 11 h8" stroke={INK} strokeWidth="1.4" />
        </g>
      );
    default:
      // everyday look: a little red Tunisian chechia with its black tassel
      return (
        <g transform="translate(0 4) rotate(-10 60 14)">
          <path d="M51 21 L53 7 Q60 4 67 7 L69 21 Q60 24 51 21Z" fill="#c8102e" stroke={NIGHT} strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="60" cy="7" rx="7" ry="2.2" fill="#9e0c24" stroke={NIGHT} strokeWidth="1.6" />
          <path d="M60 6 Q70 6 71 15" stroke={NIGHT} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M69 14 l2 7 l2 -6Z" fill={NIGHT} />
          <path d="M54 12 Q55 9 57 8" stroke="#fff" strokeWidth="1.5" opacity=".5" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

/** The topic symbol shown inside Nouri's glowing core. */
const CORE_SYMBOL: Record<NovaTopic, string> = { math: "1+2", language: "Aa", science: "H₂O", history: "814", space: "☾", general: "" };

export function NovaBuddy({
  mood = "happy",
  topic = "general",
  talking = false,
  waving = false,
  className = "w-28 h-28",
  track = true,
  still = false,
}: {
  /** Eyes follow the pointer (off for small avatars, so a long chat doesn't add one listener per message). */
  track?: boolean;
  /** No floating (small avatars). */
  still?: boolean;
  mood?: NovaMood;
  topic?: NovaTopic;
  /** Mouth moves (while read-aloud is playing). */
  talking?: boolean;
  /** Arms up for a hello or a cheer. */
  waving?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  // Eyes follow the pointer (mouse or finger). While the child types, Nova looks at the text box.
  useEffect(() => {
    if (!track) return;
    const aim = (px: number, py: number) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const dx = px - (box.left + box.width / 2);
      const dy = py - (box.top + box.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 220);
      setLook({ x: (dx / d) * 3.2 * k, y: (dy / d) * 3 * k });
    };
    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
        const b = el.getBoundingClientRect();
        aim(b.left + b.width / 2, b.top + b.height / 2);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("focusin", onFocus);
    };
  }, [track]);

  const lookUp = mood === "thinking";
  const ex = lookUp ? 1.5 : look.x;
  const ey = lookUp ? -3.4 : look.y;
  const armsUp = waving || mood === "excited";
  const core = mood === "thinking" ? "nouri-core-think" : mood === "excited" ? "nouri-core-party" : "nouri-core";
  const BODY = starPoints(60, 72, 46, 31);

  return (
    <svg ref={ref} viewBox="0 0 120 140" className={`${className} overflow-visible`} aria-hidden="true">
      <defs>
        {/* glassy body: light inside, deep violet at the edges */}
        <radialGradient id="nouri-glass" cx="42%" cy="34%" r="75%">
          <stop offset="0" stopColor="#c3d0ff" />
          <stop offset="0.38" stopColor="#7e8ff7" />
          <stop offset="1" stopColor="#6532d6" />
        </radialGradient>
        <linearGradient id="nouri-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#2a0f78" stopOpacity="0" />
          <stop offset="1" stopColor="#2a0f78" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="nouri-core-fill" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fffbe0" />
          <stop offset="0.5" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="nouri-halo" r="50%">
          <stop offset="0" stopColor="#ffe680" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe680" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nouri-iris" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#3b4fb8" />
          <stop offset="1" stopColor={NIGHT} />
        </radialGradient>
        <radialGradient id="nouri-limb" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#a5b4fc" />
          <stop offset="1" stopColor="#5b34c9" />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="60" cy="134" rx="30" ry="5" fill={NIGHT} opacity=".16" className={still ? "" : "nova-shadow"} style={{ transformOrigin: "60px 134px" }} />

      <g className={still ? "" : "nova-bob"}>
        <Accessory topic={topic} layer="back" />

        {/* feet */}
        {[47, 73].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="121" rx="10" ry="6.5" fill="url(#nouri-limb)" stroke="#4c2bb0" strokeWidth="1.5" />
            <ellipse cx={x - 3} cy="118.5" rx="3.5" ry="1.6" fill="#fff" opacity=".45" />
          </g>
        ))}

        {/* arms: round glass mittens */}
        <g className={armsUp ? "nova-arm-up-l" : "nova-arm-l"} style={{ transformOrigin: "26px 80px", transformBox: "view-box" }}>
          <path d="M28 80 Q15 84 11 94" stroke="#6d4ee0" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="10" cy="96" r="7" fill="url(#nouri-limb)" stroke="#4c2bb0" strokeWidth="1.5" />
          <circle cx="8" cy="93.5" r="2" fill="#fff" opacity=".6" />
        </g>
        <g className={armsUp ? "nova-arm-up-r" : "nova-arm-r"} style={{ transformOrigin: "94px 80px", transformBox: "view-box" }}>
          <path d="M92 80 Q105 84 109 94" stroke="#6d4ee0" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="110" cy="96" r="7" fill="url(#nouri-limb)" stroke="#4c2bb0" strokeWidth="1.5" />
          <circle cx="108" cy="93.5" r="2" fill="#fff" opacity=".6" />
        </g>

        {/* glass body: a light rim, the translucent star, shading, reflections */}
        <polygon points={BODY} fill="#e0e7ff" stroke="#e0e7ff" strokeWidth="18" strokeLinejoin="round" />
        <polygon points={BODY} fill="url(#nouri-glass)" stroke="url(#nouri-glass)" strokeWidth="15" strokeLinejoin="round" fillOpacity=".96" />
        <polygon points={BODY} fill="url(#nouri-shade)" stroke="url(#nouri-shade)" strokeWidth="15" strokeLinejoin="round" />
        {/* little light bubbles inside the glass */}
        {[[36, 84, 1.6], [86, 66, 1.3], [80, 100, 1.8], [30, 64, 1.1], [92, 82, 1]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity=".45" />
        ))}
        {/* specular highlights */}
        <ellipse cx="41" cy="45" rx="11" ry="4.5" fill="#fff" opacity=".55" transform="rotate(-32 41 45)" />
        <circle cx="53" cy="36" r="2.2" fill="#fff" opacity=".75" />
        <path d="M95 60 Q99 66 97 74" stroke="#fff" strokeWidth="2.2" opacity=".35" fill="none" strokeLinecap="round" />

        {/* the heart of light ("nour") */}
        <circle cx="60" cy="96" r="17" fill="url(#nouri-halo)" className={core} style={{ transformOrigin: "60px 96px", transformBox: "view-box" }} />
        <circle cx="60" cy="96" r="10.5" fill="url(#nouri-core-fill)" stroke="#d97706" strokeWidth="1.2" />
        <circle cx="56.5" cy="92.5" r="2.6" fill="#fff" opacity=".8" />
        {topic === "space" ? (
          <g>
            <circle cx="59.5" cy="96.5" r="5" fill="#b45309" opacity=".85" />
            <circle cx="62" cy="94.8" r="4.3" fill="#ffd23f" />
          </g>
        ) : (
          CORE_SYMBOL[topic] && (
            <text x="60" y="99.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#7a4f12" fontFamily="var(--font-display), sans-serif">
              {CORE_SYMBOL[topic]}
            </text>
          )
        )}

        {/* face */}
        <g className="nova-blink" style={{ transformOrigin: "60px 62px", transformBox: "view-box" }}>
          {[49, 71].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="62" rx="9" ry="10.5" fill="#fff" stroke="#4c2bb0" strokeWidth="1" />
              <circle cx={x + ex} cy={63 + ey} r="5.6" fill="url(#nouri-iris)" />
              <circle cx={x + 1.8 + ex} cy={60.4 + ey} r="2" fill="#fff" />
              <circle cx={x - 1.6 + ex} cy={65.6 + ey} r="1" fill="#fff" opacity=".85" />
            </g>
          ))}
        </g>
        {mood === "encourage" && (
          <g stroke={NIGHT} strokeWidth="2" strokeLinecap="round">
            <path d="M42 49 l9 2.2" />
            <path d="M78 49 l-9 2.2" />
          </g>
        )}
        <ellipse cx="38" cy="73" rx="5" ry="3" fill="#ff8fb1" opacity=".8" />
        <ellipse cx="82" cy="73" rx="5" ry="3" fill="#ff8fb1" opacity=".8" />

        {/* mouth */}
        {talking ? (
          <ellipse cx="60" cy="77" rx="4.6" ry="3.8" fill={NIGHT} className="nova-talk" style={{ transformOrigin: "60px 77px", transformBox: "view-box" }} />
        ) : mood === "thinking" ? (
          <circle cx="62" cy="77.5" r="2.6" fill={NIGHT} />
        ) : mood === "excited" ? (
          <g>
            <path d="M52 73.5 Q60 85 68 73.5Z" fill={NIGHT} stroke={NIGHT} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M55.5 78.5 Q60 81.5 64.5 78.5" fill="#ff8fb1" />
          </g>
        ) : (
          <path d="M53 74.5 Q60 80.5 67 74.5" stroke={NIGHT} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        )}

        <Accessory topic={topic} layer="front" />

        {/* celebration sparkles */}
        {mood === "excited" &&
          [[14, 40], [104, 46], [24, 18], [98, 16]].map(([x, y], i) => (
            <path key={i} className="garden-spark" style={{ animationDelay: `${i * 0.3}s` }} transform={`translate(${x} ${y}) scale(.45)`} d="M16 2c1.2 7.4 4.6 10.8 12 12-7.4 1.2-10.8 4.6-12 12-1.2-7.4-4.6-10.8-12-12 7.4-1.2 10.8-4.6 12-12z" fill={MARKER} stroke={NIGHT} strokeWidth="2" />
          ))}
      </g>
    </svg>
  );
}
