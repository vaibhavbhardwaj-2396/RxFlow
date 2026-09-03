import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GroupForm } from "@/components/treatments/group-form";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";

export const metadata: Metadata = { title: "Edit group" };

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const group = await prisma.treatmentPlan.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      kind: true,
      color: true,
      archivedAt: true,
      _count: { select: { treatments: true } },
    },
  });
  if (!group) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/treatments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Treatments
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Edit group
      </h1>
      <GroupForm
        group={{
          id: group.id,
          title: group.title,
          kind: group.kind,
          color: group.color,
          archived: group.archivedAt != null,
          treatmentCount: group._count.treatments,
        }}
      />
    </div>
  );
}
