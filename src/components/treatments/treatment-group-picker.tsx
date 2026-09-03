"use client";

import { FolderPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { groupColorClasses } from "@/lib/group-color";
import { moveTreatmentToGroupAction } from "@/server/treatments/group-actions";

interface Props {
  treatmentId: string;
  current: { id: string; title: string; color: string | null } | null;
  options: Array<{ id: string; title: string }>;
}

export function TreatmentGroupPicker({ treatmentId, current, options }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const move = (value: string) => {
    if (value === "new") {
      router.push(`/treatments/groups/new?assign=${treatmentId}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await moveTreatmentToGroupAction(
        treatmentId,
        value === "" ? null : value,
      );
      if (r.error) setError(r.error);
      else router.refresh();
    });
  };

  const c = groupColorClasses(current?.color);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-faint">Group</span>
        {current && (
          <span className={cn("size-2 rounded-full", c.dot)} aria-hidden />
        )}
        <select
          value={current?.id ?? ""}
          disabled={pending}
          onChange={(e) => move(e.target.value)}
          aria-label="Move to group"
          className="h-8 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <option value="">Not in a group</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
          <option value="new">+ New group…</option>
        </select>
        <Link
          href={`/treatments/groups/new?assign=${treatmentId}`}
          aria-label="New group"
          className="rounded-md p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <FolderPlus className="size-4" aria-hidden />
        </Link>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
