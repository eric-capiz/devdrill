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

  const existing = await Question.find({
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
  }).lean();

  let pool = shuffle(existing);

  async function generateIntoPool(need: number) {
    const aiOk = await canUseAi(need * 450);
    if (!aiOk) return;

    const perLevel = Math.max(1, Math.ceil(need / levels.length));
    for (const lvl of levels) {
      if (pool.length >= opts.count) break;
      const remaining = opts.count - pool.length;
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
      pool = shuffle([...pool, ...docs.map((d) => d.toObject())]);
    }
  }

  if (pool.length < opts.count) {
    await generateIntoPool(opts.count - pool.length);
  }

  // Unlimited follow ups: prefer generating fresh questions over recycling
  if (exclude.size > 0 && pool.length < opts.count) {
    await generateIntoPool(opts.count - pool.length);
  }

  if (pool.length === 0) {
    return {
      ok: false as const,
      error:
        "No questions available for this topic yet, and daily AI tokens are exhausted. Try again after tokens reset, or pick another subject.",
    };
  }

  const selected = shuffle(pool).slice(0, Math.min(opts.count, pool.length));
  return { ok: true as const, questions: selected };
}
