"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { ReviewStep } from "./review-step";
import {
  FIELD_STEP,
  WIZARD_STEPS,
  type WizardDraft,
  initialDraft,
} from "./wizard-draft";
import {
  BasicsStep,
  DoseTimesStep,
  DurationStep,
  ScheduleStep,
} from "./wizard-steps";

export type WizardSubmitResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | void;

interface TreatmentWizardProps {
  today: string;
  timezone: string;
  defaultTimes: Record<string, string>;
  mode?: "create" | "edit";
  draft?: WizardDraft;
  submit: (input: unknown) => Promise<WizardSubmitResult>;
  submitLabel?: string;
  groupOptions?: Array<{ id: string; title: string }>;
  /** Show the "Group" picker on the Basics step (the standalone create flow only). */
  showGroupPicker?: boolean;
  /** Where the step-0 back link points, and its label. Omit inside embedded flows. */
  exitHref?: string;
  exitLabel?: string;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function TreatmentWizard({
  today,
  timezone,
  defaultTimes,
  mode = "create",
  draft: seed,
  submit,
  submitLabel,
  groupOptions = [],
  showGroupPicker = false,
  exitHref,
  exitLabel = "Back",
}: TreatmentWizardProps) {
  const [draft, setDraft] = useState<WizardDraft>(
    () => seed ?? initialDraft(today),
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    // Move focus to the step heading on each step change (not the first render).
    if (mounted.current) headingRef.current?.focus();
    else mounted.current = true;
  }, [step]);

  const update = (patch: Partial<WizardDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
    setFormError(undefined);
  };

  const namedTimes = Object.entries(defaultTimes).sort((a, b) =>
    a[1].localeCompare(b[1]),
  );

  const isLast = step === WIZARD_STEPS.length - 1;
  const canAdvance = stepValid(step, draft);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const confirm = () => {
    startTransition(async () => {
      const result = await submit(draft);
      if (result?.fieldErrors) {
        setErrors(result.fieldErrors);
        const target = FIELD_STEP[Object.keys(result.fieldErrors)[0] ?? ""];
        if (target !== undefined) setStep(target);
      } else if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  const backLinkClass =
    "inline-flex items-center gap-1.5 self-start text-sm text-ink-muted hover:text-ink";

  return (
    <div className="flex flex-col gap-6">
      {step === 0 ? (
        exitHref && (
          <Link href={exitHref} className={backLinkClass}>
            <ArrowLeft className="size-4" aria-hidden />
            {exitLabel}
          </Link>
        )
      ) : (
        <button type="button" onClick={back} className={backLinkClass}>
          <ArrowLeft className="size-4" aria-hidden />
          {WIZARD_STEPS[step - 1]}
        </button>
      )}

      <ol
        className="flex gap-1.5"
        aria-label={`Step ${step + 1} of ${WIZARD_STEPS.length}: ${WIZARD_STEPS[step]}`}
      >
        {WIZARD_STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= step ? "bg-accent" : "bg-line",
            )}
          />
        ))}
      </ol>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl font-semibold text-ink focus:outline-none"
      >
        {WIZARD_STEPS[step]}
      </h2>

      {step === 0 && (
        <BasicsStep
          draft={draft}
          update={update}
          errors={errors}
          groupOptions={mode === "create" ? groupOptions : []}
          showGroupPicker={mode === "create" && showGroupPicker}
        />
      )}
      {step === 1 && (
        <ScheduleStep draft={draft} update={update} errors={errors} />
      )}
      {step === 2 && (
        <DurationStep
          draft={draft}
          update={update}
          errors={errors}
          startDateLocked={mode === "edit"}
        />
      )}
      {step === 3 && (
        <DoseTimesStep
          draft={draft}
          update={update}
          errors={errors}
          namedTimes={namedTimes}
        />
      )}
      {step === 4 && (
        <ReviewStep
          draft={draft}
          timezone={timezone}
          defaultTimes={defaultTimes}
          submitting={pending}
          error={formError}
          onConfirm={confirm}
          onEdit={setStep}
          submitLabel={
            submitLabel ??
            (mode === "edit" ? "Save changes" : "Confirm & create schedule")
          }
          regenerateNote={mode === "edit"}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className={buttonClass("secondary", "md")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
        ) : (
          <span />
        )}
        {!isLast && (
          <button
            type="button"
            onClick={() => canAdvance && setStep((s) => s + 1)}
            disabled={!canAdvance}
            className={buttonClass("primary", "md")}
          >
            Next
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function stepValid(step: number, d: WizardDraft): boolean {
  switch (step) {
    case 0:
      return d.name.trim().length > 0;
    case 1:
      if (d.recurrence.kind === "specific_weekdays")
        return d.recurrence.weekdays.length > 0;
      if (d.recurrence.kind === "interval_days")
        return d.recurrence.interval >= 2 && d.recurrence.interval <= 30;
      if (d.recurrence.kind === "times_per_week")
        return (
          d.recurrence.count >= 2 &&
          d.recurrence.count <= 7 &&
          d.recurrence.weekdays.length > 0
        );
      return true;
    case 2: {
      if (!DATE_RE.test(d.anchorDate)) return false;
      const w = d.window;
      if (w.kind === "simple") {
        if (w.duration.kind === "until")
          return (
            DATE_RE.test(w.duration.date) && w.duration.date >= d.anchorDate
          );
        if (w.duration.kind !== "ongoing") return w.duration.value >= 1;
        return true;
      }
      if (!w.segments.some((s) => s.phase === "active")) return false;
      if (!w.segments.every((s) => s.value >= 1)) return false;
      if (w.repeat.mode === "count") return w.repeat.count >= 1;
      if (w.repeat.mode === "until")
        return DATE_RE.test(w.repeat.date) && w.repeat.date >= d.anchorDate;
      return true;
    }
    case 3:
      return (
        d.doseTimes.length >= 1 &&
        d.doseTimes.every((t) => t.kind === "relative" || TIME_RE.test(t.value))
      );
    default:
      return true;
  }
}
