import { Fragment } from "react";
import { User, computeStats, sortQuestionsByDate } from "@/lib/users";
import { QuestionCard } from "./QuestionCard";
import { AskMePanel } from "./AskMePanel";

export function UserDashboard({ user }: { user: User }) {
  const stats = computeStats(user);
  const questions = sortQuestionsByDate(user.questions);

  return (
    <>
      <header className="mx-auto max-w-2xl px-6 pt-10 pb-12 text-center sm:pt-16 sm:pb-14">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-dim)]/40 bg-[var(--color-accent-glow)] px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
          Live log
        </div>

        <h1 className="font-display mb-5 text-5xl leading-[0.95] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
          {user.displayName}
        </h1>

        {user.interests.length > 0 && (
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {user.interests.map((i, idx) => (
              <Fragment key={i.name}>
                {idx > 0 && (
                  <span className="mx-2 text-[var(--color-text-muted)]/50">
                    ·
                  </span>
                )}
                <span>{i.name}</span>
              </Fragment>
            ))}
          </p>
        )}
      </header>

      {user.username === "monte" && (
        <AskMePanel username={user.username} interests={user.interests} />
      )}

      <main className="mx-auto w-full max-w-6xl px-6 pb-10">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 py-16 text-center">
            <p className="text-lg text-[var(--color-text-muted)]">
              No questions yet. Ash will ask soon.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                All questions
              </h3>
              <span className="text-xs text-[var(--color-text-muted)]">
                {questions.length} total
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {questions.map((q) => (
                <QuestionCard key={q.id} username={user.username} q={q} />
              ))}
            </div>
          </>
        )}
      </main>

      {questions.length > 0 && (
        <div className="mx-auto w-full max-w-3xl px-6 pb-16">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--color-text-muted)]">
            <span>
              <span className="font-semibold text-[var(--color-text)]">
                {stats.total}
              </span>{" "}
              quizzes
            </span>
            {stats.streak > 0 && (
              <span>
                <span className="font-semibold text-[var(--color-text)]">
                  {stats.streak}d
                </span>{" "}
                streak
              </span>
            )}
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
            {stats.topTopic && stats.xhardAvg === null && (
              <span>
                top:{" "}
                <span className="font-semibold text-[var(--color-text)]">
                  {stats.topTopic}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
