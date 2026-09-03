import { DateTime } from "luxon";
import { FileText, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { PrescriptionListItem } from "@/server/prescriptions/queries";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Not started",
  in_review: "In review",
  confirmed: "Plan created",
};

export function PrescriptionList({
  prescriptions,
}: {
  prescriptions: PrescriptionListItem[];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {prescriptions.map((p) => {
        const Icon = p.sourceType === "pdf" ? FileText : ImageIcon;
        return (
          <li key={p.id}>
            <Link
              href={`/prescriptions/${p.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-muted">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">
                  {p.originalName ?? "Prescription"}
                </p>
                <p className="text-xs text-ink-muted">
                  {DateTime.fromISO(p.createdAt).toFormat("d LLL yyyy")}
                  {p.treatmentCount > 0 &&
                    ` · ${p.treatmentCount} treatment${
                      p.treatmentCount === 1 ? "" : "s"
                    }`}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
                  p.status === "confirmed"
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-sunken text-ink-muted",
                )}
              >
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
