export const LEVELS = [
  { name: "Novice", xp: 0 },
  { name: "Apprentice", xp: 250 },
  { name: "Engineer", xp: 700 },
  { name: "Architect", xp: 1300 },
  { name: "AI Expert", xp: 2000 },
];

export const XP = {
  learn: 10,
  try: 30,
  quizCorrect: 10,
  quizPerfect: 25,
  lessonComplete: 25,
  module: 100,
  finalPass: 200,
  badge: 50,
};

export function levelFor(xp: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return { index, name: current.name, next, progress, toNext: next ? next.xp - xp : 0 };
}
