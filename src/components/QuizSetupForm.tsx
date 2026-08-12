"use client";

import { useActionState, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  LEVELS,
  QUIZ_LENGTHS,
  SUBJECTS,
  TRACKS,
  type Track,
} from "@/lib/catalog";
import { startQuizAction, type ActionResult } from "@/app/actions/quiz";
import { Buzzer } from "@/components/bits/Buzzer";

const initial: ActionResult = { ok: false };

export function QuizSetupForm() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Junior");
  const [track, setTrack] = useState<Track>("Frontend");
  const subjects = useMemo(() => SUBJECTS[track], [track]);
  const [subject, setSubject] = useState<string>(SUBJECTS.Frontend[0]);
  const [length, setLength] = useState<string>("10");
  const [state, formAction, pending] = useActionState(startQuizAction, initial);

  return (
    <motion.form
      action={formAction}
      className="podium space-y-6 px-4 py-5 sm:space-y-7 sm:px-6 sm:py-7"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <fieldset>
        <legend className="font-display text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
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
        <legend className="font-display text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
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
                  setSubject(SUBJECTS[t][0]);
                }}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="subject" className="font-display text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          CATEGORY
        </label>
        <select
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="field mt-3"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="font-display text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
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
        <p className="rounded-xl bg-[var(--stage)] px-3 py-2 text-sm font-bold text-[var(--gold)]">
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
