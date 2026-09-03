import { DateTime } from "luxon";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { groupColorClasses } from "@/lib/group-color";
import type { GroupVM, TreatmentsView } from "@/server/treatments/groups";

import { TreatmentCard } from "./treatment-card";

export function TreatmentGroups({ view }: { view: TreatmentsView }) {
  const { groups, ungrouped, archived } = view;
  const hasGroups = groups.length > 0 || archived.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => (
        <GroupSection key={g.id} group={g} />
      ))}

      {ungrouped.length > 0 && (
        <section className="flex flex-col gap-3">
          {hasGroups && (
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Not in a group
            </h2>
          )}
          {ungrouped.map((t) => (
            <TreatmentCard key={t.id} t={t} />
          ))}
        </section>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint hover:text-ink-muted">
            Archived ({archived.length}) ▾
          </summary>
          <div className="mt-4 flex flex-col gap-8">
            {archived.map((g) => (
              <GroupSection key={g.id} group={g} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function GroupSection({ group: g }: { group: GroupVM }) {
  const c = groupColorClasses(g.color);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn("size-2.5 shrink-0 rounded-full", c.dot)}
          aria-hidden
        />
        <h2 className="font-display text-lg font-semibold text-ink">
          {g.title}
        </h2>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide",
            c.badge,
          )}
        >
          {g.kind}
        </span>
        {g.kind === "course" && g.endsOn && (
          <span className="text-xs text-ink-muted">
            · ends ~
            {DateTime.fromISO(g.endsOn, { zone: "utc" }).toFormat("d LLL")}
          </span>
        )}
        <span className="ml-auto text-xs text-ink-faint">
          {g.treatmentCount}
        </span>
        <Link
          href={`/treatments/groups/${g.id}/edit`}
          prefetch
          aria-label={`Edit ${g.title}`}
          className="rounded-md p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <Pencil className="size-3.5" aria-hidden />
        </Link>
      </div>
      {g.treatments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          No treatments in this group yet.
        </p>
      ) : (
        g.treatments.map((t) => <TreatmentCard key={t.id} t={t} />)
      )}
    </section>
  );
}
