import Link from "next/link";
import { getQuestionById } from "@/lib/users";
import { BrandBar } from "@/components/BrandBar";
import { SiteFooter } from "@/components/SiteFooter";
import { notFound } from "next/navigation";

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

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hit = await getQuestionById(id);
  if (!hit) notFound();

  const { username, question: q } = hit;
  const showScore = q.difficulty === "xhard" && q.thoughtfulnessScore !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <BrandBar />
      <article className="mx-auto w-full max-w-2xl flex-1 px-6 pt-12 pb-16">
        <div className="mb-6 flex flex-wrap items-center gap-2">
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
          <Link
            href={`/${username}`}
            className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            · @{username}
          </Link>
          <span className="ml-auto text-xs text-[var(--color-text-muted)]">
            {new Date(q.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {q.imagePath && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <img src={q.imagePath} alt="Quiz image" className="w-full" />
          </div>
        )}

        <h1 className="font-display mb-8 text-3xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
          {q.question}
        </h1>

        <div className="mb-8">
          {showScore ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent-glow)] px-3 py-1 text-sm font-semibold text-[var(--color-accent)]">
              {q.thoughtfulnessScore}/5 thoughtfulness
            </span>
          ) : q.result ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-semibold ${resultStyles[q.result] || ""}`}
            >
              {resultLabels[q.result] || q.result}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/15 px-3 py-1 text-sm font-semibold text-zinc-400">
              Pending
            </span>
          )}
        </div>

        {q.userAnswer && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              Answer given
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text)]">
              {q.userAnswer}
            </p>
          </section>
        )}

        {q.answerKey && (
          <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-5">
            <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
              {q.difficulty === "xhard" ? "Reference framing" : "Answer"}
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text-dim)]">
              {q.answerKey}
            </p>
          </section>
        )}

        {q.grade && (
          <section className="mb-8 border-l-2 border-[var(--color-accent-dim)] pl-5">
            <h2 className="mb-2 text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              Ash's grade
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text-dim)] italic">
              {q.grade}
            </p>
          </section>
        )}
      </article>

      <SiteFooter />
    </div>
  );
}
