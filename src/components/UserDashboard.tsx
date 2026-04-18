import { Fragment } from "react";
import { User, computeStats, sortQuestionsByDate } from "@/lib/users";
import { QuestionList } from "./QuestionList";
import { AskMePanel } from "./AskMePanel";
import { Pagination } from "./Pagination";

const PAGE_SIZE = 12;

export function UserDashboard({
  user,
  page = 1,
}: {
  user: User;
  page?: number;
}) {
  const stats = computeStats(user);
  const allQuestions = sortQuestionsByDate(user.questions);
  const totalPages = Math.max(1, Math.ceil(allQuestions.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const questions = allQuestions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasStats = allQuestions.length > 0;

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

        {hasStats && (
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
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
        )}

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

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        {allQuestions.length > 0 && (
          <div className="mb-6 flex items-baseline justify-between">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              All questions
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {allQuestions.length} total
            </span>
          </div>
        )}

        <QuestionList
          items={questions}
          emptyMessage="No questions yet. Ash will ask soon."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={(p) =>
            p === 1 ? `/${user.username}` : `/${user.username}?page=${p}`
          }
        />
      </main>
    </>
  );
}
