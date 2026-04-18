export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-24 pb-14 text-center sm:pt-28">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
        For trivia nerds
      </div>

      <h1 className="font-display mx-auto mb-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl md:text-7xl">
        The quiz that
        <br />
        <span className="text-[var(--color-accent)]">keeps up with you.</span>
      </h1>

      <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--color-text-dim)] sm:text-lg">
        Personalized to your interests. Four tiers — easy to unsolved. Track
        every answer.
      </p>
    </section>
  );
}
