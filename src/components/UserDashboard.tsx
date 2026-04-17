import { User, computeStats, sortQuestionsByDate } from "@/lib/users";
import { InterestChips } from "./InterestChips";
import { StatBar } from "./StatBar";
import { QuestionCard } from "./QuestionCard";

export function UserDashboard({ user }: { user: User }) {
  const stats = computeStats(user);
  const questions = sortQuestionsByDate(user.questions);

  return (
    <>
      <header className="bg-[var(--color-bg)]">
        <div className="mx-auto max-w-6xl space-y-5 px-6 pt-4 pb-10 text-center">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
              {user.displayName}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Daily quizzes from Ash. Easy, medium, hard, xhard.
            </p>
          </div>

          <StatBar stats={stats} />

          <div className="mx-auto max-w-3xl">
            <InterestChips interests={user.interests} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-12">
        {questions.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-[var(--color-text-muted)]">
              No questions yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                username={user.username}
                q={q}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
