"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/env";
import {
  createTreatmentSchema,
  fieldErrorsOf,
} from "@/lib/validation/treatment";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { manualParser } from "@/server/prescriptions/parser";
import {
  persistTreatmentFromDraft,
  unknownDoseAnchor,
} from "@/server/treatments/persist";
import { getRequestClock } from "@/server/time/request-clock";

export interface ConfirmPlanResult {
  error?: string;
  /** Per-card wizard field errors, keyed by card index. */
  itemErrors?: Record<number, Record<string, string>>;
}

const confirmSchema = z.object({
  prescriptionId: z.string().min(1),
  note: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        draft: z.unknown(),
        ambiguityFlags: z.array(z.string().trim().max(300)).max(20).default([]),
        acknowledged: z.boolean(),
      }),
    )
    .min(1, "Add at least one treatment from the prescription.")
    .max(20, "That's more treatments than one plan should hold."),
});

/**
 * Turn the reviewed prescription cards into a treatment plan: one plan, one
 * `PrescriptionExtraction` audit row (parser "manual"), and one active treatment
 * + occurrence batch per card. The source document and every card are kept.
 */
export async function confirmPrescriptionPlanAction(
  input: unknown,
): Promise<ConfirmPlanResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  if (!env.FEATURE_PRESCRIPTION_UPLOAD) {
    return { error: "Prescription upload is not enabled here." };
  }

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { prescriptionId, note, items } = parsed.data;

  if (items.some((it) => !it.acknowledged)) {
    return {
      error: "Confirm you've checked every card against your prescription.",
    };
  }

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: prescriptionId,
      userId,
      status: { in: ["uploaded", "in_review"] },
    },
    select: { id: true, originalName: true },
  });
  if (!prescription) {
    return { error: "That prescription can't be turned into a plan." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, settings: { select: { defaultTimes: true } } },
  });
  if (!user) return { error: "Please sign in again." };
  const defaultTimes = (user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;

  // Validate every card up front — nothing is written unless all pass.
  const itemErrors: Record<number, Record<string, string>> = {};
  const drafts: z.infer<typeof createTreatmentSchema>[] = [];
  items.forEach((it, i) => {
    const result = createTreatmentSchema.safeParse(it.draft);
    if (!result.success) {
      itemErrors[i] = fieldErrorsOf(result.error);
      return;
    }
    const badAnchor = unknownDoseAnchor(result.data.doseTimes, defaultTimes);
    if (badAnchor) {
      itemErrors[i] = {
        doseTimes: `You don't have a saved time for "${badAnchor}".`,
      };
      return;
    }
    drafts.push(result.data);
  });
  if (Object.keys(itemErrors).length > 0) return { itemErrors };

  const now = (await getRequestClock()).now().toJSDate();
  const planTitle =
    prescription.originalName?.replace(/\.[^.]+$/, "").trim() ||
    (drafts.length === 1 ? drafts[0].name : "Prescription plan");

  await prisma.$transaction(async (tx) => {
    const plan = await tx.treatmentPlan.create({
      data: { userId, title: planTitle },
    });

    const attempt =
      (await tx.prescriptionExtraction.count({ where: { prescriptionId } })) +
      1;
    const extraction = await tx.prescriptionExtraction.create({
      data: {
        prescriptionId,
        attempt,
        parserName: manualParser.name,
        parserVersion: manualParser.version,
        status: "ok",
        structured: {
          items: items.map((it) => it.draft),
        } as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    for (let i = 0; i < drafts.length; i += 1) {
      const { treatmentId } = await persistTreatmentFromDraft(tx, {
        data: drafts[i],
        userId,
        planId: plan.id,
        timezone: user.timezone,
        defaultTimes,
        now,
      });
      await tx.prescriptionItem.create({
        data: {
          prescriptionId,
          extractionId: extraction.id,
          orderIndex: i,
          extractedFields: items[i].draft as Prisma.InputJsonValue,
          ambiguityFlags: items[i].ambiguityFlags,
          status: "accepted",
          treatmentId,
        },
      });
    }

    await tx.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: "confirmed",
        planId: plan.id,
        ...(note !== undefined ? { note } : {}),
      },
    });
  });

  revalidatePath("/treatments");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/prescriptions");
  redirect("/treatments");
}

export async function updatePrescriptionNoteAction(
  id: string,
  note: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const trimmed = note.trim().slice(0, 2000);
  const result = await prisma.prescription.updateMany({
    where: { id, userId: session.user.id },
    data: { note: trimmed || null },
  });
  if (result.count === 0) return { error: "That prescription was not found." };
  revalidatePath("/prescriptions");
  revalidatePath(`/prescriptions/${id}`);
  return {};
}

export async function archivePrescriptionAction(
  id: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const result = await prisma.prescription.updateMany({
    where: { id, userId: session.user.id },
    data: { status: "archived" },
  });
  if (result.count === 0) return { error: "That prescription was not found." };
  revalidatePath("/prescriptions");
  return {};
}
