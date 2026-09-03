import { Pencil } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type {
  OccurrenceLine,
  TreatmentDetail as Detail,
} from "@/server/treatments/queries";

import { ConfirmScheduleForm } from "./confirm-schedule-form";
import { PhaseProgressBar } from "./phase-progress-bar";
import { TreatmentRemindersToggle } from "./treatment-reminders-toggle";

const CATEGORY_LABEL: Record<string, string> = {
  medication: "Medication",
  supplement: "Supplement",
  topical: "Topical",
  therapy: "Therapy",
  other: "Other",
};

const EVENT_LABEL: Record<string, string> = {
  completed: "marked done",
  skipped: "skipped",
  missed: "missed",
  reopened: "reopened",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "scheduled",
  reminder_sent: "reminder sent",
  completed: "done",
  skipped: "skipped",
  missed: "missed",
};

const fmtDay = (d: string) =>
  DateTime.fromISO(d, { zone: "utc" }).toFormat("ccc d LLL");

export function TreatmentDetail({ detail }: { detail: Detail }) {
  const a = detail.adherence;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint">
            {CATEGORY_LABEL[detail.category] ?? detail.category}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {detail.name}
          </h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href={`/treatments/${detail.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </Link>
          <TreatmentRemindersToggle
            treatmentId={detail.id}
            enabled={detail.remindersEnabled}
          />
        </div>
      </div>

      {detail.needsConfirmation && detail.weeklyCount !== null && (
        <ConfirmScheduleForm
          treatmentId={detail.id}
          count={detail.weeklyCount}
        />
      )}

      {(detail.instructionsText || detail.doseText) && (
        <div className="rounded-2xl border border-line bg-surface-sunken p-4 text-sm">
          {detail.doseText && (
            <p>
              <span className="text-ink-faint">Dose: </span>
              {detail.doseText}
            </p>
          )}
          {detail.instructionsText && (
            <p className="mt-1 whitespace-pre-wrap">
              <span className="text-ink-faint">Instructions: </span>
              {detail.instructionsText}
            </p>
          )}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        {!detail.needsConfirmation && (
          <PhaseProgressBar progress={detail.progress} />
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-faint">Schedule</dt>
          <dd className="text-ink">{detail.recurrenceSummary}</dd>
          <dt className="text-ink-faint">Active</dt>
          <dd className="text-ink">{detail.windowSummary}</dd>
          <dt className="text-ink-faint">Times</dt>
          <dd className="text-ink">{detail.doseSummary}</dd>
        </dl>
        {detail.nextChange && (
          <p className="text-xs text-warn">Next: {detail.nextChange.label}</p>
        )}
        <p className="text-xs text-ink-faint">
          Started{" "}
          {DateTime.fromISO(detail.startedOn, { zone: "utc" }).toFormat(
            "d LLL yyyy",
          )}{" "}
          · schedule v{detail.scheduleVersion}
        </p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Adherence
        </h2>
        <p className="text-sm text-ink">
          {a.completed} done · {a.skipped} skipped · {a.missed} missed ·{" "}
          {a.pending} upcoming
        </p>
      </section>

      {(detail.recent.length > 0 || detail.upcoming.length > 0) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Timeline
          </h2>
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line text-sm">
            {[...detail.recent].reverse().map((o) => (
              <TimelineRow key={o.id} occurrence={o} past />
            ))}
            {detail.upcoming.map((o) => (
              <TimelineRow key={o.id} occurrence={o} />
            ))}
          </ul>
        </section>
      )}

      {detail.history.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            History
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-ink-muted">
            {detail.history.map((h, i) => (
              <li key={`${h.localDate}-${h.localTime}-${i}`}>
                {fmtDay(h.localDate)} {h.localTime} —{" "}
                {EVENT_LABEL[h.type] ?? h.type}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TimelineRow({
  occurrence,
  past,
}: {
  occurrence: OccurrenceLine;
  past?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2",
        past && "opacity-70",
      )}
    >
      <span className="text-ink">
        {fmtDay(occurrence.localDate)} · {occurrence.localTime}
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
          occurrence.status === "completed"
            ? "bg-accent-soft text-accent"
            : occurrence.status === "missed"
              ? "bg-danger/10 text-danger"
              : "bg-surface-sunken text-ink-muted",
        )}
      >
        {STATUS_LABEL[occurrence.status] ?? occurrence.status}
      </span>
    </li>
  );
}
