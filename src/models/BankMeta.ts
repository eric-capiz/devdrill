import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const bankMetaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    version: { type: Number, required: true },
  },
  { timestamps: true },
);

export type BankMetaDoc = InferSchemaType<typeof bankMetaSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BankMeta: Model<BankMetaDoc> =
  mongoose.models.BankMeta ??
  mongoose.model<BankMetaDoc>("BankMeta", bankMetaSchema);
