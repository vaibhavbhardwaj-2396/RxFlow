"use client";

import { Check, Undo2, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useOptimistic, useState, useTransition } from "react";

import type { OccurrenceStatus } from "@/domain/adherence";
import { cn } from "@/lib/cn";
import {
  type OccurrenceActionResult,
  completeOccurrence,
  reopenOccurrence,
  skipOccurrence,
} from "@/server/occurrences/actions";
import type { OccurrenceCardVM } from "@/server/occurrences/queries";

export function OccurrenceRow({ item }: { item: OccurrenceCardVM }) {
  const [status, setOptimistic] = useOptimistic<OccurrenceStatus>(item.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState<string | null>(null);

  const run = (
    optimistic: OccurrenceStatus,
    label: string,
    action: () => Promise<OccurrenceActionResult>,
  ) => {
    setError(null);
    startTransition(async () => {
      setOptimistic(optimistic);
      const result = await action();
      if ("error" in result) setError(result.error);
      else setAnnounce(`${item.treatmentName} at ${item.localTime}: ${label}`);
    });
  };

  const settled = status === "completed" || status === "skipped";
  const isPending = status === "scheduled" || status === "reminder_sent";

  return (
    <li
      className={cn(
        "rounded-xl border border-line px-3 py-3",
        settled ? "bg-surface-sunken" : "bg-surface",
      )}
    >
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-faint">
              {item.localTime}
            </span>
            {item.overdue && isPending && (
              <span className="rounded-full bg-warn/15 px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-warn">
                overdue
              </span>
            )}
          </div>
          <p
            className={cn(
              "truncate font-medium",
              settled ? "text-ink-muted line-through" : "text-ink",
            )}
          >
            {item.treatmentName}
          </p>
          {item.doseText && (
            <p className="truncate text-xs text-ink-muted">{item.doseText}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isPending && (
            <>
              <ActionButton
                label="Skip"
                onClick={() =>
                  run("skipped", "skipped", () => skipOccurrence(item.id))
                }
                disabled={pending}
              >
                <X className="size-4" aria-hidden />
              </ActionButton>
              <ActionButton
                label="Mark done"
                primary
                onClick={() =>
                  run("completed", "marked done", () =>
                    completeOccurrence(item.id),
                  )
                }
                disabled={pending}
              >
                <Check className="size-4" aria-hidden />
              </ActionButton>
            </>
          )}

          {settled && (
            <>
              <span className="text-xs text-ink-muted">
                {status === "completed" ? "Done" : "Skipped"}
              </span>
              <ActionButton
                label="Undo"
                onClick={() =>
                  run("scheduled", "reopened", () => reopenOccurrence(item.id))
                }
                disabled={pending}
              >
                <Undo2 className="size-4" aria-hidden />
              </ActionButton>
            </>
          )}

          {status === "missed" && (
            <>
              <span className="text-xs text-danger">Missed</span>
              <ActionButton
                label="Mark done"
                primary
                onClick={() =>
                  run("completed", "marked done", () =>
                    completeOccurrence(item.id),
                  )
                }
                disabled={pending}
              >
                <Check className="size-4" aria-hidden />
              </ActionButton>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </li>
  );
}

function ActionButton({
  label,
  primary,
  children,
  ...props
}: ComponentProps<"button"> & {
  label: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        primary
          ? "border-accent bg-accent text-accent-ink hover:bg-accent-hover"
          : "border-line bg-surface text-ink-muted hover:bg-surface-sunken",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
