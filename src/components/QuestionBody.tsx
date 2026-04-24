import type { Difficulty } from "@/lib/quiz-core";

type Variant = "ask" | "reveal" | "detail";

type Block =
  | { kind: "para"; text: string }
  | { kind: "constraints"; items: string[] }
  | { kind: "task"; text: string };

// xhard questions come back as a structured document:
//   <context paragraph>
//
//   <prior-attempts paragraph>
//
//   Constraints:
//   - item 1
//   - item 2
//
//   **Your task:** <ask>
//
// Old rows (before the structure change) are free prose. In that case every
// block is a plain paragraph and the renderer just stacks them.
function parseXhard(text: string): Block[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out: Block[] = [];
  for (const block of blocks) {
    if (/^constraints\s*:/i.test(block)) {
      const lines = block.split("\n").slice(1);
      const items = lines
        .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
        .filter(Boolean);
      if (items.length > 0) {
        out.push({ kind: "constraints", items });
        continue;
      }
    }
    const taskMatch = block.match(/^\*\*your task\s*:\*\*\s*([\s\S]*)$/i);
    if (taskMatch) {
      out.push({ kind: "task", text: taskMatch[1].trim() });
      continue;
    }
    out.push({ kind: "para", text: block });
  }
  return out;
}

function headlineSize(variant: Variant) {
  if (variant === "detail") return "text-3xl sm:text-4xl";
  if (variant === "reveal") return "mb-4 text-xl sm:text-2xl";
  return "mb-5 text-2xl sm:text-3xl";
}

export function QuestionBody({
  difficulty,
  text,
  variant = "ask",
}: {
  difficulty: Difficulty;
  text: string;
  variant?: Variant;
}) {
  // Short-form difficulties: single headline-style paragraph. The serif
  // display face works because the text is punchy and short.
  if (difficulty !== "xhard") {
    return (
      <p
        className={`font-display leading-snug font-semibold text-[var(--color-text)] ${headlineSize(variant)}`}
      >
        {text}
      </p>
    );
  }

  // xhard: structured body, sans, body-size. Readable over 150+ words.
  // Force the order: context paragraphs, then Your Task callout, then the
  // Constraints list. We reorder here (not just in the prompt) so legacy
  // rows and any LLM drift still render in the right sequence.
  const parsed = parseXhard(text);
  const paras = parsed.filter((b) => b.kind === "para");
  const task = parsed.find((b) => b.kind === "task");
  const constraints = parsed.find((b) => b.kind === "constraints");
  const blocks: Block[] = [
    ...paras,
    ...(task ? [task] : []),
    ...(constraints ? [constraints] : []),
  ];
  const bodyText =
    variant === "detail"
      ? "text-base leading-relaxed sm:text-lg"
      : "text-base leading-relaxed sm:text-[17px]";

  return (
    <div className={`mb-6 space-y-4 text-[var(--color-text)] ${bodyText}`}>
      {blocks.map((b, i) => {
        if (b.kind === "constraints") {
          return (
            <div key={i}>
              <div className="mb-2 text-[0.7rem] font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">
                Constraints
              </div>
              <ul className="list-disc space-y-1.5 pl-5 text-[var(--color-text-dim)]">
                {b.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            </div>
          );
        }
        if (b.kind === "task") {
          return (
            <div
              key={i}
              className="rounded-lg border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-wash)] px-4 py-3"
            >
              <div className="mb-1 text-[0.7rem] font-semibold tracking-[0.15em] text-[var(--color-accent)] uppercase">
                Your task
              </div>
              <p className="text-[var(--color-text)]">{b.text}</p>
            </div>
          );
        }
        return (
          <p key={i} className="text-[var(--color-text-dim)]">
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
