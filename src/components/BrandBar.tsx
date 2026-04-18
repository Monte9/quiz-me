import Link from "next/link";

export function BrandBar({ compact = false }: { compact?: boolean } = {}) {
  return (
    <div className={compact ? "pt-5" : "pt-8"}>
      <Link
        href="/"
        className={`group mx-auto block w-fit text-center font-semibold uppercase ${
          compact
            ? "text-[0.6rem] tracking-[0.3em]"
            : "text-[0.7rem] tracking-[0.35em]"
        }`}
      >
        <span className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-dim)]">
          Quiz
        </span>
        <span className="ml-1.5 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-accent-bright)]">
          Me
        </span>
      </Link>
    </div>
  );
}
