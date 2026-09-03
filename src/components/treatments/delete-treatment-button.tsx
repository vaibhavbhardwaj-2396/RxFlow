"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { deleteTreatmentAction } from "@/server/account/delete";

export function DeleteTreatmentButton({
  treatmentId,
  name,
}: {
  treatmentId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:underline"
      >
        <Trash2 className="size-4" aria-hidden />
        Delete this treatment
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${name}?`}
        body="This removes the treatment and its entire dose history — every completed, skipped and missed record. It can't be undone. (Finishing a treatment is different — you don't need to delete it.)"
        confirmLabel="Delete treatment"
        pending={pending}
        error={error}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteTreatmentAction(treatmentId);
            if (result?.error) setError(result.error);
          })
        }
      />
    </>
  );
}
