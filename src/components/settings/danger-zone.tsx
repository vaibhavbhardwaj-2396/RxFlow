"use client";

import { Download } from "lucide-react";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClass } from "@/components/ui/button";
import { deleteAccountAction } from "@/server/account/delete";

export function DangerZone({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <SettingsSection
      title="Your data"
      description="Take a copy, or remove everything for good."
    >
      <a
        href="/api/account/export"
        download
        className={buttonClass("secondary", "md")}
      >
        <Download className="size-4" aria-hidden />
        Download my data (JSON)
      </a>

      <div className="border-t border-line pt-4">
        <p className="text-sm font-medium text-ink">Delete account</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          Permanently removes your profile, every treatment and its history, all
          reminders, and any uploaded prescription files. This cannot be undone.
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${buttonClass("secondary", "md")} border-danger text-danger hover:bg-danger/10`}
          >
            Delete account…
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete your account?"
            body="All of your treatments, dose history, reminders and uploaded prescriptions will be permanently erased. There is no way back."
            confirmLabel="Delete everything"
            requireText={email}
            pending={pending}
            error={error}
            onConfirm={(typed) =>
              startTransition(async () => {
                const result = await deleteAccountAction(typed);
                if (result?.error) setError(result.error);
              })
            }
          />
        </div>
      </div>
    </SettingsSection>
  );
}
