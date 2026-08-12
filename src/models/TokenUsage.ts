import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

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

export async function getTokensUsedToday() {
  const doc = await TokenUsage.findOne({ day: todayKey() }).lean();
  return doc?.tokensUsed ?? 0;
}

export async function addTokensUsed(amount: number) {
  await TokenUsage.findOneAndUpdate(
    { day: todayKey() },
    { $inc: { tokensUsed: amount } },
    { upsert: true, new: true },
  );
}

export function dailyTokenLimit() {
  const raw = process.env.DAILY_AI_TOKEN_LIMIT;
  const n = raw ? Number(raw) : 100_000;
  return Number.isFinite(n) ? n : 100_000;
}

export async function canUseAi(estimatedNeed = 0) {
  const used = await getTokensUsedToday();
  return used + estimatedNeed < dailyTokenLimit();
}
