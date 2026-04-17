export function Hero({
  users,
  totalQuestions,
  totalTopics,
}: {
  users: number;
  totalQuestions: number;
  totalTopics: number;
}) {
  const stats = [
    { value: users, label: "Users" },
    { value: totalQuestions, label: "Questions" },
    { value: totalTopics, label: "Topics" },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center sm:pt-24">
      <h1 className="font-display mx-auto mb-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl md:text-7xl">
        Daily quizzes.
        <br />
        <span className="text-[var(--color-accent)]">Graded in public.</span>
      </h1>

      <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-[var(--color-text-dim)] sm:text-lg">
        Ash asks one question a day. Easy to xHard, text or image. Every answer,
        every grade, logged right here.
      </p>

      <div className="mx-auto grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)]">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[var(--color-bg-raised)] px-4 py-6"
          >
            <div className="font-display text-4xl leading-none font-semibold tracking-tight text-[var(--color-accent)] sm:text-5xl">
              {s.value}
            </div>
            <div className="mt-2 text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
