import type { UpcomingChange } from "@/lib/phase-transitions";

const awayLabel = (days: number) =>
  days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;

export function WhatsChanging({ changes }: { changes: UpcomingChange[] }) {
  if (changes.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        What&rsquo;s changing
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {changes.map((c, i) => (
          <li
            key={`${c.treatmentId}-${c.kind}-${i}`}
            className="flex justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2"
          >
            <span className="text-ink">{c.label}</span>
            <span className="shrink-0 text-ink-muted">
              {awayLabel(c.daysAway)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
