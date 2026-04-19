import Link from "next/link";

export function RecapCTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
      <div className="grid gap-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-8 sm:p-12 md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-center">
          <h2 className="font-display mb-3 text-3xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mb-6 max-w-md text-base text-[var(--color-text-dim)]">
            Jump in. Ash is ready with a question on whatever topic you pick.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#ask"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_30px_var(--color-accent-glow)]"
            >
              Try it now →
            </a>
            <a
              href="mailto:manthan.thakkar@gmail.com?subject=Quiz%20Me%20invite"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text-dim)] transition-all hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
            >
              Ask for an invite
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <Link
            href="/questions"
            className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-5 transition-all hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-surface)]"
          >
            <div className="mb-2 text-sm font-semibold text-[var(--color-text)]">
              See recent questions
            </div>
            <div className="mb-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              Real output from Ash, across every topic and tier.
            </div>
            <div className="mt-auto text-xs font-semibold text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-accent-bright)]">
              Browse questions →
            </div>
          </Link>
          <Link
            href="/users"
            className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-5 transition-all hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-surface)]"
          >
            <div className="mb-2 text-sm font-semibold text-[var(--color-text)]">
              Browse users
            </div>
            <div className="mb-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              See who's playing and their public quiz log.
            </div>
            <div className="mt-auto text-xs font-semibold text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-accent-bright)]">
              See users →
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
