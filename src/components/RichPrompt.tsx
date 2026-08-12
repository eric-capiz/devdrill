import type { ReactNode } from "react";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string; lang?: string };

function parseSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /```([^\n`]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(input)) !== null) {
    if (match.index > last) {
      segments.push({ kind: "text", value: input.slice(last, match.index) });
    }
    const lang = match[1]?.trim() || undefined;
    const code = match[2].replace(/\n$/, "");
    segments.push({ kind: "code", value: code, lang });
    last = match.index + match[0].length;
  }

  if (last < input.length) {
    segments.push({ kind: "text", value: input.slice(last) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: input }];
}

export function RichPrompt({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const segments = parseSegments(text);

  const nodes: ReactNode[] = segments.map((segment, i) => {
    if (segment.kind === "code") {
      return (
        <pre
          key={i}
          className="my-4 overflow-x-auto rounded-xl border border-[var(--line)] bg-[#040b1d] p-3 text-left text-sm font-semibold leading-relaxed text-[var(--spot)] sm:p-4"
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
