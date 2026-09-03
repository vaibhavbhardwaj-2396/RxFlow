"use client";

import { BellOff, BellRing } from "lucide-react";
import { useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { toggleTreatmentRemindersAction } from "@/server/treatments/reminders";

export function TreatmentRemindersToggle({
  treatmentId,
  enabled: initial,
}: {
  treatmentId: string;
  enabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !enabled;
    startTransition(async () => {
      setEnabled(next);
      const result = await toggleTreatmentRemindersAction(treatmentId, next);
      if (result?.error) setEnabled(!next);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs",
        enabled
          ? "border-accent bg-accent-soft text-accent"
          : "border-line bg-surface text-ink-muted",
      )}
    >
      {enabled ? (
        <BellRing className="size-3.5" aria-hidden />
      ) : (
        <BellOff className="size-3.5" aria-hidden />
      )}
      {enabled ? "Reminders on" : "Reminders off"}
    </button>
  );
}
