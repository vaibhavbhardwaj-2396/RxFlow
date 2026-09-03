"use client";

import { Plus, X } from "lucide-react";

import { RadioGroup } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { humaniseAnchor } from "@/lib/schedule-summary";
import { cn } from "@/lib/cn";
import { TREATMENT_CATEGORIES } from "@/lib/validation/treatment";

import type { WizardDraft } from "./wizard-draft";

type Update = (patch: Partial<WizardDraft>) => void;
type Errors = Record<string, string>;

interface StepProps {
  draft: WizardDraft;
  update: Update;
  errors: Errors;
}

const selectClass =
  "h-11 rounded-lg border border-line bg-surface px-3 text-[0.95rem] text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

const CATEGORY_LABELS: Record<(typeof TREATMENT_CATEGORIES)[number], string> = {
  medication: "Medication",
  supplement: "Supplement",
  topical: "Topical — cream, ointment, drops",
  therapy: "Therapy or routine",
  other: "Other",
};

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;

export function BasicsStep({ draft, update, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Name"
        name="name"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="e.g. Multivitamin A"
        autoFocus
        error={errors.name}
      />
      <RadioGroup
        legend="Category"
        name="category"
        columns={2}
        value={draft.category}
        onChange={(category) => update({ category })}
        options={TREATMENT_CATEGORIES.map((value) => ({
          value,
          label: CATEGORY_LABELS[value],
        }))}
        error={errors.category}
      />
      <Textarea
        label="Instructions (optional)"
        name="instructionsText"
        value={draft.instructionsText}
        onChange={(e) => update({ instructionsText: e.target.value })}
        placeholder="The prescriber's wording, verbatim"
        hint="Shown exactly as written — Regimen never interprets it."
        error={errors.instructionsText}
      />
      <TextField
        label="Dose / quantity (optional)"
        name="doseText"
        value={draft.doseText}
        onChange={(e) => update({ doseText: e.target.value })}
        placeholder="e.g. 1 tablet"
        hint="Free text, shown back as-is."
        error={errors.doseText}
      />
    </div>
  );
}

type RecurrenceChoice = "daily" | "weekdays" | "alternate" | "everyN";

function recurrenceChoice(draft: WizardDraft): RecurrenceChoice {
  const r = draft.recurrence;
  if (r.kind === "daily") return "daily";
  if (r.kind === "specific_weekdays") return "weekdays";
  return r.interval === 2 ? "alternate" : "everyN";
}

export function ScheduleStep({ draft, update, errors }: StepProps) {
  const choice = recurrenceChoice(draft);

  const pick = (next: RecurrenceChoice) => {
    switch (next) {
      case "daily":
        return update({ recurrence: { kind: "daily" } });
      case "weekdays":
        return update({
          recurrence: {
            kind: "specific_weekdays",
            weekdays:
              draft.recurrence.kind === "specific_weekdays"
                ? draft.recurrence.weekdays
                : [1, 2, 3, 4, 5],
          },
        });
      case "alternate":
        return update({ recurrence: { kind: "interval_days", interval: 2 } });
      case "everyN":
        return update({
          recurrence: {
            kind: "interval_days",
            interval:
              draft.recurrence.kind === "interval_days" &&
              draft.recurrence.interval !== 2
                ? draft.recurrence.interval
                : 3,
          },
        });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <RadioGroup
        legend="How often?"
        name="recurrence"
        value={choice}
        onChange={pick}
        options={[
          { value: "daily", label: "Every day" },
          { value: "weekdays", label: "Specific days of the week" },
          { value: "alternate", label: "Every other day" },
          { value: "everyN", label: "Every few days" },
        ]}
        error={errors.recurrence}
      />

      {draft.recurrence.kind === "specific_weekdays" && (
        <div className="flex flex-col gap-2">
          <ToggleGroup
            legend="Which days?"
            value={draft.recurrence.weekdays}
            onChange={(weekdays) =>
              update({ recurrence: { kind: "specific_weekdays", weekdays } })
            }
            options={WEEKDAYS}
          />
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="rounded-md border border-line px-2 py-1 text-ink-muted hover:bg-surface-sunken"
              onClick={() =>
                update({
                  recurrence: {
                    kind: "specific_weekdays",
                    weekdays: [1, 2, 3, 4, 5],
                  },
                })
              }
            >
              Weekdays
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-2 py-1 text-ink-muted hover:bg-surface-sunken"
              onClick={() =>
                update({
                  recurrence: { kind: "specific_weekdays", weekdays: [6, 7] },
                })
              }
            >
              Weekends
            </button>
          </div>
        </div>
      )}

      {draft.recurrence.kind === "interval_days" &&
        draft.recurrence.interval !== 2 && (
          <label className="flex items-center gap-3 text-sm text-ink">
            Every
            <input
              type="number"
              min={2}
              max={30}
              value={draft.recurrence.interval}
              onChange={(e) =>
                update({
                  recurrence: {
                    kind: "interval_days",
                    interval: clampInt(e.target.value, 2, 30, 3),
                  },
                })
              }
              className={cn(selectClass, "w-20")}
            />
            days
          </label>
        )}
    </div>
  );
}

type DurationChoice = "for" | "until" | "ongoing";

export function DurationStep({ draft, update, errors }: StepProps) {
  const d = draft.duration;
  const choice: DurationChoice =
    d.kind === "until" ? "until" : d.kind === "ongoing" ? "ongoing" : "for";
  const forValue =
    d.kind === "days" || d.kind === "weeks" || d.kind === "months"
      ? d.value
      : 2;
  const forUnit =
    d.kind === "days" || d.kind === "weeks" || d.kind === "months"
      ? d.kind
      : "weeks";

  const pick = (next: DurationChoice) => {
    if (next === "for")
      return update({ duration: { kind: "weeks", value: forValue } });
    if (next === "until")
      return update({ duration: { kind: "until", date: draft.anchorDate } });
    return update({ duration: { kind: "ongoing" } });
  };

  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Start date"
        name="anchorDate"
        type="date"
        value={draft.anchorDate}
        onChange={(e) => update({ anchorDate: e.target.value })}
        error={errors.anchorDate}
      />

      <RadioGroup
        legend="For how long?"
        name="duration"
        value={choice}
        onChange={pick}
        options={[
          { value: "for", label: "For a set period" },
          { value: "until", label: "Until a specific date" },
          { value: "ongoing", label: "Ongoing — no end date yet" },
        ]}
        error={errors.duration}
      />

      {choice === "for" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            aria-label="Duration length"
            value={forValue}
            onChange={(e) =>
              update({
                duration: {
                  kind: forUnit,
                  value: clampInt(e.target.value, 1, 3650, 1),
                },
              })
            }
            className={cn(selectClass, "w-20")}
          />
          <select
            aria-label="Duration unit"
            value={forUnit}
            onChange={(e) =>
              update({
                duration: {
                  kind: e.target.value as "days" | "weeks" | "months",
                  value: forValue,
                },
              })
            }
            className={selectClass}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </div>
      )}

      {choice === "until" && d.kind === "until" && (
        <TextField
          label="End date"
          name="untilDate"
          type="date"
          min={draft.anchorDate}
          value={d.date}
          onChange={(e) =>
            update({ duration: { kind: "until", date: e.target.value } })
          }
        />
      )}
    </div>
  );
}

interface DoseStepProps extends StepProps {
  namedTimes: Array<[string, string]>;
}

export function DoseTimesStep({
  draft,
  update,
  errors,
  namedTimes,
}: DoseStepProps) {
  const rows = draft.doseTimes;

  const setRow = (i: number, row: WizardDraft["doseTimes"][number]) =>
    update({ doseTimes: rows.map((r, j) => (j === i ? row : r)) });
  const removeRow = (i: number) =>
    update({ doseTimes: rows.filter((_, j) => j !== i) });
  const addRow = () =>
    update({ doseTimes: [...rows, { kind: "clock", value: "09:00" }] });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-ink">
        When is it taken on an active day?
      </p>

      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            aria-label={`Dose ${i + 1} timing`}
            value={row.kind === "clock" ? "__clock" : row.anchor}
            onChange={(e) =>
              setRow(
                i,
                e.target.value === "__clock"
                  ? { kind: "clock", value: "09:00" }
                  : { kind: "relative", anchor: e.target.value },
              )
            }
            className={cn(selectClass, "flex-1")}
          >
            <option value="__clock">At a specific time</option>
            {namedTimes.map(([slug, time]) => (
              <option key={slug} value={slug}>
                {humaniseAnchor(slug)} ({time})
              </option>
            ))}
          </select>

          {row.kind === "clock" && (
            <input
              type="time"
              aria-label={`Dose ${i + 1} time`}
              value={row.value}
              onChange={(e) =>
                setRow(i, { kind: "clock", value: e.target.value })
              }
              className={selectClass}
            />
          )}

          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label={`Remove dose ${i + 1}`}
              className="rounded-md p-2 text-ink-faint hover:bg-surface-sunken hover:text-danger"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      ))}

      {errors.doseTimes && (
        <p className="text-xs text-danger">{errors.doseTimes}</p>
      )}

      {rows.length < 6 && (
        <button
          type="button"
          onClick={addRow}
          className="mt-1 inline-flex items-center gap-1.5 self-start rounded-lg border border-line px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken"
        >
          <Plus className="size-4" aria-hidden />
          Add another time
        </button>
      )}
    </div>
  );
}

function clampInt(raw: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
