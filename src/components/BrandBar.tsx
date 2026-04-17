import Link from "next/link";

export function BrandBar() {
  return (
    <div className="pt-8">
      <Link
        href="/"
        className="group mx-auto block w-fit text-center text-[0.7rem] font-semibold tracking-[0.35em] uppercase"
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
