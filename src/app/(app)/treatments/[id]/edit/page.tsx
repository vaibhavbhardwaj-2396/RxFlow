import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TreatmentWizard } from "@/components/treatments/treatment-wizard";
import {
  draftFromRecord,
  isCycleEditable,
} from "@/components/treatments/wizard-draft";
import { localToday } from "@/domain/time";
import type { TreatmentCategoryValue } from "@/lib/validation/treatment";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { updateTreatmentAction } from "@/server/treatments/edit";
import {
  doseSpecsFromRows,
  phaseCycleFromRows,
  recurrenceRuleFromRow,
} from "@/server/treatments/mappers";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Edit treatment" };

export default async function EditTreatmentPage({
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

  const [user, treatment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        timezone: true,
        settings: { select: { defaultTimes: true } },
      },
    }),
    prisma.treatment.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
      include: {
        recurrence: true,
        phaseCycle: {
          include: { phases: { orderBy: { orderIndex: "asc" } } },
        },
        doseTimes: { orderBy: { orderIndex: "asc" } },
      },
    }),
  ]);
  if (!user) redirect("/sign-in");
  if (!treatment?.recurrence || !treatment.phaseCycle) notFound();

  const clock = await getRequestClock(now);
  const today = localToday(clock, user.timezone);
  const defaultTimes = (user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;

  const cycle = phaseCycleFromRows(
    treatment.phaseCycle,
    treatment.phaseCycle.phases,
  );

  const back = (
    <Link
      href={`/treatments/${id}`}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {treatment.name}
    </Link>
  );

  if (!isCycleEditable(cycle)) {
    return (
      <div className="flex flex-col gap-5">
        {back}
        <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink-muted">
          Editing a repeating on/off cycle isn&rsquo;t available yet — it
          arrives with the cycle builder in a later milestone.
        </p>
      </div>
    );
  }

  const draft = draftFromRecord({
    name: treatment.name,
    category: treatment.category as TreatmentCategoryValue,
    instructionsText: treatment.instructionsText,
    doseText: treatment.doseText,
    anchorDate: treatment.anchorDate,
    recurrence: recurrenceRuleFromRow(treatment.recurrence),
    phaseCycle: cycle,
    doseTimes: doseSpecsFromRows(treatment.doseTimes),
  });

  return (
    <div className="flex flex-col gap-5">
      {back}
      <TreatmentWizard
        mode="edit"
        today={today}
        timezone={user.timezone}
        defaultTimes={defaultTimes}
        draft={draft}
        submit={updateTreatmentAction.bind(null, id)}
      />
    </div>
  );
}
