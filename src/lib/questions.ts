import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import type { Level, Track } from "@/lib/catalog";
import { generateQuestions } from "@/lib/groq";
import { Question, type StoredLevel } from "@/models/Question";
import { canUseAi } from "@/models/TokenUsage";

function expandLevels(level: Level): StoredLevel[] {
  if (level === "All") return ["Junior", "Mid", "Senior"];
  return [level];
}

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
  level: StoredLevel;
  track: string;
  subject: string;
};

export async function getQuestionsForQuiz(opts: {
  level: Level;
  track: Track;
  subject: string;
  count: number;
  excludeIds?: string[];
}) {
  await connectDB();
  const levels = expandLevels(opts.level);
  const exclude = new Set(opts.excludeIds ?? []);
  const need = opts.count;

  const existing = shuffle(
    await Question.find({
      track: opts.track,
      subject: opts.subject,
      level: { $in: levels },
      ...(exclude.size
        ? {
            _id: {
              $nin: [...exclude].map((id) => new mongoose.Types.ObjectId(id)),
            },
          }
        : {}),
    }).lean(),
  ) as QuestionLean[];

  async function generateFresh(count: number): Promise<QuestionLean[]> {
    if (count <= 0) return [];
    if (!(await canUseAi(count * 450))) return [];

    const created: QuestionLean[] = [];
    const perLevel = Math.max(1, Math.ceil(count / levels.length));

    for (const lvl of levels) {
      if (created.length >= count) break;
      const remaining = count - created.length;
      const batch = await generateQuestions({
        level: lvl,
        track: opts.track,
        subject: opts.subject,
        count: Math.min(perLevel, remaining),
      });
      if (!batch) break;

      const docs = await Question.insertMany(
        batch.questions.map((q) => ({
          ...q,
          level: lvl,
          track: opts.track,
          subject: opts.subject,
          metadata: {
            model: "llama-3.3-70b-versatile",
            generatedAt: new Date(),
            tokenEstimate: Math.round(
              batch.tokensUsed / batch.questions.length,
            ),
          },
        })),
      );

      created.push(...docs.map((d) => d.toObject() as QuestionLean));
    }

    return created.slice(0, count);
  }

  const aiBudgetOk = await canUseAi(Math.max(1, Math.ceil(need / 2)) * 450);
  const hasBank = existing.length > 0;

  let bankTarget = 0;
  let aiTarget = 0;

  if (aiBudgetOk && hasBank) {
    bankTarget = Math.floor(need / 2);
    aiTarget = need - bankTarget;
  } else if (aiBudgetOk) {
    aiTarget = need;
  } else {
    bankTarget = need;
  }

  const fromBank = existing.slice(0, Math.min(bankTarget, existing.length));
  const bankShortfall = bankTarget - fromBank.length;
  const fromAi = await generateFresh(aiTarget + bankShortfall);

  const usedIds = new Set(
    [...fromBank, ...fromAi].map((q) => q._id.toString()),
  );
  const leftoverBank = existing.filter((q) => !usedIds.has(q._id.toString()));
  const shortfall = need - fromBank.length - fromAi.length;
  const backfill = leftoverBank.slice(0, Math.max(0, shortfall));

  const selected = shuffle([...fromBank, ...fromAi, ...backfill]).slice(
    0,
    Math.min(need, fromBank.length + fromAi.length + backfill.length),
  );

  if (selected.length === 0) {
    return {
      ok: false as const,
      error:
        "No questions available for this topic yet, and daily AI tokens are exhausted. Try again after tokens reset, or pick another subject.",
    };
  }

  return { ok: true as const, questions: selected };
}
