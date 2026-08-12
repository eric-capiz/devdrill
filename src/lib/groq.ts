import Groq from "groq-sdk";
import { z } from "zod";
import type { Track } from "@/lib/catalog";
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

export async function generateQuestions(opts: {
  level: StoredLevel;
  track: Track;
  subject: string;
  count: number;
}): Promise<{ questions: GeneratedQuestion[]; tokensUsed: number } | null> {
  const estimated = opts.count * 450;
  if (!(await canUseAi(estimated))) {
    return null;
  }

  const client = getClient();
  const system = `You are an expert web development quiz author. Return ONLY valid JSON matching this shape:
{"questions":[{"prompt":"...","choices":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}
Rules:
* Exactly 4 choices per question
* correctIndex is 0 to 3
* Difficulty must match the level
* Explanations are brief (1 to 3 sentences) and make the correct answer clear
* No markdown fences`;

  const user = `Generate ${opts.count} multiple choice questions.
Level: ${opts.level}
Track: ${opts.track}
Subject: ${opts.subject}
Make questions practical and distinct from each other.`;

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
