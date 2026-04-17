import Link from "next/link";
import { Question } from "@/lib/users";

const difficultyStyles: Record<string, string> = {
  easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  hard: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  xhard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const difficultyLabels: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  xhard: "xHard",
};

const resultStyles: Record<string, string> = {
  correct: "bg-emerald-500/20 text-emerald-400",
  partial: "bg-amber-500/20 text-amber-400",
  wrong: "bg-red-500/20 text-red-400",
  skipped: "bg-zinc-500/20 text-zinc-400",
};

const resultLabels: Record<string, string> = {
  correct: "✓ Correct",
  partial: "~ Partial",
  wrong: "✗ Wrong",
  skipped: "— Skipped",
};

export function QuestionCard({
  username,
  q,
}: {
  username: string;
  q: Question;
}) {
  const showScore = q.difficulty === "xhard" && q.thoughtfulnessScore !== null;
  return (
    <Link href={`/${username}/q/${q.id}`} className="group block">
      <article className="relative h-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:border-[var(--color-accent-dim)] hover:shadow-[0_0_40px_var(--color-accent-glow)]">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyStyles[q.difficulty] || ""}`}
          >
            {difficultyLabels[q.difficulty] || q.difficulty}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {q.topic}
          </span>
          {q.medium === "image" && (
            <span className="text-xs text-[var(--color-text-muted)]">
              · image
            </span>
          )}
          <span className="ml-auto text-xs text-[var(--color-text-muted)]">
            {new Date(q.createdAt).toLocaleDateString()}
          </span>
        </div>

        {q.imagePath && (
          <div className="mb-3 aspect-[16/10] overflow-hidden rounded-lg">
            <img
              src={q.imagePath}
              alt="Quiz image"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <p className="mb-4 text-base leading-snug text-[var(--color-text)] group-hover:text-[var(--color-accent)]">
          {q.question}
        </p>

        <div className="flex items-center gap-2 text-xs">
          {showScore ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-glow)] px-2.5 py-0.5 font-medium text-[var(--color-accent)]">
              Thoughtfulness {q.thoughtfulnessScore}/5
            </span>
          ) : q.result ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${resultStyles[q.result] || ""}`}
            >
              {resultLabels[q.result] || q.result}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-2.5 py-0.5 font-medium text-zinc-400">
              Pending
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
