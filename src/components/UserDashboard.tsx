import Link from "next/link";
import { User, computeStats, sortQuestionsByDate } from "@/lib/users";
import { QuestionList } from "./QuestionList";
import { AskMePanel } from "./AskMePanel";

export function UserDashboard({
  user,
  rank,
  rankTotal,
}: {
  user: User;
  rank?: number;
  rankTotal?: number;
}) {
  const stats = computeStats(user);
  const allQuestions = sortQuestionsByDate(user.questions);
  const recent = allQuestions.slice(0, 3);
  const hasStats = allQuestions.length > 0;

  return (
    <>
      <header className="mx-auto max-w-2xl px-6 pt-10 pb-12 text-center sm:pt-16 sm:pb-14">
        {rank !== undefined && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-dim)]/40 bg-[var(--color-accent-glow)] px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
            <span>Rank #{rank}</span>
            {rankTotal !== undefined && rankTotal > 1 && (
              <span className="text-[var(--color-text-muted)]">
                of {rankTotal}
              </span>
            )}
          </div>
        )}

        <h1 className="font-display mb-5 text-5xl leading-[0.95] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
          {user.displayName}
        </h1>

        {hasStats && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
            <span>
              <span className="font-semibold text-[var(--color-text)]">
                {stats.total}
              </span>{" "}
              {stats.total === 1 ? "question" : "questions"}
            </span>
            {stats.correctRate !== null && (
              <span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {stats.correctRate}%
                </span>{" "}
                correct
              </span>
            )}
            {stats.xhardAvg !== null && (
              <span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {stats.xhardAvg.toFixed(1)}
                </span>{" "}
                xhard avg
              </span>
            )}
          </div>
        )}
      </header>

      {user.username === "monte" && (
        <AskMePanel
          username={user.username}
          interests={user.interests}
          questions={user.questions}
        />
      )}

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        {allQuestions.length > 0 && (
          <div className="mb-6 flex items-baseline justify-between">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              Recent
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {allQuestions.length} total
            </span>
          </div>
        )}

        <QuestionList
          items={recent}
          emptyMessage="No questions yet. Ash will ask soon."
        />

        {allQuestions.length > 3 && (
          <div className="mt-8 flex justify-center">
            <Link
              href={`/questions?user=${user.username}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-dim)] transition-all hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
            >
              Show all →
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
