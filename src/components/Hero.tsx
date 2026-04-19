"use client";

import { useEffect, useState } from "react";

type Tagline = { lead: string; accent: string };

const TAGLINES: Tagline[] = [
  { lead: "Trivia that knows", accent: "what you love." },
  { lead: "Master the topics", accent: "that matter to you." },
];

const ROTATE_MS = 5000;
const FADE_MS = 500;

export function Hero() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      // Fade out, swap, fade back in on the next frame.
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
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center sm:pt-24 sm:pb-12">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
        For trivia nerds
      </div>

      <h1 className="font-display mx-auto mb-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl md:text-7xl">
        <span
          className="block transition-opacity ease-in-out"
          style={{
            opacity: visible ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
          }}
          aria-live="polite"
        >
          {current.lead}
          <br />
          <span className="text-[var(--color-accent)]">{current.accent}</span>
        </span>
      </h1>

      <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--color-text-dim)] sm:text-lg">
        Personalized to your topics. Questions that challenge you. Charts that
        track your progress.
      </p>
    </section>
  );
}
