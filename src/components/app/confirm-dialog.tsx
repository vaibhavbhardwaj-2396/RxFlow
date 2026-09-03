"use client";

import { useEffect, useId, useRef, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A confirmation dialog on native `<dialog>` — the browser handles the focus
 * trap and `Escape`; we return focus to the opener and close on backdrop click.
 * Controlled: the parent owns `open` and renders the trigger.
 *
 * `requireText` (optional) gates the confirm button until the user types the
 * exact string — used for account deletion.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  requireText,
  onConfirm,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  requireText?: string;
  onConfirm: (typedValue: string) => void;
  pending?: boolean;
  error?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      setTyped("");
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClose = () => {
      onOpenChange(false);
      openerRef.current?.focus?.();
    };
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onOpenChange]);

  const canConfirm = !pending && (!requireText || typed.trim() === requireText);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2
          id={titleId}
          className="font-display text-lg font-semibold text-ink"
        >
          {title}
        </h2>
        <div id={bodyId} className="text-sm text-ink-muted">
          {body}
        </div>

        {requireText && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink">
              Type <span className="font-medium text-ink">{requireText}</span>{" "}
              to confirm
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="h-11 rounded-lg border border-line bg-surface px-3 text-[0.95rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={buttonClass("ghost", "md")}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(typed)}
            disabled={!canConfirm}
            className={cn(
              buttonClass("primary", "md"),
              "bg-danger text-white hover:bg-danger/90",
            )}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
