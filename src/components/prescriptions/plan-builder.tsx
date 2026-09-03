"use client";

import { AlertTriangle, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { TreatmentWizard } from "@/components/treatments/treatment-wizard";
import type { WizardDraft } from "@/components/treatments/wizard-draft";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { previewSchedule } from "@/lib/schedule-preview";
import {
  describeDoseTimes,
  describeRecurrence,
  describeWindow,
} from "@/lib/schedule-summary";
import {
  createTreatmentSchema,
  fieldErrorsOf,
} from "@/lib/validation/treatment";
import { confirmPrescriptionPlanAction } from "@/server/prescriptions/actions";

interface Card {
  key: string;
  draft: WizardDraft;
  acknowledged: boolean;
  ambiguityNote: string;
}

let seq = 0;
const nextKey = () => `card-${(seq += 1)}`;

export function PlanBuilder({
  prescriptionId,
  timezone,
  defaultTimes,
  today,
  initialNote,
}: {
  prescriptionId: string;
  timezone: string;
  defaultTimes: Record<string, string>;
  today: string;
  initialNote: string | null;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  const [pending, startTransition] = useTransition();

  const editing = cards.find((c) => c.key === editingKey) ?? null;

  const upsert = async (input: unknown) => {
    const parsed = createTreatmentSchema.safeParse(input);
    if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
    const draft = input as WizardDraft;
    setItemErrors({});
    setFormError(null);
    if (editingKey) {
      setCards((cs) =>
        cs.map((c) => (c.key === editingKey ? { ...c, draft } : c)),
      );
      setEditingKey(null);
    } else {
      setCards((cs) => [
        ...cs,
        { key: nextKey(), draft, acknowledged: false, ambiguityNote: "" },
      ]);
      setAdding(false);
    }
  };

  const confirm = () => {
    setFormError(null);
    setItemErrors({});
    startTransition(async () => {
      const result = await confirmPrescriptionPlanAction({
        prescriptionId,
        note: note.trim() || undefined,
        items: cards.map((c) => ({
          draft: c.draft,
          ambiguityFlags: c.ambiguityNote.trim()
            ? [c.ambiguityNote.trim()]
            : [],
          acknowledged: c.acknowledged,
        })),
      });
      if (result?.itemErrors) setItemErrors(result.itemErrors);
      if (result?.error) setFormError(result.error);
    });
  };

  if (adding || editing) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-ink">
          {editing ? "Edit this treatment" : "Add a treatment"}
        </p>
        <TreatmentWizard
          today={today}
          timezone={timezone}
          defaultTimes={defaultTimes}
          draft={editing?.draft}
          submit={upsert}
          submitLabel={editing ? "Save changes" : "Add to plan"}
        />
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setEditingKey(null);
          }}
          className={buttonClass("ghost", "md")}
        >
          Cancel
        </button>
      </div>
    );
  }

  const blockers = cards.filter((c) => {
    const preview = previewSchedule(c.draft, timezone, defaultTimes);
    return (
      !c.acknowledged ||
      preview.kind !== "ok" ||
      preview.needsDayChoice ||
      preview.occurrences.length === 0
    );
  });
  const canConfirm = cards.length > 0 && blockers.length === 0 && !pending;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Enter the treatments
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Add each one your prescription lists. Check every card against the
          document before you confirm — Regimen never fills these in for you.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {cards.map((card, i) => (
          <PlanCard
            key={card.key}
            card={card}
            index={i}
            timezone={timezone}
            defaultTimes={defaultTimes}
            errors={itemErrors[i]}
            onEdit={() => setEditingKey(card.key)}
            onRemove={() =>
              setCards((cs) => cs.filter((c) => c.key !== card.key))
            }
            onToggleAck={(v) =>
              setCards((cs) =>
                cs.map((c) =>
                  c.key === card.key ? { ...c, acknowledged: v } : c,
                ),
              )
            }
            onNote={(v) =>
              setCards((cs) =>
                cs.map((c) =>
                  c.key === card.key ? { ...c, ambiguityNote: v } : c,
                ),
              )
            }
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className={cn(
          buttonClass("secondary", "md"),
          "border-dashed justify-center",
        )}
      >
        <Plus className="size-4" aria-hidden />
        {cards.length === 0
          ? "Add the first treatment"
          : "Add another treatment"}
      </button>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Note about this prescription{" "}
          <span className="text-ink-faint">(optional)</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. renew in December; ask about the ointment strength"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </label>

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      {cards.length > 0 && blockers.length > 0 && (
        <p className="text-xs text-ink-muted">
          {blockers.length} card{blockers.length === 1 ? "" : "s"} still need
          {blockers.length === 1 ? "s" : ""} a schedule choice or your check
          before you can confirm.
        </p>
      )}

      <button
        type="button"
        onClick={confirm}
        disabled={!canConfirm}
        className={buttonClass("primary", "lg")}
      >
        {pending
          ? "Creating the plan…"
          : `Confirm ${cards.length || ""} treatment${
              cards.length === 1 ? "" : "s"
            } & build the schedule`}
      </button>
    </div>
  );
}

function PlanCard({
  card,
  index,
  timezone,
  defaultTimes,
  errors,
  onEdit,
  onRemove,
  onToggleAck,
  onNote,
}: {
  card: Card;
  index: number;
  timezone: string;
  defaultTimes: Record<string, string>;
  errors?: Record<string, string>;
  onEdit: () => void;
  onRemove: () => void;
  onToggleAck: (v: boolean) => void;
  onNote: (v: string) => void;
}) {
  const preview = useMemo(
    () => previewSchedule(card.draft, timezone, defaultTimes),
    [card.draft, timezone, defaultTimes],
  );

  const needsDays = preview.kind === "ok" && preview.needsDayChoice;
  const errorText =
    errors && Object.values(errors)[0]
      ? Object.values(errors)[0]
      : preview.kind === "error"
        ? preview.message
        : null;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-ink">
            {card.draft.name || `Treatment ${index + 1}`}
          </h3>
          <p className="text-xs uppercase tracking-wide text-ink-faint">
            {card.draft.category}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit treatment"
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove treatment"
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {preview.kind === "ok" && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-faint">Schedule</dt>
          <dd className="text-ink">{describeRecurrence(preview.rule)}</dd>
          <dt className="text-ink-faint">Active</dt>
          <dd className="text-ink">
            {describeWindow(preview.anchor, preview.cycle)}
          </dd>
          <dt className="text-ink-faint">Times</dt>
          <dd className="text-ink">
            {describeDoseTimes(preview.specs, defaultTimes)}
          </dd>
        </dl>
      )}

      {(card.draft.doseText.trim() || card.draft.instructionsText.trim()) && (
        <div className="rounded-lg bg-surface-sunken p-2.5 text-xs text-ink-muted">
          {card.draft.doseText.trim() && (
            <p>Dose: {card.draft.doseText.trim()}</p>
          )}
          {card.draft.instructionsText.trim() && (
            <p className="whitespace-pre-wrap">
              Instructions: {card.draft.instructionsText.trim()}
            </p>
          )}
        </div>
      )}

      {needsDays && (
        <p className="flex items-start gap-1.5 rounded-lg bg-warn/10 px-2.5 py-2 text-xs text-warn">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          This says a number of times per week but not which days. Edit the card
          and choose the days your doctor meant.
        </p>
      )}
      {errorText && !needsDays && (
        <p role="alert" className="text-xs text-danger">
          {errorText}
        </p>
      )}
      {preview.kind === "ok" && !needsDays && (
        <p className="text-xs text-ink-muted">
          {preview.occurrences.length} dose
          {preview.occurrences.length === 1 ? "" : "s"} in the first 90 days
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-faint">
          Anything uncertain about this one?
        </span>
        <input
          value={card.ambiguityNote}
          onChange={(e) => onNote(e.target.value)}
          placeholder="e.g. doctor said 3–4×/week — went with 3"
          className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </label>

      <label
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
          card.acknowledged
            ? "border-accent bg-accent-soft text-accent"
            : "border-line text-ink-muted",
        )}
      >
        <input
          type="checkbox"
          checked={card.acknowledged}
          onChange={(e) => onToggleAck(e.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        <Check
          className={cn(
            "size-4",
            card.acknowledged ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
        I&rsquo;ve checked this against my prescription
      </label>
    </li>
  );
}
