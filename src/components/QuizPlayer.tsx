"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  extendUnlimitedAction,
  fiftyFiftyAction,
  gradeQuizAction,
  saveAnswerAction,
} from "@/app/actions/quiz";
import { RichPrompt } from "@/components/RichPrompt";

const SHOT_CLOCK = 30;

export type QuizQuestionView = {
  id: string;
  prompt: string;
  choices: string[];
};

type Props = {
  attemptId: string;
  mode: "fixed" | "unlimited";
  meta: {
    level: string;
    track: string;
    subject: string;
    length: number | null;
  };
  questions: QuizQuestionView[];
  initialAnswers: Record<
    string,
    { selectedIndex: number | null; skipped: boolean }
  >;
};

export function QuizPlayer({
  attemptId,
  mode,
  meta,
  questions,
  initialAnswers,
}: Props) {
  const order = useMemo(() => questions.map((q) => q.id), [questions]);
  const [answers, setAnswers] = useState(initialAnswers);
  const [skipQueue, setSkipQueue] = useState<string[]>([]);
  const [phase, setPhase] = useState<"main" | "skips">("main");
  const [mainIndex, setMainIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SHOT_CLOCK);
  const autoExtendTried = useRef(false);
  const timedOutFor = useRef<string | null>(null);
  const onSkipRef = useRef<() => void>(() => {});
  onSkipRef.current = onSkip;

  const currentId =
    phase === "main" ? order[mainIndex] : skipQueue[0] ?? null;
  const current = questions.find((q) => q.id === currentId) ?? null;
  const selected = current ? answers[current.id]?.selectedIndex ?? null : null;

  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedIndex !== null && !a.skipped,
  ).length;

  function persist(
    questionId: string,
    selectedIndex: number | null,
    skipped: boolean,
  ) {
    startTransition(async () => {
      await saveAnswerAction({
        attemptId,
        questionId,
        selectedIndex,
        skipped,
      });
    });
  }

  function requestMoreQuestions() {
    setExtending(true);
    setMessage(null);
    startTransition(async () => {
      const res = await extendUnlimitedAction(attemptId);
      if (!res.ok) {
        setMessage(res.message ?? "Could not add questions");
        setExtending(false);
        return;
      }
      window.location.reload();
    });
  }

  function goNextAfterSkip(questionId: string) {
    if (phase === "main") {
      setSkipQueue((q) => (q.includes(questionId) ? q : [...q, questionId]));
      if (mainIndex + 1 < order.length) setMainIndex((i) => i + 1);
      else setPhase("skips");
    } else {
      setSkipQueue((q) => {
        const rest = q.filter((id) => id !== questionId);
        return [...rest, questionId];
      });
    }
  }

  function goNextAfterAnswer() {
    if (phase === "main") {
      const atEnd = mainIndex + 1 >= order.length;
      if (!atEnd) {
        setMainIndex((i) => i + 1);
        return;
      }
      if (skipQueue.length > 0) {
        setPhase("skips");
        return;
      }
      if (mode === "unlimited") {
        requestMoreQuestions();
        return;
      }
    } else {
      const nextQueue = skipQueue.slice(1);
      setSkipQueue(nextQueue);
      if (nextQueue.length === 0 && mode === "unlimited") {
        requestMoreQuestions();
      }
    }
  }

  function onSelect(index: number) {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { selectedIndex: index, skipped: false },
    }));
    setSkipQueue((q) => q.filter((id) => id !== current.id));
    persist(current.id, index, false);
  }

  function onSkip() {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { selectedIndex: null, skipped: true },
    }));
    persist(current.id, null, true);
    goNextAfterSkip(current.id);
  }

  function finishesRound() {
    if (mode !== "fixed") return false;
    if (phase === "main") {
      return mainIndex + 1 >= order.length && skipQueue.length === 0;
    }
    return skipQueue.length <= 1;
  }

  function onContinue() {
    if (!current || selected === null) return;
    if (finishesRound()) {
      const questionId = current.id;
      const selectedIndex = selected;
      startTransition(async () => {
        await saveAnswerAction({
          attemptId,
          questionId,
          selectedIndex,
          skipped: false,
        });
        const res = await gradeQuizAction(attemptId);
        if (res && !res.ok) setMessage(res.message ?? "Could not grade quiz");
      });
      return;
    }
    goNextAfterAnswer();
  }

  function onGrade() {
    startTransition(async () => {
      const res = await gradeQuizAction(attemptId);
      if (res && !res.ok) setMessage(res.message ?? "Could not grade quiz");
    });
  }

  // If unlimited lands on an empty pass with no current question, keep going
  useEffect(() => {
    if (mode !== "unlimited") return;
    if (current) {
      autoExtendTried.current = false;
      return;
    }
    if (pending || extending || autoExtendTried.current) return;
    autoExtendTried.current = true;
    requestMoreQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, current, pending, extending]);

  // Shot clock: 30 seconds per question, then auto-pass
  useEffect(() => {
    if (!currentId) return;
    timedOutFor.current = null;
    setEliminated([]);
    setSecondsLeft(SHOT_CLOCK);
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [currentId]);

  useEffect(() => {
    if (secondsLeft === 0 && current && timedOutFor.current !== current.id) {
      timedOutFor.current = current.id;
      onSkipRef.current();
    }
  }, [secondsLeft, current]);

  function onFiftyFifty() {
    if (!current || fiftyUsed || pending) return;
    const questionId = current.id;
    startTransition(async () => {
      const res = await fiftyFiftyAction({ attemptId, questionId });
      if (!res.ok || !res.eliminated) {
        setMessage(res.message ?? "Could not use 50:50");
        return;
      }
      setFiftyUsed(true);
      setEliminated(res.eliminated);
      setMessage(null);
    });
  }

  const showHeaderGrade = mode === "unlimited";

  const progressLabel =
    mode === "unlimited"
      ? phase === "skips" && skipQueue.length > 0
        ? `Skipped · ${skipQueue.length} left`
        : extending
          ? "Loading more questions..."
          : `Question ${Math.max(answeredCount, mainIndex + (current ? 1 : 0))}`
      : phase === "main"
        ? `Question ${Math.min(mainIndex + 1, order.length)} / ${order.length}`
        : skipQueue.length > 0
          ? `Skipped · ${skipQueue.length}`
          : "Ready to grade";

  const progress =
    mode === "unlimited"
      ? 15 + ((answeredCount * 7) % 70)
      : phase === "main"
        ? ((mainIndex + (selected !== null ? 0.35 : 0)) / order.length) * 100
        : 100;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mx-auto w-full max-w-2xl">
      {mode === "fixed" ? (
        <div className="mb-5 h-2.5 overflow-hidden rounded-full border-2 border-[var(--gold)] bg-[var(--stage-2)] sm:mb-6 sm:h-3">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--buzzer)]"
            animate={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-extrabold uppercase leading-relaxed tracking-[0.14em] text-[var(--gold)] sm:text-xs sm:tracking-[0.18em]">
            {meta.level} · {meta.track} · {meta.subject}
            {mode === "fixed" && meta.length
              ? ` · ${meta.length}`
              : " · Unlimited"}
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-wide sm:text-4xl">
            {progressLabel}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`shot-clock${secondsLeft <= 10 ? " shot-clock-low" : ""}`}
            title="Shot clock — answer before it hits zero"
          >
            <span className="shot-clock-digits">
              0:{String(secondsLeft).padStart(2, "0")}
            </span>
            <span className="shot-clock-bar">
              <span style={{ width: `${(secondsLeft / SHOT_CLOCK) * 100}%` }} />
            </span>
          </div>
          {showHeaderGrade ? (
            <button
              type="button"
              onClick={onGrade}
              disabled={pending}
              className="btn btn-gold w-full shrink-0 text-xs disabled:opacity-60 sm:w-auto"
            >
              Lock in my score
            </button>
          ) : null}
        </div>
      </div>
      </div>

      <div className="mt-2 flex items-start gap-6">
        {mode === "fixed" ? (
          <aside className="ladder sticky top-24 hidden w-44 shrink-0 md:block" aria-label="Prize ladder">
            {order.map((id, i) => {
              const answered =
                answers[id]?.selectedIndex !== null && !answers[id]?.skipped;
              const isCurrent = phase === "main" && i === mainIndex;
              return (
                <div
                  key={id}
                  className={`ladder-rung${answered ? " ladder-rung-done" : ""}${isCurrent ? " ladder-rung-current" : ""}`}
                >
                  <span className="ladder-rung-num">{i + 1}</span>
                  <span className="ladder-rung-prize">${(i + 1) * 100}</span>
                </div>
              );
            })}
          </aside>
        ) : null}

        <div className="mx-auto w-full min-w-0 max-w-2xl flex-1">
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-[var(--gold)] bg-[var(--stage-2)] px-3 py-2 text-sm text-[var(--gold)]">
          {message}
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.id}
            className="board-tile mt-6 p-4 sm:mt-8 sm:p-8"
            initial={{ opacity: 0, rotateY: 20, scale: 0.98 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -20, scale: 0.98 }}
          >
            <RichPrompt
              text={current.prompt}
              className="font-display text-xl leading-snug tracking-wide text-[var(--spot)] sm:text-3xl"
            />
            <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
              {current.choices.map((choice, index) => {
                if (eliminated.includes(index)) return null;
                const active = selected === index;
                return (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onSelect(index)}
                      className={`choice-btn w-full rounded-xl border-2 px-3.5 py-3.5 text-left text-sm font-extrabold leading-snug sm:px-4 ${
                        active
                          ? "choice-btn-active border-[var(--gold)] bg-[var(--gold)] text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--stage)]/60 text-[var(--spot)]"
                      }`}
                    >
                      <span className="mr-2 opacity-70">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {choice}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={onSkip}
                className="btn btn-ghost w-full sm:w-auto"
              >
                Pass
              </button>
              <button
                type="button"
                onClick={onFiftyFifty}
                disabled={fiftyUsed || pending || selected !== null}
                className="lifeline-btn w-full disabled:opacity-40 sm:w-auto"
                title="Knock out two wrong answers. One use per round."
              >
                {fiftyUsed ? "50:50 used" : "50:50"}
              </button>
              <button
                type="button"
                onClick={onContinue}
                disabled={selected === null || extending}
                className="btn btn-buzzer w-full disabled:opacity-40 sm:w-auto"
              >
                {finishesRound()
                  ? "View results"
                  : mode === "unlimited" &&
                      phase === "main" &&
                      mainIndex + 1 >= order.length &&
                      skipQueue.length === 0
                    ? "Next questions"
                    : "Lock in"}
              </button>
            </div>
            {mode === "unlimited" ? (
              <p className="mt-4 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                Unlimited keeps going until you lock in your score. Only answered
                questions count for points.
              </p>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="done"
            className="board-tile mt-8 p-5 sm:mt-10 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {mode === "unlimited" ? (
              <>
                <p className="font-display text-2xl tracking-wide sm:text-3xl">
                  {extending ? "LOADING MORE..." : "KEEP GOING?"}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Unlimited mode loads more questions as you go. Grade whenever
                  you want to lock in your points.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={requestMoreQuestions}
                    disabled={pending || extending}
                    className="btn btn-buzzer w-full disabled:opacity-60 sm:w-auto"
                  >
                    Load more questions
                  </button>
                  <button
                    type="button"
                    onClick={onGrade}
                    disabled={pending}
                    className="btn btn-gold w-full disabled:opacity-60 sm:w-auto"
                  >
                    Lock in my score
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-display text-2xl tracking-wide sm:text-3xl">
                  END OF ROUND
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  You finished every question. Passes count as incorrect.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={onGrade}
                    disabled={pending}
                    className="btn btn-gold w-full disabled:opacity-60 sm:w-auto"
                  >
                    Lock in my score
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
