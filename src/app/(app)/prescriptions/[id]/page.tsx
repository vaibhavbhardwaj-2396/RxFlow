import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeletePrescriptionButton } from "@/components/prescriptions/delete-prescription-button";
import { PlanBuilder } from "@/components/prescriptions/plan-builder";
import { PrescriptionViewer } from "@/components/prescriptions/prescription-viewer";
import { buttonClass } from "@/components/ui/button";
import { localToday } from "@/domain/time";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getPrescriptionForUser } from "@/server/prescriptions/queries";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Prescription" };

export default async function PrescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ now?: string }>;
}) {
  const { id } = await params;
  const { now } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!env.FEATURE_PRESCRIPTION_UPLOAD) notFound();

  const [prescription, user] = await Promise.all([
    getPrescriptionForUser(session.user.id, id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        timezone: true,
        settings: { select: { defaultTimes: true } },
      },
    }),
  ]);
  if (!prescription || !user) notFound();

  const clock = await getRequestClock(now);
  const today = localToday(clock, user.timezone);
  const defaultTimes = (user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/prescriptions"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Prescriptions
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink">
        {prescription.originalName ?? "Prescription"}
      </h1>

      <PrescriptionViewer
        prescriptionId={prescription.id}
        sourceType={prescription.sourceType}
        originalName={prescription.originalName}
      />

      {prescription.status === "confirmed" ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-accent">
            <CheckCircle2 className="size-4" aria-hidden />A plan was created
            from this prescription.
          </p>
          <ul className="flex flex-col gap-2">
            {prescription.treatments.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/treatments/${t.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm hover:border-ink-faint"
                >
                  <span className="text-ink">{t.name}</span>
                  <span className="text-xs uppercase tracking-wide text-ink-faint">
                    {t.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {prescription.items.some((i) => i.ambiguityFlags.length > 0) && (
            <div className="rounded-lg bg-surface-sunken p-3 text-xs text-ink-muted">
              <p className="font-medium text-ink">
                Notes you left while reviewing
              </p>
              <ul className="mt-1 list-disc pl-4">
                {prescription.items.flatMap((i) =>
                  i.ambiguityFlags.map((f, k) => (
                    <li key={`${i.id}-${k}`}>{f}</li>
                  )),
                )}
              </ul>
            </div>
          )}
          <Link href="/treatments" className={buttonClass("secondary", "md")}>
            View all treatments
          </Link>
        </section>
      ) : (
        <PlanBuilder
          prescriptionId={prescription.id}
          timezone={user.timezone}
          defaultTimes={defaultTimes}
          today={today}
          initialNote={prescription.note}
        />
      )}

      <div className="border-t border-line pt-4">
        <DeletePrescriptionButton
          prescriptionId={prescription.id}
          hasPlan={prescription.treatments.length > 0}
        />
      </div>
    </div>
  );
}
