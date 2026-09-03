import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TreatmentDetail } from "@/components/treatments/treatment-detail";
import { localToday } from "@/domain/time";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { listGroupOptionsForUser } from "@/server/treatments/groups";
import { getTreatmentDetail } from "@/server/treatments/queries";
import { getRequestClock } from "@/server/time/request-clock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Treatment" };
  const treatment = await prisma.treatment.findFirst({
    where: { id, userId: session.user.id },
    select: { name: true },
  });
  return { title: treatment?.name ?? "Treatment" };
}

export default async function TreatmentPage({
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

  const clock = await getRequestClock(now);
  const today = localToday(clock, session.user.timezone);
  const [detail, groupOptions] = await Promise.all([
    getTreatmentDetail(session.user.id, id, today),
    listGroupOptionsForUser(session.user.id),
  ]);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/treatments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Treatments
      </Link>
      <TreatmentDetail detail={detail} groupOptions={groupOptions} />
    </div>
  );
}
