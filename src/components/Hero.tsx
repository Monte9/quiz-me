import Link from "next/link";

export function Hero({
  users,
  totalQuestions,
  totalTopics,
}: {
  users: number;
  totalQuestions: number;
  totalTopics: number;
}) {
  const stats: { value: number; label: string; href?: string }[] = [
    { value: users, label: "Users", href: "/users" },
    { value: totalQuestions, label: "Questions" },
    { value: totalTopics, label: "Topics" },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center sm:pt-24">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
        For trivia nerds
      </div>

      <h1 className="font-display mx-auto mb-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl md:text-7xl">
        Trivia at your level.
        <br />
        <span className="text-[var(--color-accent)]">Graded in public.</span>
      </h1>

      <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-[var(--color-text-dim)] sm:text-lg">
        An AI quizzes you on the topics you actually care about. Four difficulty
        tiers — from yes/no warm-ups to proposing solutions to unsolved
        problems. Graded honestly. Every answer lives on your public page.
      </p>

      <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] shadow-[0_0_40px_var(--color-accent-glow)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_60px_var(--color-accent-glow)]"
        >
          Browse users →
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-dim)] transition-all hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
        >
          How it works ↓
        </a>
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)]">
        {stats.map((s) => {
          const content = (
            <>
              <div className="font-display text-4xl leading-none font-semibold tracking-tight text-[var(--color-accent)] sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                {s.label}
                {s.href && <span className="opacity-60">→</span>}
              </div>
            </>
          );
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="group bg-[var(--color-bg-raised)] px-4 py-6 transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              {content}
            </Link>
          ) : (
            <div
              key={s.label}
              className="bg-[var(--color-bg-raised)] px-4 py-6"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
