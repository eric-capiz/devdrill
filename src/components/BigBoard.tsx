"use client";

import { useRouter } from "next/navigation";
import { TRACKS } from "@/lib/catalog";

const LEAGUES = [
  { name: "Junior", value: "$100" },
  { name: "Mid", value: "$300" },
  { name: "Senior", value: "$500" },
];

export function BigBoard({
  counts,
}: {
  counts: Record<string, Record<string, number>>;
}) {
  const router = useRouter();

  function play(track: string, level: string) {
    router.push(
      `/quiz/setup?track=${encodeURIComponent(track)}&level=${encodeURIComponent(level)}`,
    );
  }

  return (
    <div className="big-board">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {TRACKS.map((track) => (
          <div key={track} className="board-head">
            {track}
          </div>
        ))}
        {LEAGUES.map((league) =>
          TRACKS.map((track) => {
            const count = counts[track]?.[league.name] ?? 0;
            return (
              <button
                key={`${track}-${league.name}`}
                type="button"
                className="board-cell"
                onClick={() => play(track, league.name)}
                title={`Play ${league.name} ${track}`}
              >
                <span className="board-cell-value">{league.value}</span>
                <span className="board-cell-count">
                  {count > 0 ? `${count} banked` : "fresh batch"}
                </span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
