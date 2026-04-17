export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
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
    </footer>
  );
}
