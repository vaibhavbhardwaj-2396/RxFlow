import { Clock3 } from "lucide-react";

import type { TimeOverlap } from "@/server/occurrences/queries";

/**
 * A neutral heads-up that several doses fall on the same minute today. RxFlow
 * flags the overlap only — it never assesses whether taking them together is OK.
 */
export function ConflictNotice({ overlaps }: { overlaps: TimeOverlap[] }) {
  if (overlaps.length === 0) return null;

  return (
    <section
      aria-label="Schedule overlaps today"
      className="flex flex-col gap-2 rounded-2xl border border-warn/40 bg-warn/10 p-4"
    >
      {overlaps.map((o) => (
        <div key={o.localTime} className="flex items-start gap-2 text-sm">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p className="text-ink">
            <span className="font-medium">
              {o.treatments.length} doses at {o.localTime}
            </span>{" "}
            — {formatList(o.treatments)}.
          </p>
        </div>
      ))}
      <p className="pl-6 text-xs text-ink-muted">
        RxFlow only points out the overlap; it doesn&rsquo;t judge whether
        taking them together is fine. Check with your prescriber or pharmacist.
      </p>
    </section>
  );
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
