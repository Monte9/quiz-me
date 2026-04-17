import { User, computeStats, sortQuestionsByDate } from "@/lib/users";
import { InterestChips } from "./InterestChips";
import { StatBar } from "./StatBar";
import { QuestionCard } from "./QuestionCard";

export function UserDashboard({
  user,
  variant = "full",
}: {
  user: User;
  variant?: "full" | "compact";
}) {
  const stats = computeStats(user);
  const questions = sortQuestionsByDate(user.questions);
  const isCompact = variant === "compact";

  return (
    <>
      <header className="relative">
        <div
          className={`mx-auto max-w-5xl px-6 text-center ${
            isCompact ? "pt-4 pb-10" : "pt-10 pb-16 sm:pt-16 sm:pb-20"
          }`}
        >
          {isCompact ? (
            <>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-dim)]/40 bg-[var(--color-accent-glow)] px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                Live log
              </div>
              <h2 className="font-display mb-8 text-4xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl">
                {user.displayName}'s quizzes
              </h2>
            </>
          ) : (
            <>
              <h1 className="font-display mb-5 text-6xl leading-[0.95] font-semibold tracking-tight text-[var(--color-text)] sm:text-7xl md:text-8xl">
                {user.displayName}
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-base text-[var(--color-text-dim)] sm:text-lg">
                Daily quizzes from Ash. Easy to xHard, text and image.
                <br className="hidden sm:block" />
                Graded honestly. Nothing hidden.
              </p>
            </>
          )}

          <StatBar stats={stats} />

          {user.interests.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl px-4">
              <InterestChips interests={user.interests} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
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
    </>
  );
}
