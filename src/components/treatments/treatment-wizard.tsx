"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { createTreatmentAction } from "@/server/treatments/create";

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

interface TreatmentWizardProps {
  today: string;
  timezone: string;
  defaultTimes: Record<string, string>;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function TreatmentWizard({
  today,
  timezone,
  defaultTimes,
}: TreatmentWizardProps) {
  const [draft, setDraft] = useState<WizardDraft>(() => initialDraft(today));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [pending, startTransition] = useTransition();

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

  const confirm = () => {
    startTransition(async () => {
      const result = await createTreatmentAction(draft);
      if (result?.fieldErrors) {
        setErrors(result.fieldErrors);
        const target = FIELD_STEP[Object.keys(result.fieldErrors)[0] ?? ""];
        if (target !== undefined) setStep(target);
      } else if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <ol
        className="flex gap-1.5"
        aria-label={`Step ${step + 1} of ${WIZARD_STEPS.length}: ${WIZARD_STEPS[step]}`}
      >
        {WIZARD_STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= step ? "bg-accent" : "bg-line",
            )}
          />
        ))}
      </ol>

      <h1 className="font-display text-2xl font-semibold text-ink">
        {WIZARD_STEPS[step]}
      </h1>

      {step === 0 && (
        <BasicsStep draft={draft} update={update} errors={errors} />
      )}
      {step === 1 && (
        <ScheduleStep draft={draft} update={update} errors={errors} />
      )}
      {step === 2 && (
        <DurationStep draft={draft} update={update} errors={errors} />
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
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={cn(buttonClass("ghost", "md"), step === 0 && "invisible")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
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
      return true;
    case 2:
      if (!DATE_RE.test(d.anchorDate)) return false;
      if (d.duration.kind === "until")
        return DATE_RE.test(d.duration.date) && d.duration.date >= d.anchorDate;
      if (d.duration.kind !== "ongoing") return d.duration.value >= 1;
      return true;
    case 3:
      return (
        d.doseTimes.length >= 1 &&
        d.doseTimes.every((t) => t.kind === "relative" || TIME_RE.test(t.value))
      );
    default:
      return true;
  }
}
