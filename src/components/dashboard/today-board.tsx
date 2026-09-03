import type { TodayBoard as TodayBoardData } from "@/server/occurrences/queries";

import { AdherenceSummaryBar } from "./adherence-summary";
import { ComingUp } from "./coming-up";
import { OccurrenceRow } from "./occurrence-row";

export function TodayBoard({ board }: { board: TodayBoardData }) {
  const hasToday = board.sections.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {hasToday ? (
        <AdherenceSummaryBar summary={board.adherence} />
      ) : (
        <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
          Nothing scheduled today.
        </p>
      )}

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

      <ComingUp days={board.comingUp} />
    </div>
  );
}
