import Groq from "groq-sdk";
import { z } from "zod";
import type { Track } from "@/lib/catalog";
import { isCodeHeavySubject } from "@/lib/codeSubjects";
import type { StoredLevel } from "@/models/Question";
import { addTokensUsed, canUseAi } from "@/models/TokenUsage";

const generatedQuestionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

const batchSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey: key });
}

const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(codeHeavy: boolean) {
  const codeRules = codeHeavy
    ? `* About half the questions must include a short code snippet in the prompt
* Put each snippet inside a markdown code fence (triple backticks) with an optional language tag
* Keep snippets small (about 3 to 12 lines) so they read well on mobile
* For snippet questions, ask what is wrong, what the output or result is, which fix is correct, or what the code does
* The other half can be concept or scenario questions without code
* Choices should usually be short plain text; short inline code in a choice is fine`
    : `* Prefer clear concept and scenario questions
* You may include a short code snippet in at most one question if it truly helps
* If you include a snippet, put it inside a markdown code fence (triple backticks)`;

  return `You are an expert web development quiz author. Return ONLY valid JSON matching this shape:
{"questions":[{"prompt":"...","choices":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}
Rules:
* Exactly 4 choices per question
* correctIndex is 0 to 3
* Difficulty must match the level
* Explanations are brief (1 to 3 sentences) and make the correct answer clear
* Do not wrap the whole JSON in markdown fences
${codeRules}`;
}

export async function generateQuestions(opts: {
  level: StoredLevel;
  track: Track;
  subject: string;
  count: number;
}): Promise<{ questions: GeneratedQuestion[]; tokensUsed: number } | null> {
  const estimated = opts.count * 520;
  if (!(await canUseAi(estimated))) {
    return null;
  }

  const codeHeavy = isCodeHeavySubject(opts.subject);
  const client = getClient();
  const system = buildSystemPrompt(codeHeavy);
  const user = `Generate ${opts.count} multiple choice questions.
Level: ${opts.level}
Track: ${opts.track}
Subject: ${opts.subject}
Make questions practical and distinct from each other.
${
  codeHeavy
    ? "Target about a 50/50 mix of code snippet questions and concept questions."
    : "Keep most questions conceptual unless a tiny snippet clearly helps."
}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  const tokensUsed =
    completion.usage?.total_tokens ??
    Math.ceil((system.length + user.length + content.length) / 4);

  await addTokensUsed(tokensUsed);

  const parsed = batchSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Groq returned invalid question JSON");
  }

  return {
    questions: parsed.data.questions.slice(0, opts.count),
    tokensUsed,
  };
}
