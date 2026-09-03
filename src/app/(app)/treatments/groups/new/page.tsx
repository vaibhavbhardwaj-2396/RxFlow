import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GroupForm } from "@/components/treatments/group-form";
import { auth } from "@/server/auth";

export const metadata: Metadata = { title: "New group" };

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const { assign } = await searchParams;

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
        New group
      </h1>
      <GroupForm assignTreatmentId={assign} />
    </div>
  );
}
