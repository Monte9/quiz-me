import { getAllIds, getQuestionById } from "@/lib/quiz";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllIds().map((id) => ({ id }));
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = getQuestionById(id);
  if (!q) notFound();

  const showScore = q.difficulty === "xhard" && q.thoughtfulnessScore !== null;

  return (
    <div className="min-h-screen">
      <article className="mx-auto max-w-2xl px-6 pt-12 pb-16">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyStyles[q.difficulty] || ""}`}
          >
            {difficultyLabels[q.difficulty] || q.difficulty}
          </span>
          <span className="text-xs text-[var(--color-accent-dim)]">
            {q.topic}
          </span>
          {q.medium === "image" && (
            <span className="text-xs text-[var(--color-text-muted)]">
              · image
            </span>
          )}
          <span className="ml-auto text-xs text-[var(--color-text-muted)]">
            {new Date(q.createdAt).toLocaleString()}
          </span>
        </div>

        {q.imagePath && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <img src={q.imagePath} alt="Quiz image" className="w-full" />
          </div>
        )}

        <h1 className="mb-6 text-2xl font-bold leading-snug sm:text-3xl">
          {q.question}
        </h1>

        <div className="mb-6">
          {showScore ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-glow)] px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
              Thoughtfulness {q.thoughtfulnessScore}/5
            </span>
          ) : q.result ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${resultStyles[q.result] || ""}`}
            >
              {resultLabels[q.result] || q.result}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-3 py-1 text-sm font-medium text-zinc-400">
              Pending
            </span>
          )}
        </div>

        {q.userAnswer && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
              Your answer
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text)]">
              {q.userAnswer}
            </p>
          </section>
        )}

        {q.answerKey && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
              {q.difficulty === "xhard" ? "Reference framing" : "Answer"}
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text)]">
              {q.answerKey}
            </p>
          </section>
        )}

        {q.grade && (
          <section className="mb-6 border-l-2 border-[var(--color-accent-dim)] pl-4">
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
              Ash's grade
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text-muted)] italic">
              {q.grade}
            </p>
          </section>
        )}
      </article>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="hover:text-[var(--color-accent)]">
          ← Back to all questions
        </Link>
      </footer>
    </div>
  );
}
