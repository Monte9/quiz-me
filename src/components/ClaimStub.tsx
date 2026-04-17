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
      <h2 className="mb-4 text-2xl font-bold text-[var(--color-text)]">
        {displayName}'s page isn't claimed yet.
      </h2>

      {validInvite ? (
        <div className="mt-6 rounded-2xl border border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)] p-6">
          <p className="mb-2 text-base font-medium text-[var(--color-accent)]">
            Welcome, {displayName}.
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your invite code is valid. The claim flow ships next — you'll be
            able to set a password here and start quizzing.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            Need an invite code from Monte. Once you have it, visit this page
            with <code className="rounded bg-black/30 px-1 py-0.5 text-xs">?invite=YOUR-CODE</code>.
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
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {props.displayName}'s page isn't claimed yet.
          </h2>
        </main>
      }
    >
      <ClaimStubInner {...props} />
    </Suspense>
  );
}
