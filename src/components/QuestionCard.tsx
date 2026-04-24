import Link from "next/link";
import { Question } from "@/lib/users";

const difficultyStyles: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  hard: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  xhard: "bg-red-500/15 text-red-300 border-red-500/30",
};

const difficultyLabels: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  xhard: "xHard",
};

const resultStyles: Record<string, string> = {
  correct: "bg-emerald-500/15 text-emerald-300",
  partial: "bg-amber-500/15 text-amber-300",
  wrong: "bg-red-500/15 text-red-300",
  skipped: "bg-zinc-500/15 text-zinc-400",
};

const resultLabels: Record<string, string> = {
  correct: "Correct",
  partial: "Partial",
  wrong: "Wrong",
  skipped: "Skipped",
};

// For xhard cards we only want the opening context paragraph in the preview.
// The full structured body (Constraints list, **Your task:** callout) is
// reserved for the detail page.
function previewText(q: Question): string {
  if (q.difficulty !== "xhard") return q.question;
  const blocks = q.question.split(/\n{2,}/);
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    if (/^constraints\s*:/i.test(block)) continue;
    if (/^\*\*your task\s*:\*\*/i.test(block)) continue;
    return block;
  }
  return q.question;
}

export function QuestionCard({ q }: { q: Question }) {
  const showScore = q.difficulty === "xhard" && q.thoughtfulnessScore !== null;
  return (
    <Link href={`/questions/${q.id}`} className="group block">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-dim)] hover:shadow-[0_0_0_1px_var(--color-accent-dim),0_12px_40px_var(--color-accent-glow)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase ${difficultyStyles[q.difficulty] || ""}`}
          >
            {difficultyLabels[q.difficulty] || q.difficulty}
          </span>
          <span className="text-xs font-medium text-[var(--color-text-dim)]">
            {q.topic}
          </span>
          {q.medium === "image" && (
            <span className="text-xs text-[var(--color-text-muted)]">
              · image
            </span>
          )}
          <span className="ml-auto text-xs text-[var(--color-text-muted)]">
            {new Date(q.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {q.imagePath && (
          <div className="mb-4 aspect-[16/10] overflow-hidden rounded-lg border border-[var(--color-border)]">
            <img
              src={q.imagePath}
              alt="Quiz image"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <p className="mb-5 line-clamp-6 flex-1 text-[0.95rem] leading-relaxed text-[var(--color-text)]">
          {previewText(q)}
        </p>

        <div className="flex items-center gap-2">
          {showScore ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent-glow)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
              {q.thoughtfulnessScore}/5 thoughtfulness
            </span>
          ) : q.result ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${resultStyles[q.result] || ""}`}
            >
              {resultLabels[q.result] || q.result}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/15 px-2 py-0.5 text-xs font-semibold text-zinc-400">
              Pending
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
