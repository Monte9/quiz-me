export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center sm:pt-20">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
        For trivia nerds
      </div>

      <h1 className="font-display mx-auto mb-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl md:text-7xl">
        Trivia at your level.
        <br />
        <span className="text-[var(--color-accent)]">Graded in public.</span>
      </h1>

      <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--color-text-dim)] sm:text-lg">
        An AI quizzes you on the topics you actually care about. Four difficulty
        tiers — from yes/no warm-ups to proposing solutions to unsolved
        problems. Graded honestly. Every answer lives on your public page.
      </p>
    </section>
  );
}
