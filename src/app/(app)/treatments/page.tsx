import { CalendarPlus, FileUp, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TreatmentList } from "@/components/treatments/treatment-list";
import { buttonClass } from "@/components/ui/button";
import { localToday } from "@/domain/time";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { listTreatmentsForUser } from "@/server/treatments/queries";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Treatments" };

export default async function TreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ now?: string }>;
}) {
  const { now } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  if (!user) redirect("/sign-in");

  const clock = await getRequestClock(now);
  const today = localToday(clock, user.timezone);
  const treatments = await listTreatmentsForUser(session.user.id, today);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Your plan
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            Treatments
          </h1>
        </div>
        {treatments.length > 0 && (
          <div className="flex shrink-0 gap-2">
            {env.FEATURE_PRESCRIPTION_UPLOAD && (
              <Link
                href="/prescriptions"
                className={buttonClass("secondary", "md")}
              >
                <FileUp className="size-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">Prescription</span>
              </Link>
            )}
            <Link
              href="/treatments/new"
              className={buttonClass("primary", "md")}
            >
              <CalendarPlus className="size-4" aria-hidden />
              Add
            </Link>
          </div>
        )}
      </div>

      {treatments.length === 0 && (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              No treatments yet
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
              Add one and RxFlow builds the schedule, generates every dose, and
              (soon) reminds you.
            </p>
          </div>
          <Link href="/treatments/new" className={buttonClass("primary", "md")}>
            <CalendarPlus className="size-4" aria-hidden />
            Add your first treatment
          </Link>
          {env.FEATURE_PRESCRIPTION_UPLOAD && (
            <Link
              href="/prescriptions/new"
              className="text-sm font-medium text-accent hover:underline"
            >
              or upload a prescription to work from
            </Link>
          )}
        </section>
      )}

      {treatments.length > 0 && <TreatmentList treatments={treatments} />}
    </div>
  );
}
