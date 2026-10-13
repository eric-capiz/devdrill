// Who Wants To Be A Millionaire-style prize ladder.

export const CLASSIC_LADDER = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000,
  250000, 500000, 1000000,
];

/** Prize ladder for a round of `length` questions. Extends past $1M by doubling. */
export function ladderFor(length: number): number[] {
  const ladder = CLASSIC_LADDER.slice(0, Math.min(length, CLASSIC_LADDER.length));
  let top = ladder[ladder.length - 1] ?? 100;
  while (ladder.length < length) {
    top *= 2;
    ladder.push(top);
  }
  return ladder;
}

/** Safe-haven rung indices (classic: $1K and $32K). */
export function safeHavenIndices(ladder: number[]): number[] {
  const havens: number[] = [];
  if (ladder.length > 4) havens.push(4);
  if (ladder.length > 9) havens.push(9);
  return havens;
}

export function isSafeHaven(ladder: number[], index: number): boolean {
  return safeHavenIndices(ladder).includes(index);
}

export function formatMoney(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/**
 * Winnings from a leading run of `correctStreak` correct answers:
 * the highest safe haven reached, or 0.
 */
export function winningsFor(ladder: number[], correctStreak: number): number {
  let winnings = 0;
  for (const h of safeHavenIndices(ladder)) {
    if (h < correctStreak) winnings = ladder[h];
  }
  return winnings;
}
