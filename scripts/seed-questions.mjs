// Standalone seed script: upserts data/questions/*.json into MongoDB.
// Usage: MONGODB_URI=... npm run seed:questions
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const LEVELS = ["Junior", "Mid", "Senior"];
const TRACKS = ["Frontend", "A+"];
const SUBJECTS = {
  Frontend: [
    "HTML",
    "CSS / Less / Sass",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "APIs & Fetch",
    "Browser APIs / DOM",
    "Accessibility",
    "Performance",
    "Testing",
    "Tooling",
  ],
  "A+": [
    "Hardware",
    "Networking",
    "Mobile Devices",
    "Printers",
    "Virtualization & Cloud",
    "Operating Systems",
    "Security",
    "Software Troubleshooting",
    "Operational Procedures",
  ],
};
const BANK_VERSION = 1;
const BANK_FILES = ["frontend.json", "aplus.json"];

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    choices: { type: [String], required: true },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
    level: { type: String, required: true, enum: LEVELS },
    track: { type: String, required: true, enum: TRACKS },
    subject: { type: String, required: true },
    format: { type: String, default: "multiple-choice" },
    source: { type: String, default: "bank" },
    origin: { type: String },
    key: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

const bankMetaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    version: { type: Number, required: true },
  },
  { timestamps: true },
);

function isValidEntry(entry) {
  if (!entry || typeof entry !== "object") return "not an object";
  if (typeof entry.prompt !== "string" || !entry.prompt) return "bad prompt";
  if (
    !Array.isArray(entry.choices) ||
    entry.choices.length !== 4 ||
    entry.choices.some((c) => typeof c !== "string" || !c) ||
    new Set(entry.choices).size !== 4
  )
    return "choices must be 4 distinct strings";
  if (
    !Number.isInteger(entry.correctIndex) ||
    entry.correctIndex < 0 ||
    entry.correctIndex > 3
  )
    return "correctIndex must be 0-3";
  if (typeof entry.explanation !== "string" || !entry.explanation)
    return "bad explanation";
  if (!LEVELS.includes(entry.level)) return "bad level";
  if (!TRACKS.includes(entry.track)) return "bad track";
  if (!SUBJECTS[entry.track]?.includes(entry.subject))
    return "subject does not match track";
  return null;
}

function bankKey(entry) {
  return createHash("sha256")
    .update(`${entry.track}|${entry.level}|${entry.prompt}`)
    .digest("hex");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const Question =
    mongoose.models.Question ?? mongoose.model("Question", questionSchema);
  const BankMeta =
    mongoose.models.BankMeta ?? mongoose.model("BankMeta", bankMetaSchema);

  const stored = await BankMeta.findOne({ key: "bank" }).lean();
  if (stored && stored.version >= BANK_VERSION) {
    console.log(`Bank already at version ${stored.version}, skipping.`);
    await mongoose.disconnect();
    return;
  }

  const root = path.dirname(fileURLToPath(import.meta.url));
  const questionsDir = path.join(root, "..", "data", "questions");
  let total = 0;
  const seededFiles = new Set();
  for (const file of BANK_FILES) {
    const filePath = path.join(questionsDir, file);
    if (!existsSync(filePath)) {
      console.warn(`Bank file missing, skipping: ${filePath}`);
      continue;
    }
    const raw = JSON.parse(readFileSync(filePath, "utf8"));
    if (!Array.isArray(raw)) {
      console.warn(`Bank file is not an array, skipping: ${filePath}`);
      continue;
    }
    let upserted = 0;
    for (const item of raw) {
      const problem = isValidEntry(item);
      if (problem) {
        console.warn(`Invalid entry in ${file}, skipping: ${problem}`);
        continue;
      }
      const entry = {
        prompt: item.prompt,
        choices: item.choices,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        level: item.level,
        track: item.track,
        subject: item.subject,
        format: item.format ?? "multiple-choice",
        source: "bank",
        origin: item.source ?? "bank",
      };
      const key = bankKey(entry);
      await Question.updateOne(
        { key },
        { $set: { ...entry, key } },
        { upsert: true },
      );
      upserted += 1;
    }
    console.log(`Seeded ${upserted} questions from ${file}`);
    total += upserted;
    seededFiles.add(file);
  }

  if (BANK_FILES.every((f) => seededFiles.has(f))) {
    await BankMeta.updateOne(
      { key: "bank" },
      { $set: { version: BANK_VERSION } },
      { upsert: true },
    );
    console.log(`Bank version ${BANK_VERSION} recorded.`);
  } else {
    console.log("Not all bank files were present; bank version not recorded.");
  }
  console.log(`Done. ${total} questions upserted.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
