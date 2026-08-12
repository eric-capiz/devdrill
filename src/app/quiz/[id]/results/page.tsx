import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfettiBurst } from "@/components/bits/ConfettiBurst";
import { FlipScore } from "@/components/bits/FlipScore";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  await connectDB();
  const attempt = await QuizAttempt.findById(id).lean();
  if (!attempt || attempt.userId.toString() !== session.userId) notFound();
  if (attempt.status !== "graded") redirect(`/quiz/${id}`);

  const questions = await Question.find({ _id: { $in: attempt.questionIds } }).lean();
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));
  const headline =
    attempt.mode === "unlimited"
      ? `${attempt.points ?? 0} PTS`
      : `${attempt.scorePercent ?? 0}%`;
  const celebrate =
    attempt.mode === "unlimited"
      ? (attempt.points ?? 0) > 0
      : (attempt.scorePercent ?? 0) >= 70;

  return (
    <main className="flex-1 py-8 sm:py-12">
      <ConfettiBurst fire={celebrate} />
      <div className="shell max-w-2xl">
        <div className="scoreboard p-5 sm:p-8">
          <p className="text-[0.65rem] font-extrabold uppercase leading-relaxed tracking-[0.16em] text-[var(--gold)] sm:text-xs sm:tracking-[0.2em]">
            {attempt.level} · {attempt.track} · {attempt.subject}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,14vw,4.5rem)] tracking-wide text-[var(--gold)]">
            <FlipScore value={headline} />
          </h1>
          <p className="mt-2 font-bold text-[var(--muted)]">
            {attempt.correctCount ?? 0} correct
            {attempt.mode === "fixed"
              ? ` / ${attempt.length ?? attempt.questionIds.length}`
              : " answered"}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/quiz/setup" className="btn btn-buzzer w-full sm:w-auto">
              Next round
            </Link>
            <Link href="/history" className="btn btn-ghost w-full sm:w-auto">
              Recaps
            </Link>
          </div>
        </div>

        <ol className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
          {attempt.answers.map((answer, idx) => {
            const q = byId.get(answer.questionId.toString());
            if (!q) return null;
            if (
              attempt.mode === "unlimited" &&
              (answer.selectedIndex === null || answer.skipped)
            ) {
              return null;
            }
            const correct = answer.isCorrect === true;
            const selected = answer.selectedIndex;
            return (
              <li key={q._id.toString()} className="board-tile p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="min-w-0 font-display text-lg leading-snug tracking-wide sm:text-xl">
                    <span className="mr-2 text-[var(--gold)]">{idx + 1}.</span>
                    {q.prompt}
                  </p>
                  <span
                    className={`w-fit shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold ${
                      correct
                        ? "bg-[var(--ok)]/20 text-[var(--ok)]"
                        : "bg-[var(--bad)]/20 text-[var(--bad)]"
                    }`}
                  >
                    {correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm font-bold">
                  {q.choices.map((choice, i) => {
                    const isCorrectChoice = i === q.correctIndex;
                    const isSelected = selected === i;
                    return (
                      <li
                        key={i}
                        className={`rounded-xl border px-3 py-2.5 leading-snug ${
                          isCorrectChoice
                            ? "border-[var(--ok)]/50 bg-[var(--ok)]/10"
                            : isSelected
                              ? "border-[var(--bad)]/50 bg-[var(--bad)]/10"
                              : "border-[var(--line)] bg-[var(--stage)]/50"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {choice}
                        {isCorrectChoice ? " ✓" : ""}
                        {isSelected && !isCorrectChoice ? " (yours)" : ""}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {q.explanation}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
