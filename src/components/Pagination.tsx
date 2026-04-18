import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  newerLabel = "← Newer",
  olderLabel = "Older →",
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  newerLabel?: string;
  olderLabel?: string;
}) {
  if (totalPages <= 1) return null;

  const prevHref = currentPage > 1 ? buildHref(currentPage - 1) : null;
  const nextHref = currentPage < totalPages ? buildHref(currentPage + 1) : null;

  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.15em] uppercase transition-colors";
  const pillActive =
    "border-[var(--color-border)] bg-[var(--color-bg-raised)] text-[var(--color-text-dim)] hover:border-[var(--color-accent-dim)] hover:text-[var(--color-accent)]";
  const pillDisabled =
    "cursor-not-allowed border-[var(--color-border)]/50 bg-[var(--color-surface)]/40 text-[var(--color-text-muted)]/50";

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm">
      {prevHref ? (
        <Link href={prevHref} className={`${pillBase} ${pillActive}`}>
          {newerLabel}
        </Link>
      ) : (
        <span className={`${pillBase} ${pillDisabled}`}>{newerLabel}</span>
      )}
      <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
        Page {currentPage} of {totalPages}
      </span>
      {nextHref ? (
        <Link href={nextHref} className={`${pillBase} ${pillActive}`}>
          {olderLabel}
        </Link>
      ) : (
        <span className={`${pillBase} ${pillDisabled}`}>{olderLabel}</span>
      )}
    </nav>
  );
}
