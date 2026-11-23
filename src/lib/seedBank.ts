import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { LEVELS, SUBJECTS, TRACKS } from "@/lib/catalog";
import { BankMeta } from "@/models/BankMeta";
import { Question } from "@/models/Question";

export const BANK_VERSION = 1;

const bankEntrySchema = z
  .object({
    prompt: z.string().min(1),
    choices: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    level: z.enum(LEVELS),
    track: z.enum(TRACKS),
    subject: z.string().min(1),
    format: z.string().default("multiple-choice"),
    source: z.string().default("bank"),
  })
  .superRefine((entry, ctx) => {
    if (new Set(entry.choices).size !== entry.choices.length) {
      ctx.addIssue({
        code: "custom",
        message: "choices must be distinct",
      });
    }
    const subjects = SUBJECTS[entry.track] as readonly string[];
    if (!subjects.includes(entry.subject)) {
      ctx.addIssue({
        code: "custom",
        message: `subject "${entry.subject}" is not valid for track "${entry.track}"`,
      });
    }
  });

export type BankEntry = z.infer<typeof bankEntrySchema>;

export function bankKey(entry: {
  track: string;
  level: string;
  prompt: string;
}) {
  return createHash("sha256")
    .update(`${entry.track}|${entry.level}|${entry.prompt}`)
    .digest("hex");
}

const BANK_FILES = ["frontend.json", "aplus.json"] as const;

let seeded = false;
const seededFiles = new Set<string>();

export async function ensureBankSeeded() {
  if (seeded) return;
  await connectDB();

  const stored = await BankMeta.findOne({ key: "bank" }).lean();
  if (stored && stored.version >= BANK_VERSION) {
    seeded = true;
    return;
  }

  for (const file of BANK_FILES) {
    if (seededFiles.has(file)) continue;
    const filePath = path.join(process.cwd(), "data", "questions", file);
    if (!existsSync(filePath)) {
      console.warn(`[seedBank] Bank file missing, skipping: ${filePath}`);
      continue;
    }
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown[];
    if (!Array.isArray(raw)) {
      console.warn(`[seedBank] Bank file is not an array, skipping: ${filePath}`);
      continue;
    }
    let upserted = 0;
    for (const item of raw) {
      const parsed = bankEntrySchema.safeParse(item);
      if (!parsed.success) {
        console.warn(
          `[seedBank] Invalid entry in ${file}, skipping:`,
          parsed.error.issues.map((i) => i.message).join("; "),
        );
        continue;
      }
      const entry = parsed.data;
      const key = bankKey(entry);
      await Question.updateOne(
        { key },
        { $set: { ...entry, source: "bank", origin: entry.source, key } },
        { upsert: true },
      );
      upserted += 1;
    }
    seededFiles.add(file);
    console.log(`[seedBank] Seeded ${upserted} questions from ${file}`);
  }

  if (BANK_FILES.every((f) => seededFiles.has(f))) {
    await BankMeta.updateOne(
      { key: "bank" },
      { $set: { version: BANK_VERSION } },
      { upsert: true },
    );
    seeded = true;
  }
}
