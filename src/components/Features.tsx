const features = [
  {
    title: "Personalized",
    body: "Your topics. Your level. Ash writes every question around what you actually care about.",
  },
  {
    title: "Actually challenging",
    body: "Four tiers, from yes/no to proposing solutions to unsolved problems. Push yourself when you're ready.",
  },
  {
    title: "Track your growth",
    body: "Streak, correct rate, and a full history — see yourself improve over time.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-6 transition-colors hover:border-[var(--color-accent-dim)]"
          >
            <h3 className="font-display mb-3 text-2xl leading-tight font-semibold text-[var(--color-text)]">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-dim)]">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
