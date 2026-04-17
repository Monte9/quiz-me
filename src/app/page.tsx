import { getAllQuestions, Question } from "@/lib/quiz";
import Link from "next/link";

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

function QuestionCard({ q }: { q: Question }) {
  const showScore = q.difficulty === "xhard" && q.thoughtfulnessScore !== null;
  return (
    <Link href={`/q/${q.id}`} className="group block">
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

export default function Home() {
  const questions = getAllQuestions();
  const total = questions.length;
  const graded = questions.filter(
    (q) => q.result && q.result !== "skipped",
  );
  const correctRate = graded.length
    ? Math.round(
        (graded.filter((q) => q.result === "correct").length / graded.length) *
          100,
      )
    : null;

  return (
    <div className="min-h-screen">
      <header className="bg-[var(--color-bg)]">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
            Quiz Me
          </h1>
          <p className="text-lg text-[var(--color-text-muted)]">
            Daily quizzes from Ash.
            <br />
            <span className="text-sm">
              Easy, medium, hard, xhard. Text and image.
            </span>
          </p>
          {total > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-medium text-[var(--color-text-muted)]">
                {total} total
              </span>
              {correctRate !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-400">
                  {correctRate}% correct
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {total === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-[var(--color-text-muted)]">
              No questions yet. Ask Ash to quiz you.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
        Built by the{" "}
        <a
          href="https://github.com/ashokosnexus"
          className="text-[var(--color-accent-dim)] hover:text-[var(--color-accent)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ash + Monte
        </a>{" "}
        dyad
      </footer>
    </div>
  );
}
