import Groq from "groq-sdk";
import { z } from "zod";
import type { Track } from "@/lib/catalog";
import { isCodeHeavySubject } from "@/lib/codeSubjects";
import { isUsableQuizPrompt, normalizePrompt } from "@/lib/promptFences";
import type { StoredLevel } from "@/models/Question";
import {
  addTokensUsed,
  canUseAi,
  TOKENS_PER_QUESTION_ESTIMATE,
} from "@/models/TokenUsage";

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

const MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";

const quizBatchJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "choices", "correctIndex", "explanation"],
        properties: {
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: { type: "string" },
          },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
        },
      },
    },
  },
};

function buildSystemPrompt(codeHeavy: boolean) {
  const codeRules = codeHeavy
    ? `* About half the questions must include a short code snippet in the prompt
* Put each snippet inside a markdown code fence (triple backticks) with an optional language tag
* A fence is invalid unless it contains real code. Never emit an empty fence
* Keep newlines inside the snippet so each line of code is on its own line
* Keep snippets small (about 3 to 12 lines) so they read well on mobile
* For snippet questions, the question text must depend on that code
* The other half can be concept or scenario questions without any code fence
* Choices should usually be short plain text; short inline code in a choice is fine`
    : `* Prefer clear concept and scenario questions
* You may include a short code snippet in at most one question if it truly helps
* If you include a snippet, put it inside a markdown code fence (triple backticks)
* Never emit an empty fence. The fence must contain the actual code`;

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
  const estimated = opts.count * TOKENS_PER_QUESTION_ESTIMATE;
  if (!(await canUseAi(estimated))) {
    return null;
  }

  const codeHeavy = isCodeHeavySubject(opts.subject);
  let client: ReturnType<typeof getClient>;
  try {
    client = getClient();
  } catch (error) {
    console.error("Groq client is not configured", error);
    return null;
  }
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

  const request = {
    model: MODEL,
    temperature: 0.7,
    reasoning_effort: "low" as const,
    include_reasoning: false,
    max_completion_tokens: Math.min(8192, Math.max(1200, opts.count * 700)),
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
  };

  let completion;
  try {
    completion = await client.chat.completions.create({
      ...request,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quiz_questions_batch",
          strict: true,
          schema: quizBatchJsonSchema,
        },
      },
    });
  } catch {
    try {
      completion = await client.chat.completions.create({
        ...request,
        response_format: { type: "json_object" },
      });
    } catch (error) {
      console.error("Groq question generation failed", error);
      return null;
    }
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch (error) {
    console.error("Groq returned non JSON content", error);
    return null;
  }

  await addTokensUsed(
    completion.usage?.total_tokens ??
      Math.ceil((system.length + user.length + content.length) / 4),
  );

  const parsed = batchSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return null;
  }

  const questions = parsed.data.questions
    .map((q) => ({ ...q, prompt: normalizePrompt(q.prompt) }))
    .filter((q) => isUsableQuizPrompt(q.prompt))
    .slice(0, opts.count);

  if (questions.length === 0) {
    return null;
  }

  return {
    questions,
    tokensUsed:
      completion.usage?.total_tokens ??
      Math.ceil((system.length + user.length + content.length) / 4),
  };
}
