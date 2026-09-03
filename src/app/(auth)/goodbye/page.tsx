import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account deleted" };

export default function GoodbyePage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-ink-muted">
        Your account and all of its data — treatments, dose history, reminders,
        and any uploaded prescriptions — have been permanently deleted.
      </p>
      <Link href="/sign-up" className={buttonClass("secondary", "md")}>
        Start over
      </Link>
    </div>
  );
}
