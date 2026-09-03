"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DateJump({ date }: { date: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <input
      type="date"
      value={date}
      aria-label="Jump to date"
      onChange={(e) => {
        if (!e.target.value) return;
        const next = new URLSearchParams(params.toString());
        next.set("date", e.target.value);
        router.push(`/calendar?${next.toString()}`);
      }}
      className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    />
  );
}
