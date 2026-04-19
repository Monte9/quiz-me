import Link from "next/link";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/monte", label: "Play" },
  { href: "/users", label: "Users" },
  { href: "/questions", label: "Questions" },
];

export function BrandBar() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 sm:pt-8">
      <Link
        href="/"
        className="group inline-block text-[0.7rem] font-semibold tracking-[0.35em] uppercase"
      >
        <span className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-dim)]">
          Quiz
        </span>
        <span className="ml-1.5 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-accent-bright)]">
          Me
        </span>
      </Link>

      <nav className="flex items-center gap-5 text-[0.65rem] font-semibold tracking-[0.25em] uppercase sm:gap-7 sm:text-xs">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
