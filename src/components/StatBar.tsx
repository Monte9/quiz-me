import { UserStats } from "@/lib/users";

export function StatBar({ stats }: { stats: UserStats }) {
  const tiles: { label: string; value: string; accent?: boolean }[] = [
    { label: "Total", value: String(stats.total) },
    { label: "Streak", value: stats.streak > 0 ? `${stats.streak}d` : "—" },
  ];

  if (stats.correctRate !== null) {
    tiles.push({
      label: "Correct",
      value: `${stats.correctRate}%`,
      accent: true,
    });
  }

  if (stats.xhardAvg !== null) {
    tiles.push({
      label: "xHard avg",
      value: `${stats.xhardAvg.toFixed(1)}`,
      accent: true,
    });
  } else if (stats.topTopic) {
    tiles.push({ label: "Top topic", value: stats.topTopic });
  }

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-[var(--color-bg-raised)] px-4 py-5 text-center"
        >
          <div
            className={`font-display text-3xl leading-none tracking-tight sm:text-4xl ${
              t.accent
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text)]"
            }`}
          >
            {t.value}
          </div>
          <div className="mt-2 text-[0.65rem] font-semibold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">
            {t.label}
          </div>
        </div>
      ))}
    </div>
  );
}
