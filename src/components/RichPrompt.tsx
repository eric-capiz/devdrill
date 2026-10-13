import type { ReactNode } from "react";
import { parsePromptSegments } from "@/lib/promptFences";

export function RichPrompt({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const segments = parsePromptSegments(text);

  const nodes: ReactNode[] = segments.map((segment, i) => {
    if (segment.kind === "code") {
      return (
        <pre
          key={i}
          className="my-4 overflow-x-auto rounded-xl border-2 border-[var(--ink)] bg-[#2e1a0e] p-3 text-left text-sm font-semibold leading-relaxed text-[#f6efe0] sm:p-4"
        >
          <code className="font-mono whitespace-pre">{segment.value}</code>
        </pre>
      );
    }

    const trimmed = segment.value.trim();
    if (!trimmed) return null;

    return (
      <span key={i} className="whitespace-pre-wrap">
        {segment.value.trim()}
      </span>
    );
  });

  return <div className={className}>{nodes}</div>;
}
