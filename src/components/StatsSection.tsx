import Link from "next/link";

type Stat = {
  value: number;
  label: string;
  href: string | null;
};

export function StatsSection({
  users,
  questions,
  topics,
}: {
  users: number;
  questions: number;
  topics: number;
}) {
  const stats: Stat[] = [
    { value: users, label: "Users", href: "/users" },
    { value: questions, label: "Questions asked", href: "/questions" },
    { value: topics, label: "Topics covered", href: null },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((s) => {
          const inner = (
            <div className="group flex h-full flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-6 py-10 text-center transition-all hover:border-[var(--color-accent-dim)] hover:shadow-[0_0_40px_var(--color-accent-glow)]">
              <div className="font-display text-6xl leading-none font-semibold tracking-tight text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-accent-bright)] sm:text-7xl">
                {s.value}
              </div>
              <div className="mt-4 text-xs font-semibold tracking-[0.2em] text-[var(--color-text)] uppercase">
                {s.label}
              </div>
            </div>
          );
          if (s.href) {
            return (
              <Link key={s.label} href={s.href}>
                {inner}
              </Link>
            );
          }
          return <div key={s.label}>{inner}</div>;
        })}
      </div>
    </section>
  );
}
