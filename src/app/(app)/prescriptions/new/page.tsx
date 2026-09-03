import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { UploadForm } from "@/components/prescriptions/upload-form";
import { env } from "@/env";
import { auth } from "@/server/auth";

export const metadata: Metadata = { title: "Upload a prescription" };

export default async function NewPrescriptionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!env.FEATURE_PRESCRIPTION_UPLOAD) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/prescriptions"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Prescriptions
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Upload a prescription
      </h1>
      <UploadForm />
    </div>
  );
}
