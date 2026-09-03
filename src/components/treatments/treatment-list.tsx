import { DateTime } from "luxon";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { TreatmentListItem } from "@/server/treatments/queries";

const CATEGORY_LABEL: Record<string, string> = {
  medication: "Medication",
  supplement: "Supplement",
  topical: "Topical",
  therapy: "Therapy",
  other: "Other",
};

export function TreatmentList({
  treatments,
}: {
  treatments: TreatmentListItem[];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {treatments.map((t) => (
        <li key={t.id}>
          <Link
            href={`/treatments/${t.id}`}
            className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {t.name}
                </h2>
                <p className="text-xs uppercase tracking-wide text-ink-faint">
                  {CATEGORY_LABEL[t.category] ?? t.category}
                </p>
              </div>
              <StatusPill status={t.status} />
            </div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-ink-faint">Schedule</dt>
              <dd className="text-ink">{t.recurrenceSummary}</dd>
              <dt className="text-ink-faint">Active</dt>
              <dd className="text-ink">{t.windowSummary}</dd>
              <dt className="text-ink-faint">Times</dt>
              <dd className="text-ink">{t.doseSummary}</dd>
            </dl>

            <p className="mt-3 text-xs text-ink-muted">
              {t.occurrenceCount} scheduled dose
              {t.occurrenceCount === 1 ? "" : "s"}
              {t.nextOccurrenceDate
                ? ` · next ${DateTime.fromISO(t.nextOccurrenceDate, {
                    zone: "utc",
                  }).toFormat("ccc d LLL")}`
                : ""}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
        status === "active"
          ? "bg-accent-soft text-accent"
          : "bg-surface-sunken text-ink-muted",
      )}
    >
      {status}
    </span>
  );
}
