export type Rank = {
  xp: number;
  title: string;
};

export const RANKS: Rank[] = [
  { xp: 0, title: "Hello World" },
  { xp: 150, title: "Script Kiddie" },
  { xp: 400, title: "Code Cadet" },
  { xp: 800, title: "Merge Machine" },
  { xp: 1500, title: "Refactor Ranger" },
  { xp: 2500, title: "10x Engineer" },
  { xp: 5000, title: "Stack Overlord" },
];

export function rankFor(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.xp) current = rank;
  }
  return current;
}

export function nextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (xp < rank.xp) return rank;
  }
  return null;
}

export function rankProgress(xp: number): number {
  const current = rankFor(xp);
  const next = nextRank(xp);
  if (!next) return 100;
  const span = next.xp - current.xp;
  if (span <= 0) return 100;
  return Math.min(100, Math.round(((xp - current.xp) / span) * 100));
}
