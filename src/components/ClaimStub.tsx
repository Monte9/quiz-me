"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ClaimStubInner({
  displayName,
  inviteCode,
}: {
  displayName: string;
  inviteCode: string | null;
}) {
  const searchParams = useSearchParams();
  const providedCode = searchParams.get("invite");
  const validInvite =
    inviteCode !== null && providedCode === inviteCode;

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[0.7rem] font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]" />
        Unclaimed
      </div>

      <h2 className="font-display mb-4 text-5xl leading-[0.95] font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
        {displayName}
      </h2>

      <p className="mx-auto mb-10 max-w-md text-base text-[var(--color-text-dim)]">
        This page hasn't been claimed yet.
      </p>

      {validInvite ? (
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)] p-6 shadow-[0_0_40px_var(--color-accent-glow)]">
          <p className="mb-2 text-base font-semibold text-[var(--color-accent-bright)]">
            Welcome, {displayName}.
          </p>
          <p className="text-sm text-[var(--color-text-dim)]">
            Your invite code is valid. The claim flow ships next — you'll set a
            password here and start getting quizzed.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left">
          <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">
            Need an invite from Monte.
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Once you have it, visit this page with{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
              ?invite=YOUR-CODE
            </code>
            .
          </p>
        </div>
      )}
    </main>
  );
}

export function ClaimStub(props: {
  displayName: string;
  inviteCode: string | null;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2 className="font-display text-5xl font-semibold text-[var(--color-text)] sm:text-6xl">
            {props.displayName}
          </h2>
        </main>
      }
    >
      <ClaimStubInner {...props} />
    </Suspense>
  );
}
