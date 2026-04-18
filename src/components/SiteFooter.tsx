import Link from "next/link";

const navLinks: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/users", label: "Users" },
  { href: "/questions", label: "Questions" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
      <nav className="mb-4 flex items-center justify-center gap-5 text-xs font-semibold tracking-[0.2em] uppercase">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div>
        Built by the{" "}
        <a
          href="https://github.com/ashokosnexus"
          className="text-[var(--color-accent)] hover:text-[var(--color-accent-bright)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ash + Monte
        </a>{" "}
        dyad
      </div>
    </footer>
  );
}
