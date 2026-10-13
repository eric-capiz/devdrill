"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  audienceAction,
  extendUnlimitedAction,
  fiftyFiftyAction,
  gradeQuizAction,
  phoneFriendAction,
  revealAnswerAction,
  saveAnswerAction,
} from "@/app/actions/quiz";
import { RichPrompt } from "@/components/RichPrompt";
import {
  formatMoney,
  isSafeHaven,
  ladderFor,
  winningsFor,
} from "@/lib/ladder";

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

const SHOT_CLOCK = 30;

type LifelineKind = "fifty" | "audience" | "phone";

export function QuizPlayer({
  attemptId,
  mode,
  meta,
  questions,
  initialAnswers,
}: Props) {
  const order = useMemo(() => questions.map((q) => q.id), [questions]);
  const ladder = useMemo(
    () => (mode === "fixed" ? ladderFor(order.length) : []),
    [mode, order.length],
  );
  const [answers, setAnswers] = useState(initialAnswers);
  const [skipQueue, setSkipQueue] = useState<string[]>([]);
  const [phase, setPhase] = useState<"main" | "skips">("main");
  const [mainIndex, setMainIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [usedLifelines, setUsedLifelines] = useState<LifelineKind[]>([]);
  const [audienceVotes, setAudienceVotes] = useState<number[] | null>(null);
  const [friendSays, setFriendSays] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SHOT_CLOCK);
  const autoExtendTried = useRef(false);
  const timedOutFor = useRef<string | null>(null);
  const onSkipRef = useRef<() => void>(() => {});
  const onTimeoutFixedRef = useRef<() => void>(() => {});

  const currentId =
    phase === "main" ? order[mainIndex] : skipQueue[0] ?? null;
  const current = questions.find((q) => q.id === currentId) ?? null;
  const selected = current ? answers[current.id]?.selectedIndex ?? null : null;

  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedIndex !== null && !a.skipped,
  ).length;

  const banked =
    mode === "fixed" ? winningsFor(ladder, correctStreak) : 0;

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
    if (!current || revealed !== null || failed) return;
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

  function gradeNow() {
    startTransition(async () => {
      const res = await gradeQuizAction(attemptId);
      if (res && !res.ok) setMessage(res.message ?? "Could not grade quiz");
    });
  }

  function lockIn() {
    if (!current || selected === null || revealed !== null || failed || pending)
      return;
    const questionId = current.id;
    const selectedIndex = selected;
    startTransition(async () => {
      await saveAnswerAction({
        attemptId,
        questionId,
        selectedIndex,
        skipped: false,
      });
      const res = await revealAnswerAction({ attemptId, questionId });
      if (!res.ok) {
        setMessage(res.message ?? "Could not reveal the answer");
        return;
      }
      const ok = !!res.isCorrect;
      setRevealed(ok);
      if (ok) {
        setCorrectStreak((s) => s + 1);
        window.setTimeout(() => {
          setRevealed(null);
          if (mainIndex + 1 >= order.length) gradeNow();
          else goNextAfterAnswer();
        }, 1500);
      } else {
        setFailed(true);
        window.setTimeout(() => gradeNow(), 2200);
      }
    });
  }

  function onContinue() {
    if (!current || selected === null || pending) return;
    if (mode === "unlimited") {
      goNextAfterAnswer();
      return;
    }
    lockIn();
  }

  function onWalkAway() {
    if (!current || pending || failed || revealed !== null) return;
    gradeNow();
  }

  function onTimeoutFixed() {
    if (!current || revealed !== null || failed || pending) return;
    const questionId = current.id;
    const selectedIndex = selected;
    startTransition(async () => {
      if (selectedIndex !== null) {
        await saveAnswerAction({
          attemptId,
          questionId,
          selectedIndex,
          skipped: false,
        });
      }
      setRevealed(false);
      setFailed(true);
      setMessage("Time's up! That counts as a miss.");
      window.setTimeout(() => gradeNow(), 2200);
    });
  }

  function useLifeline(kind: LifelineKind) {
    if (
      !current ||
      usedLifelines.includes(kind) ||
      pending ||
      revealed !== null ||
      failed
    )
      return;
    const questionId = current.id;
    startTransition(async () => {
      if (kind === "fifty") {
        const res = await fiftyFiftyAction({ attemptId, questionId });
        if (!res.ok || !res.eliminated) {
          setMessage(res.message ?? "Could not use 50:50");
          return;
        }
        setEliminated(res.eliminated);
      } else if (kind === "audience") {
        const res = await audienceAction({ attemptId, questionId });
        if (!res.ok || !res.votes) {
          setMessage(res.message ?? "The audience is shy today");
          return;
        }
        setAudienceVotes(res.votes);
      } else {
        const res = await phoneFriendAction({ attemptId, questionId });
        if (!res.ok || !res.line) {
          setMessage(res.message ?? "Nobody picked up");
          return;
        }
        setFriendSays(res.line);
      }
      setUsedLifelines((u) => (u.includes(kind) ? u : [...u, kind]));
      setMessage(null);
    });
  }

  onSkipRef.current = onSkip;
  onTimeoutFixedRef.current = onTimeoutFixed;

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

  // Shot clock: 30 seconds per question
  useEffect(() => {
    if (!currentId) return;
    timedOutFor.current = null;
    setEliminated([]);
    setAudienceVotes(null);
    setFriendSays(null);
    setRevealed(null);
    setSecondsLeft(SHOT_CLOCK);
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [currentId]);

  useEffect(() => {
    if (
      secondsLeft === 0 &&
      current &&
      revealed === null &&
      !failed &&
      timedOutFor.current !== current.id
    ) {
      timedOutFor.current = current.id;
      if (mode === "fixed") onTimeoutFixedRef.current();
      else onSkipRef.current();
    }
  }, [secondsLeft, current, revealed, failed, mode]);

  const showHeaderGrade = mode === "unlimited";

  const progressLabel =
    mode === "unlimited"
      ? phase === "skips" && skipQueue.length > 0
        ? `Skipped · ${skipQueue.length} left`
        : extending
          ? "Loading more questions..."
          : `Question ${Math.max(answeredCount, mainIndex + (current ? 1 : 0))}`
      : failed
        ? "Game over"
        : `Question ${Math.min(correctStreak + 1, order.length)} / ${order.length}`;

  const progress =
    mode === "unlimited"
      ? 15 + ((answeredCount * 7) % 70)
      : (correctStreak / order.length) * 100;

  const lifelines: { kind: LifelineKind; label: string; hint: string }[] = [
    { kind: "fifty", label: "50:50", hint: "Knock out two wrong answers" },
    { kind: "audience", label: "Audience", hint: "Poll the audience" },
    { kind: "phone", label: "Phone", hint: "Phone a friend" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mx-auto w-full max-w-2xl">
        {mode === "fixed" ? (
          <div className="mb-5 h-2.5 overflow-hidden rounded-full border border-[var(--gold)] bg-[var(--stage-2)] sm:mb-6 sm:h-3">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--lime)]"
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
                onClick={() => gradeNow()}
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
          <aside
            className="ladder sticky top-24 hidden w-48 shrink-0 md:block"
            aria-label="Prize ladder"
          >
            {ladder.map((value, i) => {
              const done = i < correctStreak;
              const isCurrent = i === correctStreak && !failed;
              const isFailed = failed && i === correctStreak;
              const haven = isSafeHaven(ladder, i);
              return (
                <div
                  key={i}
                  className={`ladder-rung${done ? " ladder-rung-done" : ""}${
                    isCurrent ? " ladder-rung-current" : ""
                  }${isFailed ? " ladder-rung-failed" : ""}${haven ? " ladder-rung-haven" : ""}`}
                >
                  <span className="ladder-rung-num">{i + 1}</span>
                  <span className="ladder-rung-prize">{formatMoney(value)}</span>
                  {haven ? <span className="ladder-haven">SAFE</span> : null}
                </div>
              );
            })}
          </aside>
        ) : null}

        <div className="mx-auto w-full min-w-0 max-w-2xl flex-1">
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
                {revealed !== null ? (
                  <div
                    className={`reveal-banner ${revealed ? "reveal-correct" : "reveal-wrong"}`}
                  >
                    {revealed
                      ? `Correct! ${formatMoney(ladder[correctStreak - 1] ?? 0)}`
                      : failed
                        ? "Wrong — game over"
                        : "Wrong!"}
                  </div>
                ) : null}

                <RichPrompt
                  text={current.prompt}
                  className="font-display text-xl leading-snug tracking-wide text-[var(--spot)] sm:text-3xl"
                />

                {mode === "fixed" && revealed === null && !failed ? (
                  <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
                    {lifelines.map(({ kind, label, hint }) => {
                      const used = usedLifelines.includes(kind);
                      return (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => useLifeline(kind)}
                          disabled={used || pending}
                          className={`lifeline-chip${used ? " lifeline-used" : ""}`}
                          title={used ? `${label} — used up` : hint}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {audienceVotes ? (
                  <div className="audience-panel">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--gold)]">
                      The audience votes
                    </p>
                    <div className="mt-3 space-y-2">
                      {audienceVotes.map((v, i) => (
                        <div key={i} className="audience-row">
                          <span className="audience-letter">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="audience-bar">
                            <motion.span
                              initial={{ width: 0 }}
                              animate={{ width: `${v}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </span>
                          <span className="audience-pct">{v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {friendSays ? (
                  <div className="friend-card">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--lime)]">
                      Phone a friend
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed">
                      &ldquo;{friendSays}&rdquo;
                    </p>
                  </div>
                ) : null}

                <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                  {current.choices.map((choice, index) => {
                    if (eliminated.includes(index)) return null;
                    const active = selected === index;
                    const dimmed = revealed !== null && !active;
                    return (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => onSelect(index)}
                          disabled={revealed !== null || failed}
                          className={`choice-btn w-full rounded-xl border-2 px-3.5 py-3.5 text-left text-sm font-extrabold leading-snug sm:px-4 ${
                            active
                              ? "choice-btn-active border-[var(--gold)] bg-[var(--gold)] text-[var(--ink)]"
                              : "border-[var(--line)] bg-[var(--stage)]/60 text-[var(--spot)]"
                          }${dimmed ? " opacity-40" : ""}`}
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
                  {mode === "fixed" ? (
                    <button
                      type="button"
                      onClick={onWalkAway}
                      disabled={pending || revealed !== null || failed}
                      className="btn btn-ghost w-full disabled:opacity-40 sm:w-auto"
                      title={
                        banked > 0
                          ? `Walk away with ${formatMoney(banked)}`
                          : "Walk away with nothing"
                      }
                    >
                      {banked > 0
                        ? `Walk away · ${formatMoney(banked)}`
                        : "Walk away"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSkip}
                      className="btn btn-ghost w-full sm:w-auto"
                    >
                      Pass
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={selected === null || extending || revealed !== null || failed}
                    className="btn btn-buzzer w-full disabled:opacity-40 sm:w-auto"
                  >
                    {mode === "fixed"
                      ? "Final answer"
                      : phase === "main" &&
                          mainIndex + 1 >= order.length &&
                          skipQueue.length === 0
                        ? "Next questions"
                        : "Lock in"}
                  </button>
                </div>
                {mode === "unlimited" ? (
                  <p className="mt-4 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                    Unlimited keeps going until you lock in your score. Only
                    answered questions count for points.
                  </p>
                ) : (
                  <p className="mt-4 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                    Wrong answer or an empty clock ends the run — you keep your
                    last safe haven.
                  </p>
                )}
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
                      Unlimited mode loads more questions as you go. Grade
                      whenever you want to lock in your points.
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
                        onClick={() => gradeNow()}
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
                      Taking you to your results…
                    </p>
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
