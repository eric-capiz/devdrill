import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import type { Level, Track } from "@/lib/catalog";
import { choicesAreDistinct, isUsableQuizPrompt } from "@/lib/promptFences";
import { ensureBankSeeded } from "@/lib/seedBank";
import { Question } from "@/models/Question";

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type QuestionLean = {
  _id: mongoose.Types.ObjectId;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  level: Level;
  track: string;
  subject: string;
};

export async function getQuestionsForQuiz(opts: {
  level: Level;
  track: Track;
  count: number;
  excludeIds?: string[];
}) {
  await ensureBankSeeded();
  await connectDB();

  const excludeObjectIds = (opts.excludeIds ?? []).map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  const bank = shuffle(
    (
      await Question.find({
        track: opts.track,
        level: opts.level,
        source: "bank",
        ...(excludeObjectIds.length
          ? { _id: { $nin: excludeObjectIds } }
          : {}),
      }).lean()
    ).filter(
      (q) =>
        isUsableQuizPrompt(q.prompt ?? "") &&
        choicesAreDistinct(q.choices ?? []),
    ),
  ) as QuestionLean[];

  if (bank.length === 0) {
    return {
      ok: false as const,
      error:
        "No questions banked for this level and topic yet. Try another level or topic.",
    };
  }

  return {
    ok: true as const,
    questions: bank.slice(0, Math.min(opts.count, bank.length)),
  };
}
