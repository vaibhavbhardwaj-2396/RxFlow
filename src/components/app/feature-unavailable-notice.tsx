import { Lock } from "lucide-react";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

/**
 * Shown when a flag-gated feature is reached but not enabled in this
 * environment — friendlier than a 404, and honest about why.
 */
export function FeatureUnavailableNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <Lock className="size-6" aria-hidden />
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          {children}
        </p>
      </div>
      <Link href="/treatments" className={buttonClass("secondary", "md")}>
        Back to treatments
      </Link>
    </section>
  );
}
