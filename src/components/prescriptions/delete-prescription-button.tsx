"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { deletePrescriptionAction } from "@/server/account/delete";

export function DeletePrescriptionButton({
  prescriptionId,
  hasPlan,
}: {
  prescriptionId: string;
  hasPlan: boolean;
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
        Delete prescription &amp; shred the file
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this prescription?"
        body={
          hasPlan
            ? "The uploaded file is shredded and its record removed. The treatments you built from it stay in your plan."
            : "The uploaded file is shredded and its record removed. This can't be undone."
        }
        confirmLabel="Delete & shred file"
        pending={pending}
        error={error}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deletePrescriptionAction(prescriptionId);
            if (result?.error) setError(result.error);
          })
        }
      />
    </>
  );
}
