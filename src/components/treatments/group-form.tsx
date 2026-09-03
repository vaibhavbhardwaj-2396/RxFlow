"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { buttonClass } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";
import {
  GROUP_COLORS,
  type GroupColor,
  GROUP_COLOR_CLASSES,
} from "@/lib/group-color";
import {
  archiveGroupAction,
  createGroupAction,
  createGroupAndAssignAction,
  deleteGroupAction,
  updateGroupAction,
} from "@/server/treatments/group-actions";

interface Existing {
  id: string;
  title: string;
  kind: "ongoing" | "course";
  color: string | null;
  archived: boolean;
  treatmentCount: number;
}

export function GroupForm({
  group,
  assignTreatmentId,
}: {
  group?: Existing;
  assignTreatmentId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(group?.title ?? "");
  const [kind, setKind] = useState<"ongoing" | "course">(
    group?.kind ?? "ongoing",
  );
  const [color, setColor] = useState<GroupColor | null>(
    (group?.color as GroupColor | null) ?? null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const payload = { title, kind, color };
      if (group) {
        const r = await updateGroupAction(group.id, payload);
        if (r.error) setError(r.error);
        else router.push("/treatments");
        return;
      }
      if (assignTreatmentId) {
        // Redirects on success; only returns here on error.
        const r = await createGroupAndAssignAction(assignTreatmentId, payload);
        if (r?.error) setError(r.error);
        return;
      }
      const r = await createGroupAction(payload);
      if (r.error) setError(r.error);
      else router.push("/treatments");
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Name"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Dermatology, Daily Supplements, Travel"
        autoFocus
        maxLength={60}
      />

      <RadioGroup
        legend="Kind"
        name="kind"
        value={kind}
        onChange={(v) => setKind(v as "ongoing" | "course")}
        options={[
          {
            value: "ongoing",
            label: "Ongoing",
            description: "Things you take regularly — no planned end.",
          },
          {
            value: "course",
            label: "Course",
            description:
              "A time-boxed course; shows an end date from its treatments.",
          },
        ]}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">
          Accent colour
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setColor(null)}
            aria-label="No colour"
            aria-pressed={color === null}
            className={cn(
              "size-8 rounded-full border-2 bg-surface-sunken",
              color === null ? "border-ink" : "border-transparent",
            )}
          />
          {GROUP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={cn(
                "size-8 rounded-full border-2",
                GROUP_COLOR_CLASSES[c].dot,
                color === c ? "border-ink" : "border-transparent",
              )}
            />
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={pending || title.trim().length === 0}
        className={buttonClass("primary", "lg")}
      >
        {pending ? "Saving…" : group ? "Save group" : "Create group"}
      </button>

      {group && (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await archiveGroupAction(group.id, !group.archived);
                router.push("/treatments");
              })
            }
            className={buttonClass("secondary", "md")}
          >
            {group.archived ? "Unarchive group" : "Archive group"}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`${buttonClass("secondary", "md")} border-danger text-danger hover:bg-danger/10`}
          >
            Delete group
          </button>
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={`Delete “${group.title}”?`}
            body={
              group.treatmentCount > 0
                ? "This group still has treatments. Move them to another group (or out) first — deleting the group never deletes a treatment."
                : "The group is removed. Its treatments are unaffected (there are none)."
            }
            confirmLabel="Delete group"
            pending={pending}
            error={error}
            onConfirm={() =>
              startTransition(async () => {
                const r = await deleteGroupAction(group.id);
                if (r.error) setError(r.error);
                else router.push("/treatments");
              })
            }
          />
        </div>
      )}
    </div>
  );
}
