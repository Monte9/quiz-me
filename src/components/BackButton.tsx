"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BackButton({
  fallbackHref,
  children,
  className = "",
}: {
  fallbackHref: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function onClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
