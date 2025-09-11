import levels from "~/constants/levels.json";

// levels is sorted by xp asc
const thresholds = levels.map((l) => ({ level: l.level as number, xp: l.xp as number }));

export function xpToLevel(xp: number): number {
  // Find the greatest level whose xp <= input xp
  // Simple linear scan is fine for 100 entries
  let current = thresholds[0]?.level ?? 1;
  for (const t of thresholds) {
    if (xp >= t.xp) current = t.level;
    else break;
  }
  return current;
}

