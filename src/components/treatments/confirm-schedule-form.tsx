"use client";

import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { suggestWeekdays } from "@/lib/suggest-weekdays";
import { confirmScheduleAction } from "@/server/treatments/confirm";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;

export function ConfirmScheduleForm({
  treatmentId,
  count,
}: {
  treatmentId: string;
  count: number;
}) {
  const [days, setDays] = useState<number[]>(() => suggestWeekdays(count));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-accent bg-accent-soft p-4">
      <div>
        <p className="text-sm font-medium text-ink">
          {count}× a week — which days?
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">
          An even spread is suggested. Adjust it, then confirm to build the
          schedule.
        </p>
      </div>

      <ToggleGroup
        legend="Days"
        value={days}
        onChange={setDays}
        options={WEEKDAYS}
        error={error ?? undefined}
      />

      <button
        type="button"
        disabled={pending || days.length === 0}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await confirmScheduleAction(treatmentId, days);
            if (result?.error) setError(result.error);
          });
        }}
        className={buttonClass("primary", "md")}
      >
        {pending ? "Saving…" : "Confirm days"}
      </button>
    </div>
  );
}
