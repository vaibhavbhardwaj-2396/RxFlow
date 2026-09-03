"use client";

import { DateTime } from "luxon";
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

export function BasicsStep({
  draft,
  update,
  errors,
  groupOptions = [],
}: StepProps & { groupOptions?: Array<{ id: string; title: string }> }) {
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
      {groupOptions.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Group (optional)</span>
          <select
            value={draft.groupId ?? ""}
            onChange={(e) => update({ groupId: e.target.value })}
            className={selectClass}
          >
            <option value="">Its own group</option>
            {groupOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      )}
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
        hint="Shown exactly as written — RxFlow never interprets it."
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

type RecurrenceChoice =
  "daily" | "weekdays" | "alternate" | "everyN" | "weekly";

function recurrenceChoice(draft: WizardDraft): RecurrenceChoice {
  const r = draft.recurrence;
  if (r.kind === "daily") return "daily";
  if (r.kind === "specific_weekdays") return "weekdays";
  if (r.kind === "times_per_week") return "weekly";
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
      case "weekly":
        return update({
          recurrence: {
            kind: "times_per_week",
            count:
              draft.recurrence.kind === "times_per_week"
                ? draft.recurrence.count
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
          { value: "weekly", label: "A few times a week" },
        ]}
        error={errors.recurrence}
      />

      {draft.recurrence.kind === "times_per_week" && (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="number"
              min={2}
              max={7}
              value={draft.recurrence.count}
              onChange={(e) =>
                update({
                  recurrence: {
                    kind: "times_per_week",
                    count: clampInt(e.target.value, 2, 7, 3),
                  },
                })
              }
              className={cn(selectClass, "w-20")}
            />
            times a week
          </label>
          <p className="text-xs text-ink-muted">
            You&rsquo;ll pick which days right after creating it.
          </p>
        </div>
      )}

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

type WindowChoice = "for" | "until" | "ongoing" | "cycle";

type CycleWindow = Extract<WizardDraft["window"], { kind: "cycle" }>;

const DEFAULT_SEGMENTS: CycleWindow["segments"] = [
  { phase: "active", unit: "days", value: 20 },
  { phase: "break", unit: "days", value: 7 },
];

function windowChoice(window: WizardDraft["window"]): WindowChoice {
  if (window.kind === "cycle") return "cycle";
  const d = window.duration;
  return d.kind === "until"
    ? "until"
    : d.kind === "ongoing"
      ? "ongoing"
      : "for";
}

export function DurationStep({
  draft,
  update,
  errors,
  startDateLocked = false,
}: StepProps & { startDateLocked?: boolean }) {
  const window = draft.window;
  const choice = windowChoice(window);
  const simple = window.kind === "simple" ? window.duration : undefined;
  const forValue =
    simple &&
    (simple.kind === "days" ||
      simple.kind === "weeks" ||
      simple.kind === "months")
      ? simple.value
      : 2;
  const forUnit =
    simple &&
    (simple.kind === "days" ||
      simple.kind === "weeks" ||
      simple.kind === "months")
      ? simple.kind
      : "weeks";

  const setWindow = (w: WizardDraft["window"]) => update({ window: w });

  const pick = (next: WindowChoice) => {
    if (next === "for")
      return setWindow({
        kind: "simple",
        duration: { kind: "weeks", value: forValue },
      });
    if (next === "until")
      return setWindow({
        kind: "simple",
        duration: { kind: "until", date: draft.anchorDate },
      });
    if (next === "ongoing")
      return setWindow({ kind: "simple", duration: { kind: "ongoing" } });
    return setWindow({
      kind: "cycle",
      segments: window.kind === "cycle" ? window.segments : DEFAULT_SEGMENTS,
      repeat: window.kind === "cycle" ? window.repeat : { mode: "once" },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {startDateLocked ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Start date</span>
          <p className="text-sm text-ink-muted">
            Started {fmtStartDate(draft.anchorDate)} — a treatment&rsquo;s start
            date is fixed.
          </p>
        </div>
      ) : (
        <TextField
          label="Start date"
          name="anchorDate"
          type="date"
          value={draft.anchorDate}
          onChange={(e) => update({ anchorDate: e.target.value })}
          error={errors.anchorDate}
        />
      )}

      <RadioGroup
        legend="For how long?"
        name="window"
        value={choice}
        onChange={pick}
        options={[
          { value: "for", label: "For a set period" },
          { value: "until", label: "Until a specific date" },
          { value: "ongoing", label: "Ongoing — no end date yet" },
          {
            value: "cycle",
            label: "Repeating cycle",
            description: "on for a while, off for a while, repeat",
          },
        ]}
        error={errors.window}
      />

      {choice === "for" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            aria-label="Duration length"
            value={forValue}
            onChange={(e) =>
              setWindow({
                kind: "simple",
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
              setWindow({
                kind: "simple",
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

      {choice === "until" && simple?.kind === "until" && (
        <TextField
          label="End date"
          name="untilDate"
          type="date"
          min={draft.anchorDate}
          value={simple.date}
          onChange={(e) =>
            setWindow({
              kind: "simple",
              duration: { kind: "until", date: e.target.value },
            })
          }
        />
      )}

      {choice === "cycle" && window.kind === "cycle" && (
        <CycleEditor
          window={window}
          anchorDate={draft.anchorDate}
          onChange={setWindow}
        />
      )}
    </div>
  );
}

const REPEAT_LABEL: Record<CycleWindow["repeat"]["mode"], string> = {
  once: "Once",
  count: "A number of times",
  until: "Until a date",
  forever: "No end",
};

function CycleEditor({
  window,
  anchorDate,
  onChange,
}: {
  window: CycleWindow;
  anchorDate: string;
  onChange: (w: CycleWindow) => void;
}) {
  const setSegments = (segments: CycleWindow["segments"]) =>
    onChange({ ...window, segments });
  const patchSegment = (
    i: number,
    patch: Partial<CycleWindow["segments"][number]>,
  ) =>
    setSegments(
      window.segments.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    );
  const setRepeat = (repeat: CycleWindow["repeat"]) =>
    onChange({ ...window, repeat });

  const summary = window.segments
    .map((s) => `${s.value} ${s.unit} ${s.phase === "active" ? "on" : "off"}`)
    .join(" · ");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
      <span className="text-sm font-medium text-ink">Cycle segments</span>

      {window.segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            aria-label={`Segment ${i + 1} phase`}
            value={seg.phase}
            onChange={(e) =>
              patchSegment(i, {
                phase: e.target.value as "active" | "break",
              })
            }
            className={selectClass}
          >
            <option value="active">On</option>
            <option value="break">Off</option>
          </select>
          <input
            type="number"
            min={1}
            aria-label={`Segment ${i + 1} length`}
            value={seg.value}
            onChange={(e) =>
              patchSegment(i, { value: clampInt(e.target.value, 1, 365, 1) })
            }
            className={cn(selectClass, "w-20")}
          />
          <select
            aria-label={`Segment ${i + 1} unit`}
            value={seg.unit}
            onChange={(e) =>
              patchSegment(i, {
                unit: e.target.value as "days" | "weeks" | "months",
              })
            }
            className={selectClass}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
          {window.segments.length > 1 && (
            <button
              type="button"
              aria-label={`Remove segment ${i + 1}`}
              onClick={() =>
                setSegments(window.segments.filter((_, j) => j !== i))
              }
              className="rounded-md p-2 text-ink-faint hover:bg-surface-sunken hover:text-danger"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      ))}

      {window.segments.length < 8 && (
        <button
          type="button"
          onClick={() =>
            setSegments([
              ...window.segments,
              { phase: "break", unit: "days", value: 7 },
            ])
          }
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken"
        >
          <Plus className="size-4" aria-hidden />
          Add segment
        </button>
      )}

      <p className="text-sm text-ink-muted">{summary}</p>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Repeat</legend>
        <div className="flex flex-wrap gap-1.5 text-sm">
          {(
            [
              "once",
              "count",
              "until",
              "forever",
            ] as CycleWindow["repeat"]["mode"][]
          ).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={window.repeat.mode === mode}
              onClick={() =>
                setRepeat(
                  mode === "count"
                    ? {
                        mode: "count",
                        count:
                          window.repeat.mode === "count"
                            ? window.repeat.count
                            : 2,
                      }
                    : mode === "until"
                      ? {
                          mode: "until",
                          date:
                            window.repeat.mode === "until"
                              ? window.repeat.date
                              : anchorDate,
                        }
                      : { mode },
                )
              }
              className={cn(
                "rounded-md border px-2.5 py-1",
                window.repeat.mode === mode
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-muted hover:bg-surface-sunken",
              )}
            >
              {REPEAT_LABEL[mode]}
            </button>
          ))}
        </div>
        {window.repeat.mode === "count" && (
          <label className="flex items-center gap-2 text-sm text-ink">
            Repeat
            <input
              type="number"
              min={1}
              max={52}
              value={window.repeat.count}
              onChange={(e) =>
                setRepeat({
                  mode: "count",
                  count: clampInt(e.target.value, 1, 52, 2),
                })
              }
              className={cn(selectClass, "w-20")}
            />
            times
          </label>
        )}
        {window.repeat.mode === "until" && (
          <TextField
            label="Repeat until"
            name="cycleUntil"
            type="date"
            min={anchorDate}
            value={window.repeat.date}
            onChange={(e) => setRepeat({ mode: "until", date: e.target.value })}
          />
        )}
      </fieldset>
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

function fmtStartDate(date: string): string {
  const dt = DateTime.fromISO(date, { zone: "utc" });
  return dt.isValid ? dt.toFormat("d LLL yyyy") : date;
}

function clampInt(raw: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
