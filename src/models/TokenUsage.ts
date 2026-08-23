import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { connectDB } from "@/lib/db";

export const TOKENS_PER_QUESTION_ESTIMATE = 520;
export const AI_BANK_RESERVE_RATIO = 0.05;

const tokenUsageSchema = new Schema(
  {
    day: { type: String, required: true, unique: true },
    tokensUsed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type TokenUsageDoc = InferSchemaType<typeof tokenUsageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TokenUsage: Model<TokenUsageDoc> =
  mongoose.models.TokenUsage ??
  mongoose.model<TokenUsageDoc>("TokenUsage", tokenUsageSchema);

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function dailyTokenLimit() {
  const raw = process.env.DAILY_AI_TOKEN_LIMIT;
  const n = raw ? Number(raw) : 100_000;
  return Number.isFinite(n) ? n : 100_000;
}

export function aiReserveTokens(limit = dailyTokenLimit()) {
  return limit * AI_BANK_RESERVE_RATIO;
}

export async function getTokensUsedToday() {
  await connectDB();
  const doc = await TokenUsage.findOne({ day: todayKey() }).lean();
  return doc?.tokensUsed ?? 0;
}

export async function addTokensUsed(amount: number) {
  await connectDB();
  await TokenUsage.findOneAndUpdate(
    { day: todayKey() },
    { $inc: { tokensUsed: amount } },
    { upsert: true, new: true },
  );
}

export async function getAiBudget() {
  const limit = dailyTokenLimit();
  const used = await getTokensUsedToday();
  const remaining = Math.max(0, limit - used);
  const reserve = aiReserveTokens(limit);
  const bankMode = remaining <= reserve;
  const estimatedQuestionsLeft = bankMode
    ? 0
    : Math.floor(remaining / TOKENS_PER_QUESTION_ESTIMATE);

  return {
    limit,
    used,
    remaining,
    reserve,
    bankMode,
    estimatedQuestionsLeft,
  };
}

export async function canUseAi(estimatedNeed = 0) {
  const { remaining, reserve } = await getAiBudget();
  if (remaining <= reserve) return false;
  if (estimatedNeed > 0 && remaining < estimatedNeed) return false;
  return true;
}
