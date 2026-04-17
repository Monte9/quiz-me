const steps = [
  {
    n: 1,
    title: "Ash picks",
    body: "Each day Ash picks a topic from your interests and a difficulty — easy, medium, hard, or xhard.",
  },
  {
    n: 2,
    title: "You answer",
    body: "Type a response, or skip. Easy is yes/no. xHard asks you to propose a solution to an unsolved problem.",
  },
  {
    n: 3,
    title: "Graded live",
    body: "Ash grades honestly — correct, partial, wrong, or scored. The result, answer key, and feedback log here.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <h2 className="mb-10 text-center text-xs font-semibold tracking-[0.3em] text-[var(--color-text-muted)] uppercase">
        How it works
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-6"
          >
            <div className="font-display mb-4 text-5xl leading-none font-semibold text-[var(--color-accent)]">
              {s.n}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">
              {s.title}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
