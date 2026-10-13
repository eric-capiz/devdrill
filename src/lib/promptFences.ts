const FENCE = /```([^\n`]*)\n?([\s\S]*?)```/g;

export type PromptSegment =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string; lang?: string };

function fenceBodyIsEmpty(body: string) {
  return body.replace(/\s/g, "") === "";
}

export function parsePromptSegments(input: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const fence = new RegExp(FENCE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(input)) !== null) {
    if (match.index > last) {
      segments.push({ kind: "text", value: input.slice(last, match.index) });
    }
    const lang = match[1]?.trim() || undefined;
    const code = match[2].replace(/^\n/, "").replace(/\n$/, "");
    if (!fenceBodyIsEmpty(code)) {
      segments.push({ kind: "code", value: code, lang });
    }
    last = match.index + match[0].length;
  }

  if (last < input.length) {
    segments.push({ kind: "text", value: input.slice(last) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: input }];
}

export function promptHasEmptyFence(prompt: string) {
  const fence = new RegExp(FENCE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = fence.exec(prompt)) !== null) {
    if (fenceBodyIsEmpty(match[2] ?? "")) return true;
  }
  return false;
}

const BLOCK_HTML_TAG_PATTERN =
  /<\/?(ul|ol|li|p|div|table|tr|td|th|blockquote|h[1-6]|br|pre)[^>]*>/gi;

export function stripHtmlTags(text: string) {
  return text.replace(BLOCK_HTML_TAG_PATTERN, " ");
}

const COMPLETE_ENDINGS = new Set([
  ".",
  "?",
  "!",
  ":",
  ";",
  ")",
  "]",
  "}",
  "\"",
  "'",
  "`",
]);

export function textLooksComplete(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return COMPLETE_ENDINGS.has(trimmed.slice(-1));
}

export function promptLooksComplete(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) return false;
  const fenceCount = (trimmed.match(/```/g) ?? []).length;
  if (fenceCount % 2 !== 0) return false;
  const lastFence = trimmed.lastIndexOf("```");
  const tail = lastFence >= 0 ? trimmed.slice(lastFence + 3) : trimmed;
  if (!tail.trim()) return true;
  return textLooksComplete(tail);
}

export function isUsableQuizPrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) return false;
  if (promptHasEmptyFence(trimmed)) return false;
  return promptLooksComplete(trimmed);
}

function collapseOutsideCode(text: string) {
  return text.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n");
}

export function normalizePrompt(prompt: string) {
  const fence = new RegExp(FENCE.source, "g");
  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(prompt)) !== null) {
    out += collapseOutsideCode(stripHtmlTags(prompt.slice(last, match.index)));
    const lang = (match[1] || "").trim();
    const code = (match[2] ?? "").replace(/^\n+/, "").replace(/\n+$/, "");
    if (!fenceBodyIsEmpty(code)) {
      out += `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
    }
    last = match.index + match[0].length;
  }

  out += collapseOutsideCode(stripHtmlTags(prompt.slice(last)));
  return out.replace(/\\"/g, '"').trim();
}
