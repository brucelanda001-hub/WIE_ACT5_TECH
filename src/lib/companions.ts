// Companions are earned by learning (5 coins per answered question), never bought with money,
// and never lost: no streaks, no decay, no pressure (UK Children's Code: nudge techniques).
export type Companion = { id: string; name: string; emoji: string; cost: number; loves: string; color: string };

export const COMPANIONS: Companion[] = [
  { id: "sprout", name: "Sproutley", emoji: "🌱", cost: 0, loves: "plants, rain and the water cycle", color: "bg-leaf-soft" },
  { id: "owl", name: "Barnaby", emoji: "🦉", cost: 120, loves: "words, stories and the night sky", color: "bg-ink-soft" },
  { id: "turtle", name: "Coral", emoji: "🐢", cost: 200, loves: "the sea, Carthage and slow, careful thinking", color: "bg-marker-soft" },
  { id: "camel", name: "Jamel", emoji: "🐪", cost: 300, loves: "deserts, maths and long journeys", color: "bg-margin-soft" },
  { id: "rocket", name: "Nouri Jr.", emoji: "🚀", cost: 450, loves: "planets, the Moon and big questions", color: "bg-ink-soft" },
];

export const COINS_PER_ANSWER = 5;
export const GROW_COST = 40;
export const GROW_STAGES = [
  { xp: 0, emoji: "🌱", name: "Seed sprout" },
  { xp: 100, emoji: "🌿", name: "Little plant" },
  { xp: 200, emoji: "🌻", name: "Sunflower" },
  { xp: 300, emoji: "🌳", name: "Wise tree" },
];

export function stageFor(xp: number) {
  return [...GROW_STAGES].reverse().find((s) => xp >= s.xp) ?? GROW_STAGES[0];
}
