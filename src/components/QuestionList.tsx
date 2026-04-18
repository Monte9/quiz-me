import { Question } from "@/lib/users";
import { QuestionCard } from "./QuestionCard";

export type QuestionListItem = {
  username: string;
  question: Question;
};

export function QuestionList({
  items,
  emptyMessage = "No questions yet.",
}: {
  items: QuestionListItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 py-16 text-center">
        <p className="text-lg text-[var(--color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ username, question }) => (
        <QuestionCard
          key={question.id}
          username={username}
          q={question}
        />
      ))}
    </div>
  );
}
