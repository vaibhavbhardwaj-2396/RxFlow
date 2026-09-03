"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { fileStore } from "@/server/storage";

export interface DeleteResult {
  error?: string;
}

/**
 * Permanently delete one treatment: the row plus everything derived from it —
 * recurrence, phase cycle, dose times, occurrences, adherence events, reminders,
 * and any notification-log rows that referenced those occurrences. If the
 * treatment's plan is left empty and has no source prescription, the plan goes
 * too. This is not "mark complete" — completion never deletes anything.
 */
export async function deleteTreatmentAction(id: string): Promise<DeleteResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  const treatment = await prisma.treatment.findFirst({
    where: { id, userId },
    select: {
      planId: true,
      occurrences: { select: { id: true } },
      plan: {
        select: {
          prescription: { select: { id: true } },
          _count: { select: { treatments: true } },
        },
      },
    },
  });
  if (!treatment) return { error: "That treatment was not found." };

  const occurrenceIds = treatment.occurrences.map((o) => o.id);
  const planNowEmpty =
    treatment.plan._count.treatments === 1 && !treatment.plan.prescription;

  await prisma.$transaction(async (tx) => {
    if (occurrenceIds.length > 0) {
      await tx.notificationLog.deleteMany({
        where: { occurrenceId: { in: occurrenceIds } },
      });
    }
    await tx.treatment.delete({ where: { id } });
    if (planNowEmpty) {
      await tx.treatmentPlan.delete({ where: { id: treatment.planId } });
    }
  });

  revalidatePath("/treatments");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  redirect("/treatments");
}

/**
 * Permanently delete one prescription: the DB rows (extractions + items cascade;
 * items' `treatmentId` is set null so the schedule survives) and the encrypted
 * file it points at.
 */
export async function deletePrescriptionAction(
  id: string,
): Promise<DeleteResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const prescription = await prisma.prescription.findFirst({
    where: { id, userId: session.user.id },
    select: { storageKey: true },
  });
  if (!prescription) return { error: "That prescription was not found." };

  await fileStore.delete(prescription.storageKey).catch(() => {});
  await prisma.prescription.delete({ where: { id } });

  revalidatePath("/prescriptions");
  redirect("/prescriptions");
}

/**
 * Permanently delete the whole account. Requires the user to retype their email.
 * Shreds every stored prescription file, then deletes the `User` row — which
 * cascades settings, plans, treatments, occurrences, adherence events,
 * reminders, notifications, push subscriptions and prescriptions. Finally signs
 * out and lands on `/goodbye`.
 */
export async function deleteAccountAction(
  confirmEmail: string,
): Promise<DeleteResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, prescriptions: { select: { storageKey: true } } },
  });
  if (!user) return { error: "Please sign in again." };

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { error: "That doesn't match your email." };
  }

  await Promise.all(
    user.prescriptions.map((p) =>
      fileStore.delete(p.storageKey).catch(() => {}),
    ),
  );
  await prisma.user.delete({ where: { id: session.user.id } });

  await signOut({ redirectTo: "/goodbye" });
  return {};
}
