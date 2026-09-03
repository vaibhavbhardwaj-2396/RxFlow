import { FileUp, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FeatureUnavailableNotice } from "@/components/app/feature-unavailable-notice";
import { PrescriptionList } from "@/components/prescriptions/prescription-list";
import { buttonClass } from "@/components/ui/button";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { listPrescriptionsForUser } from "@/server/prescriptions/queries";

export const metadata: Metadata = { title: "Prescriptions" };

export default async function PrescriptionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  if (!env.FEATURE_PRESCRIPTION_UPLOAD) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <FeatureUnavailableNotice title="Prescription upload is off here">
          This deployment keeps prescription upload disabled until its storage
          and retention review is done. You can still build treatments by hand
          from the Treatments tab.
        </FeatureUnavailableNotice>
      </div>
    );
  }

  const prescriptions = await listPrescriptionsForUser(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <Header />
        {prescriptions.length > 0 && (
          <Link
            href="/prescriptions/new"
            className={buttonClass("primary", "md")}
          >
            <FileUp className="size-4" aria-hidden />
            Upload
          </Link>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              No prescriptions yet
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
              Upload a photo or PDF to keep it alongside your plan, then enter
              the treatments it lists. The document is a reference — you stay in
              control of the schedule.
            </p>
          </div>
          <Link
            href="/prescriptions/new"
            className={buttonClass("primary", "md")}
          >
            <FileUp className="size-4" aria-hidden />
            Upload a prescription
          </Link>
        </section>
      ) : (
        <PrescriptionList prescriptions={prescriptions} />
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Reference
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
        Prescriptions
      </h1>
    </div>
  );
}
