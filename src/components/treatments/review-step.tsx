"use client";

import { DateTime } from "luxon";
import { useMemo } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  type GeneratedOccurrence,
  generateOccurrences,
} from "@/domain/scheduling";
import { addDays, plainDate } from "@/domain/time";
import {
  describeDoseTimes,
  describeRecurrence,
  describeWindow,
} from "@/lib/schedule-summary";
import {
  INITIAL_HORIZON_DAYS,
  doseSpecsFromInput,
  phaseCycleFromInput,
  recurrenceRuleFromInput,
} from "@/lib/treatment-mapping";
import { createTreatmentSchema } from "@/lib/validation/treatment";

import type { WizardDraft } from "./wizard-draft";

interface ReviewStepProps {
  draft: WizardDraft;
  timezone: string;
  defaultTimes: Record<string, string>;
  submitting: boolean;
  error?: string;
  onConfirm: () => void;
  onEdit: (step: number) => void;
  submitLabel?: string;
  regenerateNote?: boolean;
}

export function ReviewStep({
  draft,
  timezone,
  defaultTimes,
  submitting,
  error,
  onConfirm,
  onEdit,
  submitLabel = "Confirm & create schedule",
  regenerateNote = false,
}: ReviewStepProps) {
  const preview = useMemo(
    () => build(draft, timezone, defaultTimes),
    [draft, timezone, defaultTimes],
  );

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <Row label="Name" value={draft.name || "—"} onEdit={() => onEdit(0)} />
        <Row label="Category" value={draft.category} onEdit={() => onEdit(0)} />
        {preview.kind === "ok" && (
          <>
            <Row
              label="Schedule"
              value={describeRecurrence(preview.rule)}
              onEdit={() => onEdit(1)}
            />
            <Row
              label="Active"
              value={describeWindow(preview.anchor, preview.cycle)}
              onEdit={() => onEdit(2)}
            />
            <Row
              label="Times"
              value={describeDoseTimes(preview.specs, defaultTimes)}
              onEdit={() => onEdit(3)}
            />
          </>
        )}
      </dl>

      {(draft.instructionsText.trim() || draft.doseText.trim()) && (
        <div className="rounded-lg border border-line bg-surface-sunken p-3 text-sm">
          {draft.doseText.trim() && (
            <p>
              <span className="text-ink-faint">Dose: </span>
              {draft.doseText.trim()}
            </p>
          )}
          {draft.instructionsText.trim() && (
            <p className="mt-1 whitespace-pre-wrap">
              <span className="text-ink-faint">Instructions: </span>
              {draft.instructionsText.trim()}
            </p>
          )}
        </div>
      )}

      {preview.kind === "incomplete" && (
        <p className="text-sm text-ink-muted">
          Finish the earlier steps to preview the schedule.
        </p>
      )}
      {preview.kind === "error" && (
        <p className="text-sm text-danger">{preview.message}</p>
      )}
      {preview.kind === "ok" && (
        <OccurrencePreview occurrences={preview.occurrences} />
      )}

      {regenerateNote && (
        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
          Saving keeps every past dose and anything already marked done or
          skipped. Only future scheduled doses are rebuilt from today.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting || preview.kind !== "ok"}
        className={buttonClass("primary", "lg")}
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <>
      <dt className="text-ink-faint">{label}</dt>
      <dd className="flex items-baseline justify-between gap-3">
        <span className="text-ink">{value}</span>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          Edit
        </button>
      </dd>
    </>
  );
}

function OccurrencePreview({
  occurrences,
}: {
  occurrences: GeneratedOccurrence[];
}) {
  const byDate = new Map<string, string[]>();
  for (const o of occurrences) {
    const list = byDate.get(o.localDate) ?? [];
    list.push(o.localTime);
    byDate.set(o.localDate, list);
  }
  const days = [...byDate.entries()];
  const shown = days.slice(0, 30);

  if (occurrences.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No doses fall in the next {INITIAL_HORIZON_DAYS} days — check the start
        date and schedule.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">
        {occurrences.length} dose{occurrences.length === 1 ? "" : "s"} over{" "}
        {days.length} day{days.length === 1 ? "" : "s"}
        {days.length > shown.length ? " (first 30 shown)" : ""}
      </p>
      <ol className="max-h-64 overflow-y-auto rounded-lg border border-line divide-y divide-line text-sm">
        {shown.map(([date, times]) => (
          <li key={date} className="flex justify-between gap-3 px-3 py-2">
            <span className="text-ink">
              {DateTime.fromISO(date, { zone: "utc" }).toFormat("ccc d LLL")}
            </span>
            <span className="text-ink-muted">{times.join(", ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type PreviewResult =
  | { kind: "incomplete" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      occurrences: GeneratedOccurrence[];
      anchor: ReturnType<typeof plainDate>;
      rule: ReturnType<typeof recurrenceRuleFromInput>;
      cycle: ReturnType<typeof phaseCycleFromInput>;
      specs: ReturnType<typeof doseSpecsFromInput>;
    };

function build(
  draft: WizardDraft,
  timezone: string,
  defaultTimes: Record<string, string>,
): PreviewResult {
  const parsed = createTreatmentSchema.safeParse(draft);
  if (!parsed.success) return { kind: "incomplete" };
  const d = parsed.data;

  try {
    const anchor = plainDate(d.anchorDate);
    const rule = recurrenceRuleFromInput(d.recurrence, anchor);
    const cycle = phaseCycleFromInput(d.duration);
    const specs = doseSpecsFromInput(d.doseTimes);
    const occurrences = generateOccurrences({
      anchor,
      recurrenceRule: rule,
      phaseCycle: cycle,
      doseTimes: specs,
      timezone,
      defaultTimes,
      scheduleVersion: 1,
      range: { from: anchor, to: addDays(anchor, INITIAL_HORIZON_DAYS) },
    });
    return { kind: "ok", occurrences, anchor, rule, cycle, specs };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "Could not build the schedule.",
    };
  }
}
