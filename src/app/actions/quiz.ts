"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LEVELS, SUBJECTS, TRACKS } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { getQuestionsForQuiz } from "@/lib/questions";
import { requireSession } from "@/lib/session";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";

const startSchema = z.object({
  level: z.enum(LEVELS),
  track: z.enum(TRACKS),
  subject: z.string().min(1),
  length: z.enum(["10", "20", "30", "40", "50", "Unlimited"]),
});

export type ActionResult = { ok: boolean; message?: string };

export async function startQuizAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) {
    return { ok: false, message: "Please log in to start a quiz" };
  }

  const parsed = startSchema.safeParse({
    level: formData.get("level"),
    track: formData.get("track"),
    subject: formData.get("subject"),
    length: formData.get("length"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid quiz setup" };
  }

  const { level, track, subject, length: lengthRaw } = parsed.data;
  const allowed = SUBJECTS[track] as readonly string[];
  if (!allowed.includes(subject)) {
    return { ok: false, message: "Subject does not match track" };
  }

  const mode = lengthRaw === "Unlimited" ? "unlimited" : "fixed";
  const length =
    lengthRaw === "Unlimited" ? null : (Number(lengthRaw) as 10 | 20 | 30 | 40 | 50);
  const count = length ?? 10;

  const result = await getQuestionsForQuiz({
    level,
    track,
    subject,
    count,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  await connectDB();
  const attempt = await QuizAttempt.create({
    userId: session.userId,
    level,
    track,
    subject,
    mode,
    length: mode === "fixed" ? length : null,
    questionIds: result.questions.map((q) => q._id),
    answers: result.questions.map((q) => ({
      questionId: q._id,
      selectedIndex: null,
      skipped: false,
      isCorrect: null,
    })),
    status: "in_progress",
  });

  redirect(`/quiz/${attempt._id.toString()}`);
}

export async function saveAnswerAction(input: {
  attemptId: string;
  questionId: string;
  selectedIndex: number | null;
  skipped: boolean;
}): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, message: "Unauthorized" };

  await connectDB();
  const attempt = await QuizAttempt.findById(input.attemptId);
  if (!attempt || attempt.userId.toString() !== session.userId) {
    return { ok: false, message: "Quiz not found" };
  }
  if (attempt.status !== "in_progress") {
    return { ok: false, message: "Quiz already graded" };
  }

  const answer = attempt.answers.find(
    (a) => a.questionId.toString() === input.questionId,
  );
  if (!answer) return { ok: false, message: "Question not in quiz" };

  answer.selectedIndex = input.skipped ? null : input.selectedIndex;
  answer.skipped = input.skipped;
  await attempt.save();
  return { ok: true };
}

export async function extendUnlimitedAction(
  attemptId: string,
): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, message: "Unauthorized" };

  await connectDB();
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt || attempt.userId.toString() !== session.userId) {
    return { ok: false, message: "Quiz not found" };
  }
  if (attempt.mode !== "unlimited" || attempt.status !== "in_progress") {
    return { ok: false, message: "Cannot extend this quiz" };
  }

  const result = await getQuestionsForQuiz({
    level: attempt.level as (typeof LEVELS)[number],
    track: attempt.track as (typeof TRACKS)[number],
    subject: attempt.subject,
    count: 10,
    excludeIds: attempt.questionIds.map((id) => id.toString()),
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  const existing = new Set(attempt.questionIds.map((id) => id.toString()));
  const fresh = result.questions.filter((q) => !existing.has(q._id.toString()));
  if (fresh.length === 0) {
    return {
      ok: false,
      message:
        "No additional questions available right now. You can grade what you have, or try again later.",
    };
  }

  for (const q of fresh) {
    attempt.questionIds.push(q._id);
    attempt.answers.push({
      questionId: q._id,
      selectedIndex: null,
      skipped: false,
      isCorrect: null,
    });
  }
  await attempt.save();
  revalidatePath(`/quiz/${attemptId}`);
  return { ok: true };
}

export async function gradeQuizAction(attemptId: string): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, message: "Unauthorized" };

  await connectDB();
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt || attempt.userId.toString() !== session.userId) {
    return { ok: false, message: "Quiz not found" };
  }
  if (attempt.status === "graded") {
    redirect(`/quiz/${attemptId}/results`);
  }

  const questions = await Question.find({
    _id: { $in: attempt.questionIds },
  }).lean();
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctCount = 0;
  let scored = 0;

  for (const answer of attempt.answers) {
    const q = byId.get(answer.questionId.toString());
    if (!q) continue;

    if (attempt.mode === "unlimited") {
      if (answer.selectedIndex === null || answer.skipped) {
        answer.isCorrect = null;
        continue;
      }
      scored += 1;
      const ok = answer.selectedIndex === q.correctIndex;
      answer.isCorrect = ok;
      if (ok) correctCount += 1;
    } else {
      scored = attempt.length ?? attempt.questionIds.length;
      const answered =
        answer.selectedIndex !== null && !answer.skipped;
      const ok = answered && answer.selectedIndex === q.correctIndex;
      answer.isCorrect = !!ok;
      if (ok) correctCount += 1;
    }
  }

  if (attempt.mode === "fixed") {
    const total = attempt.length ?? attempt.questionIds.length;
    attempt.correctCount = correctCount;
    attempt.scorePercent = Math.round((correctCount / total) * 100);
    attempt.points = null;
  } else {
    attempt.correctCount = correctCount;
    attempt.points = correctCount;
    attempt.scorePercent = scored > 0 ? Math.round((correctCount / scored) * 100) : 0;
  }

  attempt.status = "graded";
  attempt.gradedAt = new Date();
  await attempt.save();

  revalidatePath("/");
  revalidatePath("/history");
  redirect(`/quiz/${attemptId}/results`);
}

export async function deleteRecapAction(attemptId: string) {
  const session = await requireSession().catch(() => null);
  if (!session) {
    return { ok: false, message: "Unauthorized" };
  }

  await connectDB();
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt || attempt.userId.toString() !== session.userId) {
    return { ok: false, message: "Recap not found" };
  }

  await attempt.deleteOne();
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}
