import Link from "next/link";
import { User, computeStats } from "@/lib/users";

export function UserCard({ user }: { user: User }) {
  const stats = computeStats(user);
  const claimed = user.claimedAt !== null;
  const href = `/${user.username}`;
  const initial = user.displayName.slice(0, 1).toUpperCase();
  const lastAsk = user.questions[user.questions.length - 1]?.createdAt;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-dim)] hover:shadow-[0_12px_40px_var(--color-accent-glow)]"
    >
      <div className="mb-5 flex items-center gap-4">
        <div
          className={`font-display flex h-12 w-12 items-center justify-center rounded-full text-2xl font-semibold ${
            claimed
              ? "border border-[var(--color-accent-dim)]/40 bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          }`}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-[var(--color-text)]">
            {user.displayName}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.15em] uppercase">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                claimed ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-muted)]"
              }`}
            />
            <span
              className={
                claimed
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }
            >
              {claimed ? "Claimed" : "Unclaimed"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-4">
        <div>
          <div className="font-display text-2xl leading-none font-semibold text-[var(--color-text)]">
            {stats.total}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">
            Questions
          </div>
        </div>
        <div>
          <div className="font-display text-2xl leading-none font-semibold text-[var(--color-text)]">
            {stats.streak > 0 ? `${stats.streak}d` : "—"}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">
            Streak
          </div>
        </div>
        <div>
          <div className="font-display text-2xl leading-none font-semibold text-[var(--color-text)]">
            {user.interests.length}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">
            Topics
          </div>
        </div>
      </div>

      {lastAsk && (
        <div className="mt-4 text-xs text-[var(--color-text-muted)]">
          Last asked{" "}
          {new Date(lastAsk).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1 pt-5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]">
        View page →
      </div>
    </Link>
  );
}

export function JoinCard() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]/40 p-6">
      <div className="mb-5 flex items-center gap-4">
        <div className="font-display flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[var(--color-border-strong)] text-2xl font-semibold text-[var(--color-text-muted)]">
          +
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-[var(--color-text)]">
            Join Quiz Me
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]" />
            <span>Invite only</span>
          </div>
        </div>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
        Get your own public quiz page. Pick your topics, pick your difficulty,
        answer an AI-generated question daily, or whenever you want.
      </p>

      <div className="mt-auto pt-2">
        <a
          href="mailto:manthan.thakkar@gmail.com?subject=Quiz%20Me%20invite"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-bright)]"
        >
          Ask Monte for an invite →
        </a>
      </div>
    </div>
  );
}
