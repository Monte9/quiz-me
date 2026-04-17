import { Interest } from "@/lib/users";

export function InterestChips({ interests }: { interests: Interest[] }) {
  if (interests.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No interests yet.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {interests.map((i) => (
        <span
          key={i.name}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-muted)]"
        >
          <span className="h-1 w-1 rounded-full bg-[var(--color-accent-dim)]" />
          {i.name}
        </span>
      ))}
    </div>
  );
}
