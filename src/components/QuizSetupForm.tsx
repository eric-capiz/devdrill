"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { LEVELS, QUIZ_LENGTHS, TRACKS, type Track } from "@/lib/catalog";
import { startQuizAction, type ActionResult } from "@/app/actions/quiz";
import { Buzzer } from "@/components/bits/Buzzer";

const initial: ActionResult = { ok: false };

export function QuizSetupForm({
  initialTrack,
  initialLevel,
  initialLength,
}: {
  initialTrack?: Track;
  initialLevel?: (typeof LEVELS)[number];
  initialLength?: string;
}) {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(
    initialLevel ?? "Junior",
  );
  const [track, setTrack] = useState<Track>(initialTrack ?? "Frontend");
  const [length, setLength] = useState<string>(initialLength ?? "5");
  const [state, formAction, pending] = useActionState(startQuizAction, initial);

  return (
    <motion.form
      action={formAction}
      className="podium space-y-6 px-4 py-5 sm:space-y-7 sm:px-6 sm:py-7"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <fieldset>
        <legend className="font-display text-xl tracking-wide text-[var(--spot)] sm:text-2xl">
          LEVEL
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <label key={l} className={`chip ${level === l ? "chip-active" : ""}`}>
              <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl tracking-wide text-[var(--spot)] sm:text-2xl">
          TRACK
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <label key={t} className={`chip ${track === t ? "chip-active" : ""}`}>
              <input
                type="radio"
                name="track"
                value={t}
                checked={track === t}
                onChange={() => {
                  setTrack(t);
                }}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl tracking-wide text-[var(--spot)] sm:text-2xl">
          ROUND LENGTH
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUIZ_LENGTHS.map((len) => {
            const value = String(len);
            return (
              <label key={value} className={`chip ${length === value ? "chip-active" : ""}`}>
                <input type="radio" name="length" value={value} checked={length === value} onChange={() => setLength(value)} className="sr-only" />
                {value}
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.message ? (
        <p className="rounded-xl bg-[#2e1a0e] px-3 py-2 text-sm font-bold text-[var(--gold)]">
          {state.message}
        </p>
      ) : null}

      <Buzzer>
        <button type="submit" disabled={pending} className="btn btn-buzzer w-full disabled:opacity-60">
          {pending ? "Loading the board..." : "Start the round"}
        </button>
      </Buzzer>
    </motion.form>
  );
}
