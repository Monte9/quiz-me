import { Interest } from "@/lib/users";
import { Fragment } from "react";

export function InterestChips({ interests }: { interests: Interest[] }) {
  if (interests.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No interests yet.
      </p>
    );
  }
  return (
    <div className="text-center">
      <span className="mr-3 text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
        Interests
      </span>
      <span className="text-sm leading-loose text-[var(--color-text-dim)]">
        {interests.map((i, idx) => (
          <Fragment key={i.name}>
            {idx > 0 && (
              <span className="mx-2 text-[var(--color-text-muted)]">·</span>
            )}
            <span className="hover:text-[var(--color-accent)]">{i.name}</span>
          </Fragment>
        ))}
      </span>
    </div>
  );
}
