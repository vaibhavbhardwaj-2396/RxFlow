"use client";

import { DateTime } from "luxon";
import { Plus, X } from "lucide-react";
import { useState } from "react";

import { RadioGroup } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { humaniseAnchor } from "@/lib/schedule-summary";
import { cn } from "@/lib/cn";
import { suggestWeekdays } from "@/lib/suggest-weekdays";
import { TREATMENT_CATEGORIES } from "@/lib/validation/treatment";

import type { DraftRecurrence, WizardDraft } from "./wizard-draft";

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

/** "Mon, Wed & Fri" from weekday numbers. */
function weekdayList(days: number[]): string {
  const labels = [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? String(d));
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} & ${labels.at(-1)}`;
}

/** "20:00" → "8:00 PM" for friendly secondary text. */
function fmtClock(hhmm: string): string {
  const dt = DateTime.fromFormat(hhmm, "HH:mm");
  return dt.isValid ? dt.toFormat("h:mm a") : hhmm;
}

export function BasicsStep({
  draft,
  update,
  errors,
  groupOptions = [],
  showGroupPicker = false,
}: StepProps & {
  groupOptions?: Array<{ id: string; title: string }>;
  showGroupPicker?: boolean;
}) {
  const creatingGroup = draft.newGroupTitle !== undefined;

  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Name"
        name="name"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="e.g. Morning BP pill"
        autoFocus
        error={errors.name}
      />
      <TextField
        label="Medicine / brand name (optional)"
        name="medicineName"
        value={draft.medicineName}
        onChange={(e) => update({ medicineName: e.target.value })}
        placeholder="e.g. Amlodipine 5 mg"
        error={errors.medicineName}
      />

      {showGroupPicker && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Group (optional)</span>
          {creatingGroup ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                aria-label="New group name"
                value={draft.newGroupTitle ?? ""}
                onChange={(e) => update({ newGroupTitle: e.target.value })}
                placeholder="e.g. Dermatology"
                maxLength={60}
                className={cn(selectClass, "flex-1")}
              />
              <button
                type="button"
                aria-label="Cancel new group"
                onClick={() => update({ newGroupTitle: undefined })}
                className="rounded-md p-2 text-ink-faint hover:bg-surface-sunken hover:text-danger"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <select
              aria-label="Group"
              value={draft.groupId ?? ""}
              onChange={(e) => {
                if (e.target.value === "__new") {
                  update({ newGroupTitle: "", groupId: "" });
                } else {
                  update({ groupId: e.target.value });
                }
              }}
              className={selectClass}
            >
              <option value="">Its own group</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
              <option value="__new">＋ New group…</option>
            </select>
          )}
        </div>
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
        error={errors.instructionsText}
      />
      <TextField
        label="Dose / quantity (optional)"
        name="doseText"
        value={draft.doseText}
        onChange={(e) => update({ doseText: e.target.value })}
        placeholder="e.g. 1 tablet"
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
      case "weekly": {
        const count =
          draft.recurrence.kind === "times_per_week"
            ? draft.recurrence.count
            : 3;
        return update({
          recurrence: {
            kind: "times_per_week",
            count,
            weekdays: suggestWeekdays(count),
          },
        });
      }
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
          {
            value: "alternate",
            label: "Alternate day",
            description: "every second day",
          },
          {
            value: "everyN",
            label: "Every few days",
            description: "a fixed gap — every 3rd day, every 5th…",
          },
          {
            value: "weekly",
            label: "A few times a week",
            description: "e.g. 3 days a week, spaced out",
          },
        ]}
        error={errors.recurrence}
      />

      {draft.recurrence.kind === "times_per_week" && (
        <TimesPerWeekPicker recurrence={draft.recurrence} update={update} />
      )}

      {draft.recurrence.kind === "specific_weekdays" && (
        <WeekdayPicker
          value={draft.recurrence.weekdays}
          onChange={(weekdays) =>
            update({ recurrence: { kind: "specific_weekdays", weekdays } })
          }
        />
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

function TimesPerWeekPicker({
  recurrence,
  update,
}: {
  recurrence: Extract<DraftRecurrence, { kind: "times_per_week" }>;
  update: Update;
}) {
  const [editing, setEditing] = useState(false);

  const setCount = (count: number) =>
    update({
      recurrence: {
        kind: "times_per_week",
        count,
        weekdays: suggestWeekdays(count),
      },
    });
  const setDays = (weekdays: number[]) =>
    update({
      recurrence: {
        kind: "times_per_week",
        count: Math.max(1, weekdays.length),
        weekdays,
      },
    });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="number"
          min={2}
          max={7}
          aria-label="Times per week"
          value={recurrence.count}
          onChange={(e) => setCount(clampInt(e.target.value, 2, 7, 3))}
          className={cn(selectClass, "w-20")}
        />
        times a week
      </label>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-muted">
          {recurrence.weekdays.length > 0
            ? `On ${weekdayList(recurrence.weekdays)}`
            : "Pick which days"}
        </span>
        <button
          type="button"
          aria-expanded={editing}
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-medium text-accent hover:underline"
        >
          {editing ? "Done" : "Change days"}
        </button>
      </div>

      {editing && (
        <WeekdayPicker value={recurrence.weekdays} onChange={setDays} />
      )}
    </div>
  );
}

function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (weekdays: number[]) => void;
}) {
  const key = [...value].sort((a, b) => a - b).join(",");

  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        legend="Which days?"
        value={value}
        onChange={onChange}
        options={WEEKDAYS}
      />
      <div className="flex gap-2 text-xs">
        <QuickPick
          label="Weekdays"
          active={key === "1,2,3,4,5"}
          onClick={() => onChange([1, 2, 3, 4, 5])}
        />
        <QuickPick
          label="Weekends"
          active={key === "6,7"}
          onClick={() => onChange([6, 7])}
        />
      </div>
    </div>
  );
}

function QuickPick({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 font-medium transition-colors",
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line text-ink-muted hover:bg-surface-sunken",
      )}
    >
      {label}
    </button>
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
          hint="Can be in the past — set it to the day the treatment actually began."
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
    update({
      doseTimes: [
        ...rows,
        namedTimes[0]
          ? { kind: "relative", anchor: namedTimes[0][0] }
          : { kind: "clock", value: "09:00" },
      ],
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Pick the instruction you were given — &ldquo;after dinner&rdquo;,
        &ldquo;before sleep&rdquo;. RxFlow fills in the clock time from your{" "}
        <span className="text-ink">Settings</span>.
      </p>

      {rows.map((row, i) => (
        <DoseTimeRow
          key={i}
          row={row}
          index={i}
          namedTimes={namedTimes}
          canRemove={rows.length > 1}
          onChange={(r) => setRow(i, r)}
          onRemove={() => removeRow(i)}
        />
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

function DoseTimeRow({
  row,
  index,
  namedTimes,
  canRemove,
  onChange,
  onRemove,
}: {
  row: WizardDraft["doseTimes"][number];
  index: number;
  namedTimes: Array<[string, string]>;
  canRemove: boolean;
  onChange: (row: WizardDraft["doseTimes"][number]) => void;
  onRemove: () => void;
}) {
  const resolved =
    row.kind === "relative"
      ? namedTimes.find(([slug]) => slug === row.anchor)?.[1]
      : undefined;
  const anchorMissing = row.kind === "relative" && resolved === undefined;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <select
          aria-label={`Dose ${index + 1} — when is it taken?`}
          value={row.kind === "clock" ? "__clock" : row.anchor}
          onChange={(e) =>
            onChange(
              e.target.value === "__clock"
                ? { kind: "clock", value: resolved ?? "09:00" }
                : { kind: "relative", anchor: e.target.value },
            )
          }
          className={cn(selectClass, "flex-1")}
        >
          {anchorMissing && row.kind === "relative" && (
            <option value={row.anchor}>
              {humaniseAnchor(row.anchor)} (not in Settings)
            </option>
          )}
          {namedTimes.map(([slug]) => (
            <option key={slug} value={slug}>
              {humaniseAnchor(slug)}
            </option>
          ))}
          <option value="__clock">Specific time</option>
        </select>

        {row.kind === "clock" && (
          <input
            type="time"
            aria-label={`Dose ${index + 1} time`}
            value={row.value}
            onChange={(e) => onChange({ kind: "clock", value: e.target.value })}
            className={selectClass}
          />
        )}

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove dose ${index + 1}`}
            className="rounded-md p-2 text-ink-faint hover:bg-surface-sunken hover:text-danger"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {row.kind === "relative" && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {resolved ? (
            <>
              <span>= {fmtClock(resolved)} · from Settings</span>
              <button
                type="button"
                onClick={() => onChange({ kind: "clock", value: resolved })}
                className="font-medium text-accent hover:underline"
              >
                Use a different time
              </button>
            </>
          ) : (
            <span className="text-danger">
              No saved time for this — add it in Settings or pick a specific
              time.
            </span>
          )}
        </div>
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
