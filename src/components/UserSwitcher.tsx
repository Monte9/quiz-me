import Link from "next/link";
import { User } from "@/lib/users";

export function UserSwitcher({
  users,
  activeUsername,
}: {
  users: User[];
  activeUsername: string;
}) {
  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-1.5 px-6 pt-6">
      {users.map((u) => {
        const isActive = u.username === activeUsername;
        const href = u.username === "monte" ? "/" : `/${u.username}`;
        const count = u.questions.length;
        const claimed = u.claimedAt !== null || u.username === "monte";
        return (
          <Link
            key={u.username}
            href={href}
            className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)] text-[var(--color-accent)] shadow-[0_0_24px_var(--color-accent-glow)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-dim)]"
            }`}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
            )}
            <span>{u.displayName}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase ${
                isActive
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent-bright)]"
                  : "bg-black/30 text-[var(--color-text-muted)]"
              }`}
            >
              {claimed ? count : "new"}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
