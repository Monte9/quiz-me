import { UserStats } from "@/lib/users";

export function StatBar({ stats }: { stats: UserStats }) {
  const tiles: { label: string; value: string; tone?: "accent" | "good" }[] = [
    { label: "Total", value: String(stats.total) },
  ];

  if (stats.correctRate !== null) {
    tiles.push({
      label: "Correct",
      value: `${stats.correctRate}%`,
      tone: "good",
    });
  }

  tiles.push({ label: "Streak", value: `${stats.streak}d` });

  if (stats.topTopic) {
    tiles.push({ label: "Top topic", value: stats.topTopic });
  }

  if (stats.xhardAvg !== null) {
    tiles.push({
      label: "xHard",
      value: `${stats.xhardAvg.toFixed(1)}/5`,
      tone: "accent",
    });
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {tiles.map((t) => {
        const toneClass =
          t.tone === "good"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : t.tone === "accent"
              ? "border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]";
        return (
          <span
            key={t.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${toneClass}`}
          >
            <span className="opacity-60">{t.label}</span>
            <span>{t.value}</span>
          </span>
        );
      })}
    </div>
  );
}
