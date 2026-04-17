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
    <nav className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6">
      {users.map((u) => {
        const isActive = u.username === activeUsername;
        const href = u.username === "monte" ? "/" : `/${u.username}`;
        const count = u.questions.length;
        const claimed = u.claimedAt !== null || u.username === "monte";
        return (
          <Link
            key={u.username}
            href={href}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            {u.displayName}
            {claimed ? (
              <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-xs opacity-70">
                {count}
              </span>
            ) : (
              <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-xs opacity-70">
                unclaimed
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
