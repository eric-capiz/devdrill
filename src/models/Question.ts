import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { Level, Track } from "@/lib/catalog";

const questionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    choices: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: "Questions must have exactly 4 choices",
      },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
    level: {
      type: String,
      required: true,
      enum: ["Junior", "Mid", "Senior"],
    },
    track: {
      type: String,
      required: true,
      enum: ["Frontend", "A+"],
    },
    subject: { type: String, required: true, index: true },
    format: { type: String, default: "multiple-choice" },
    source: { type: String, default: "bank" },
    origin: { type: String },
    key: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

questionSchema.index({ level: 1, track: 1, subject: 1 });

export type QuestionDoc = InferSchemaType<typeof questionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type StoredLevel = Exclude<Level, "All">;
export type StoredTrack = Track;

export const Question: Model<QuestionDoc> =
  mongoose.models.Question ??
  mongoose.model<QuestionDoc>("Question", questionSchema);
