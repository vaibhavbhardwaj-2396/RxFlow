import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TreatmentWizard } from "@/components/treatments/treatment-wizard";
import { localToday } from "@/domain/time";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { createTreatmentAction } from "@/server/treatments/create";
import { listGroupOptionsForUser } from "@/server/treatments/groups";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Add treatment" };

export default async function NewTreatmentPage({
  searchParams,
}: {
  searchParams: Promise<{ now?: string }>;
}) {
  const { now } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      timezone: true,
      settings: { select: { defaultTimes: true } },
    },
  });
  if (!user) redirect("/sign-in");

  const clock = await getRequestClock(now);
  const today = localToday(clock, user.timezone);
  const defaultTimes = (user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;
  const groupOptions = await listGroupOptionsForUser(session.user.id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">Add a treatment</h1>
      <TreatmentWizard
        today={today}
        timezone={user.timezone}
        defaultTimes={defaultTimes}
        submit={createTreatmentAction}
        groupOptions={groupOptions}
        showGroupPicker
        exitHref="/treatments"
        exitLabel="Treatments"
      />
    </div>
  );
}
