import { AdherenceSummaryBar } from "@/components/dashboard/adherence-summary";
import { OccurrenceRow } from "@/components/dashboard/occurrence-row";
import type { DayBoard } from "@/server/occurrences/queries";

export function DayView({ board }: { board: DayBoard }) {
  if (board.sections.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
        Nothing scheduled.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdherenceSummaryBar summary={board.adherence} />
      {board.sections.map((section) => (
        <section key={section.part} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {section.label}
          </h2>
          <ul className="flex flex-col gap-2">
            {section.items.map((item) => (
              <OccurrenceRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
