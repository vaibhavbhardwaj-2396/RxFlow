"use client";

import { Clock3, FastForward, Rewind } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { setSimNow } from "@/server/time/actions";

interface DevToolbarProps {
  /** The raw cookie value, or null when running on real time. */
  simNow: string | null;
  /** The effective local date ("YYYY-MM-DD") the layout resolved. */
  effectiveDate: string;
}

const DAY_MS = 86_400_000;

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return next.toISOString().slice(0, 10);
}

export function DevToolbar({ simNow, effectiveDate }: DevToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // A `?now=` param overrides the cookie for the page but not the layout, so
  // prefer it here to keep the toolbar in step with what's on screen.
  const paramNow = searchParams.get("now");
  const shownDate = (paramNow ?? effectiveDate).slice(0, 10);
  const simulating = simNow !== null || paramNow !== null;

  const apply = (value: string | null) => {
    startTransition(async () => {
      await setSimNow(value);
      // Drop any one-off `?now=` so the cookie is the single source of truth.
      if (paramNow !== null) router.replace(pathname);
      else router.refresh();
    });
  };

  return (
    <div
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
      role="group"
      aria-label="Development time travel"
    >
      <Clock3 className="size-4 text-ink-faint" aria-hidden />
      <span className="hidden text-ink-muted sm:inline">Time travel</span>

      <button
        type="button"
        onClick={() => apply(shiftDate(shownDate, -1))}
        disabled={pending}
        className="rounded-md p-1 hover:bg-surface-sunken"
        aria-label="Previous day"
      >
        <Rewind className="size-4" aria-hidden />
      </button>

      <input
        type="date"
        value={shownDate}
        disabled={pending}
        onChange={(e) => apply(e.target.value || null)}
        className="rounded-md border border-line bg-canvas px-2 py-1 text-ink"
        aria-label="Simulated date"
      />

      <button
        type="button"
        onClick={() => apply(shiftDate(shownDate, 1))}
        disabled={pending}
        className="rounded-md p-1 hover:bg-surface-sunken"
        aria-label="Next day"
      >
        <FastForward className="size-4" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => apply(shiftDate(shownDate, 7))}
        disabled={pending}
        className="rounded-md px-2 py-1 hover:bg-surface-sunken"
      >
        +1w
      </button>

      <button
        type="button"
        onClick={() => apply(null)}
        disabled={pending || !simulating}
        className="rounded-md px-2 py-1 font-medium text-accent hover:bg-accent-soft disabled:text-ink-faint"
      >
        {simulating ? "Live" : "Live ✓"}
      </button>
    </div>
  );
}
