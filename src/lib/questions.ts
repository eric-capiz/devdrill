import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import type { Level, Track } from "@/lib/catalog";
import { generateQuestions } from "@/lib/groq";
import { isUsableQuizPrompt, normalizePrompt } from "@/lib/promptFences";
import { Question, type StoredLevel } from "@/models/Question";
import { canUseAi } from "@/models/TokenUsage";

const TOKENS_PER_QUESTION = 520;

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
  const usedIds = new Set(opts.excludeIds ?? []);
  const need = opts.count;
  const selected: QuestionLean[] = [];

  async function loadBank() {
    return shuffle(
      (
        await Question.find({
          track: opts.track,
          subject: opts.subject,
          level: { $in: levels },
          ...(usedIds.size
            ? {
                _id: {
                  $nin: [...usedIds].map((id) => new mongoose.Types.ObjectId(id)),
                },
              }
            : {}),
        }).lean()
      ).filter((q) => isUsableQuizPrompt(q.prompt ?? "")),
    ) as QuestionLean[];
  }

  async function saveOrReuse(
    q: {
      prompt: string;
      choices: string[];
      correctIndex: number;
      explanation: string;
    },
    lvl: StoredLevel,
    tokenEstimate: number,
  ): Promise<QuestionLean | null> {
    const prompt = normalizePrompt(q.prompt);
    if (!isUsableQuizPrompt(prompt)) return null;
    const existing = await Question.findOne({
      track: opts.track,
      subject: opts.subject,
      level: lvl,
      prompt,
    }).lean();

    if (existing) {
      const id = existing._id.toString();
      if (usedIds.has(id)) return null;
      usedIds.add(id);
      return existing as QuestionLean;
    }

    const docs = await Question.insertMany([
      {
        ...q,
        prompt,
        level: lvl,
        track: opts.track,
        subject: opts.subject,
        metadata: {
          model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
          generatedAt: new Date(),
          tokenEstimate,
        },
      },
    ]);
    const created = docs[0].toObject() as QuestionLean;
    usedIds.add(created._id.toString());
    return created;
  }

  async function generateFresh(count: number): Promise<QuestionLean[]> {
    if (count <= 0) return [];
    if (!(await canUseAi(count * TOKENS_PER_QUESTION))) return [];

    const lvl = levels.includes("Mid") ? "Mid" : levels[0];
    const batch = await generateQuestions({
      level: lvl,
      track: opts.track,
      subject: opts.subject,
      count,
    });
    if (!batch) return [];

    const tokenEstimate = Math.round(
      batch.tokensUsed / Math.max(1, batch.questions.length),
    );
    const created: QuestionLean[] = [];

    for (const q of batch.questions) {
      if (created.length >= count) break;
      const doc = await saveOrReuse(
        { ...q, prompt: normalizePrompt(q.prompt) },
        lvl,
        tokenEstimate,
      );
      if (doc) created.push(doc);
    }

    return created.slice(0, count);
  }

  if (await canUseAi(need * TOKENS_PER_QUESTION)) {
    selected.push(...(await generateFresh(need)));
  }

  if (selected.length < need) {
    const bank = await loadBank();
    selected.push(...bank.slice(0, need - selected.length));
  }

  if (selected.length === 0) {
    return {
      ok: false as const,
      error:
        "No questions available for this topic yet, and daily AI tokens are exhausted. Try again after tokens reset, or pick another subject.",
    };
  }

  return {
    ok: true as const,
    questions: shuffle(selected).slice(0, Math.min(need, selected.length)),
  };
}
