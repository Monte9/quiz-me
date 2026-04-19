type Pillar = {
  num: string;
  headline: string;
  body: string;
};

const PILLARS: Pillar[] = [
  {
    num: "01",
    headline: "Topics you actually love.",
    body: "You pick what Ash quizzes you on. Porsche, Ramayana, jazz, pickleball. Your call, every time.",
  },
  {
    num: "02",
    headline: "Questions that challenge you.",
    body: "Four difficulty tiers, from yes/no to open-ended. No repeats. Ash tells you when you're wrong.",
  },
  {
    num: "03",
    headline: "Charts that grow with you.",
    body: "Every answer logged. Daily activity, correct rate, topic breakdown. Watch yourself get sharper.",
  },
];

export function PillarCards() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
      <div className="mb-12 text-center">
        <div className="mb-3 text-xs font-semibold tracking-[0.25em] text-[var(--color-text-muted)] uppercase">
          How it works
        </div>
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Trivia, tuned to you.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div
            key={p.num}
            className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-7 transition-all hover:border-[var(--color-accent-dim)] hover:shadow-[0_0_40px_var(--color-accent-glow)]"
          >
            <div className="font-display mb-5 text-xs font-semibold tracking-[0.25em] text-[var(--color-accent)] uppercase">
              {p.num}
            </div>
            <h3 className="font-display mb-3 text-xl leading-snug font-semibold text-[var(--color-text)] sm:text-2xl">
              {p.headline}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-dim)]">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
