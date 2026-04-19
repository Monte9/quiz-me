"use client";

import { useEffect, useState } from "react";

type Tagline = { eyebrow: string; lead: string; accent: string };

const TAGLINES: Tagline[] = [
  {
    eyebrow: "For trivia nerds",
    lead: "Trivia that knows",
    accent: "what you love.",
  },
  {
    eyebrow: "For curious minds",
    lead: "Master the topics",
    accent: "that matter to you.",
  },
];

const ROTATE_MS = 5000;
const FADE_MS = 500;

export function Hero() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % TAGLINES.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(tick);
  }, []);

  const current = TAGLINES[idx];

  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center sm:pt-20 sm:pb-16">
      <div
        className="transition-opacity ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transitionDuration: `${FADE_MS}ms`,
        }}
        aria-live="polite"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
          {current.eyebrow}
        </div>

        <h1 className="font-display mx-auto mb-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl md:text-7xl">
          {current.lead}
          <br />
          <span className="text-[var(--color-accent)]">{current.accent}</span>
        </h1>
      </div>

      <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[var(--color-text-dim)] sm:text-lg">
        Personalized to your topics. Questions that challenge you. Charts that
        track your progress.
      </p>

      <a
        href="/monte"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent-bright)] hover:shadow-[0_0_30px_var(--color-accent-glow)]"
      >
        Try it now →
      </a>
    </section>
  );
}
