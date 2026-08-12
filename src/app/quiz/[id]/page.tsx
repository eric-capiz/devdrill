import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QuizPlayer } from "@/components/QuizPlayer";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";

export const metadata: Metadata = {
  title: "Live round",
  robots: { index: false, follow: false },
};

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  await connectDB();
  const attempt = await QuizAttempt.findById(id).lean();
  if (!attempt || attempt.userId.toString() !== session.userId) {
    notFound();
  }

  if (attempt.status === "graded") {
    redirect(`/quiz/${id}/results`);
  }

  const questions = await Question.find({
    _id: { $in: attempt.questionIds },
  }).lean();

  const byId = new Map(questions.map((q) => [q._id.toString(), q]));
  const ordered = attempt.questionIds
    .map((qid) => byId.get(qid.toString()))
    .filter(Boolean);

  const initialAnswers: Record<
    string,
    { selectedIndex: number | null; skipped: boolean }
  > = {};
  for (const a of attempt.answers) {
    initialAnswers[a.questionId.toString()] = {
      selectedIndex: a.selectedIndex ?? null,
      skipped: !!a.skipped,
    };
  }

  return (
    <main className="flex-1 py-8 sm:py-12">
      <div className="shell max-w-2xl">
        <QuizPlayer
          attemptId={id}
          mode={attempt.mode as "fixed" | "unlimited"}
          meta={{
            level: attempt.level,
            track: attempt.track,
            subject: attempt.subject,
            length: attempt.length ?? null,
          }}
          questions={ordered.map((q) => ({
            id: q!._id.toString(),
            prompt: q!.prompt,
            choices: q!.choices,
          }))}
          initialAnswers={initialAnswers}
        />
      </div>
    </main>
  );
}
