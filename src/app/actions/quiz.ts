"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { LEVELS, SUBJECTS, TRACKS } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { ladderFor, winningsFor } from "@/lib/ladder";
import { getQuestionsForQuiz } from "@/lib/questions";
import { requireSession } from "@/lib/session";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { User } from "@/models/User";

const startSchema = z.object({
  level: z.enum(LEVELS),
  track: z.enum(TRACKS),
  subject: z.string().min(1),
  length: z.enum(["5", "10", "15", "20", "25", "Unlimited"]),
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
  const length = lengthRaw === "Unlimited" ? null : Number(lengthRaw);
  const count = length ?? 5;

  try {
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
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("startQuizAction failed", error);
    return {
      ok: false,
      message:
        "Could not start this quiz. Try again, or pick another subject.",
    };
  }
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
    count: 5,
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
    // Winnings = highest safe haven in the leading run of correct answers.
    let streak = 0;
    for (const answer of attempt.answers) {
      if (answer.isCorrect === true) streak++;
      else break;
    }
    attempt.winnings = winningsFor(ladderFor(total), streak);
  } else {
    attempt.correctCount = correctCount;
    attempt.points = correctCount;
    attempt.scorePercent = scored > 0 ? Math.round((correctCount / scored) * 100) : 0;
    attempt.winnings = null;
  }

  attempt.status = "graded";
  attempt.gradedAt = new Date();

  // Replay loop: XP + daily streak
  const xpEarned =
    attempt.mode === "fixed"
      ? correctCount * 10 + (attempt.scorePercent === 100 ? 50 : 0)
      : correctCount * 10;
  attempt.xpEarned = xpEarned;

  const player = await User.findById(session.userId);
  if (player) {
    const now = new Date();
    const startOfToday = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const last = player.lastPlayedAt ? new Date(player.lastPlayedAt) : null;
    const startOfLast = last
      ? Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate())
      : null;
    let streak = player.streakCount ?? 0;
    if (startOfLast === null || startOfLast < startOfToday - 86400000) {
      streak = 1;
    } else if (startOfLast === startOfToday - 86400000) {
      streak += 1;
    }
    player.streakCount = streak;
    player.lastPlayedAt = now;
    player.xp = (player.xp ?? 0) + xpEarned;
    await player.save();
  }

  await attempt.save();

  revalidatePath("/");
  revalidatePath("/history");
  redirect(`/quiz/${attemptId}/results`);
}

export async function fiftyFiftyAction(input: {
  attemptId: string;
  questionId: string;
}): Promise<{ ok: boolean; eliminated?: number[]; message?: string }> {
  const res = await useLifeline(input.attemptId, input.questionId, "fifty");
  if (!res.ok) return res;
  const { q } = res;

  const wrong = [0, 1, 2, 3].filter((i) => i !== q.correctIndex);
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  const eliminated = wrong.slice(0, 2).sort((a, b) => a - b);
  return { ok: true, eliminated };
}

async function useLifeline(
  attemptId: string,
  questionId: string,
  name: string,
) {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false as const, message: "Unauthorized" };

  await connectDB();
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt || attempt.userId.toString() !== session.userId) {
    return { ok: false as const, message: "Quiz not found" };
  }
  if (attempt.status !== "in_progress" || attempt.mode !== "fixed") {
    return { ok: false as const, message: "Lifelines are for fixed rounds" };
  }
  if ((attempt.lifelinesUsed ?? []).includes(name)) {
    return { ok: false as const, message: "Lifeline already used" };
  }
  const inRound = attempt.questionIds.some(
    (id) => id.toString() === questionId,
  );
  const q = await Question.findById(questionId).lean();
  if (!q || !inRound) {
    return { ok: false as const, message: "Question not in round" };
  }

  attempt.lifelinesUsed = [...(attempt.lifelinesUsed ?? []), name];
  await attempt.save();
  return { ok: true as const, attempt, q };
}

export async function revealAnswerAction(input: {
  attemptId: string;
  questionId: string;
}): Promise<{ ok: boolean; isCorrect?: boolean; message?: string }> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, message: "Unauthorized" };

  await connectDB();
  const attempt = await QuizAttempt.findById(input.attemptId);
  if (!attempt || attempt.userId.toString() !== session.userId) {
    return { ok: false, message: "Quiz not found" };
  }
  if (attempt.status !== "in_progress") {
    return { ok: false, message: "Round already over" };
  }
  const answer = attempt.answers.find(
    (a) => a.questionId.toString() === input.questionId,
  );
  if (!answer || answer.selectedIndex === null || answer.skipped) {
    return { ok: false, message: "Lock in an answer first" };
  }
  const q = await Question.findById(input.questionId).lean();
  if (!q) return { ok: false, message: "Question not found" };

  return { ok: true, isCorrect: answer.selectedIndex === q.correctIndex };
}

export async function audienceAction(input: {
  attemptId: string;
  questionId: string;
}): Promise<{ ok: boolean; votes?: number[]; message?: string }> {
  const res = await useLifeline(input.attemptId, input.questionId, "audience");
  if (!res.ok) return res;
  const { attempt, q } = res;

  // Smarter audiences on easier questions.
  const correctShare =
    attempt.level === "Junior"
      ? 55 + Math.random() * 25
      : attempt.level === "Senior"
        ? 35 + Math.random() * 20
        : 45 + Math.random() * 20;

  const votes = [0, 0, 0, 0];
  votes[q.correctIndex] = Math.round(correctShare);
  let rest = 100 - votes[q.correctIndex];
  const wrong = [0, 1, 2, 3].filter((i) => i !== q.correctIndex);
  for (let i = 0; i < wrong.length; i++) {
    if (i === wrong.length - 1) {
      votes[wrong[i]] = rest;
    } else {
      const share = Math.round(Math.random() * rest);
      votes[wrong[i]] = share;
      rest -= share;
    }
  }
  return { ok: true, votes };
}

const FRIEND_LINES = [
  "I'm {c}% sure it's {letter}. Don't blame me if I'm wrong.",
  "{letter}. Definitely {letter}. Well… {c}% definitely.",
  "I asked my rubber duck and we both say {letter} ({c}% sure).",
  "Easy — {letter}. I'd bet my mechanical keyboard on it. ({c}%)",
];

export async function phoneFriendAction(input: {
  attemptId: string;
  questionId: string;
}): Promise<{
  ok: boolean;
  pick?: number;
  confidence?: number;
  line?: string;
  message?: string;
}> {
  const res = await useLifeline(input.attemptId, input.questionId, "phone");
  if (!res.ok) return res;
  const { attempt, q } = res;

  const hitRate =
    attempt.level === "Junior" ? 0.8 : attempt.level === "Senior" ? 0.5 : 0.65;
  const pick =
    Math.random() < hitRate
      ? q.correctIndex
      : [0, 1, 2, 3].filter((i) => i !== q.correctIndex)[
          Math.floor(Math.random() * 3)
        ];
  const confidence = 55 + Math.round(Math.random() * 40);
  const letter = String.fromCharCode(65 + pick);
  const line = FRIEND_LINES[Math.floor(Math.random() * FRIEND_LINES.length)]
    .replaceAll("{c}", String(confidence))
    .replaceAll("{letter}", letter);
  return { ok: true, pick, confidence, line };
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
