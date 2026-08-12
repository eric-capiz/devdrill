import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, min: 0, max: 3, default: null },
    skipped: { type: Boolean, default: false },
    isCorrect: { type: Boolean, default: null },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    level: {
      type: String,
      required: true,
      enum: ["Junior", "Mid", "Senior", "All"],
    },
    track: {
      type: String,
      required: true,
      enum: ["Frontend", "Backend", "Fullstack", "DevOps"],
    },
    subject: { type: String, required: true },
    mode: { type: String, required: true, enum: ["fixed", "unlimited"] },
    length: { type: Number, default: null },
    questionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    answers: [answerSchema],
    status: {
      type: String,
      required: true,
      enum: ["in_progress", "graded"],
      default: "in_progress",
    },
    scorePercent: { type: Number, default: null },
    points: { type: Number, default: null },
    correctCount: { type: Number, default: null },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ userId: 1, subject: 1, mode: 1, scorePercent: -1 });
quizAttemptSchema.index({ userId: 1, subject: 1, mode: 1, points: -1 });

export type QuizAttemptDoc = InferSchemaType<typeof quizAttemptSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const QuizAttempt: Model<QuizAttemptDoc> =
  mongoose.models.QuizAttempt ??
  mongoose.model<QuizAttemptDoc>("QuizAttempt", quizAttemptSchema);
