"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createTreatmentSchema,
  fieldErrorsOf,
} from "@/lib/validation/treatment";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getRequestClock } from "@/server/time/request-clock";

import { persistTreatmentFromDraft, unknownDoseAnchor } from "./persist";

export interface CreateTreatmentResult {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Validate wizard input, generate the initial occurrence batch server-side
 * (never trusting the client's preview), persist the whole treatment in one
 * transaction, and redirect to the list.
 */
export async function createTreatmentAction(
  input: unknown,
): Promise<CreateTreatmentResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  const parsed = createTreatmentSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const data = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, settings: { select: { defaultTimes: true } } },
  });
  if (!user) return { error: "Please sign in again." };

  const defaultTimes = (user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;

  const badAnchor = unknownDoseAnchor(data.doseTimes, defaultTimes);
  if (badAnchor) {
    return {
      fieldErrors: {
        doseTimes: `You don't have a saved time for "${badAnchor}".`,
      },
    };
  }

  const clock = await getRequestClock();
  const now = clock.now().toJSDate();

  await prisma.$transaction(async (tx) => {
    const plan = await tx.treatmentPlan.create({
      data: { userId, title: data.name },
    });
    await persistTreatmentFromDraft(tx, {
      data,
      userId,
      planId: plan.id,
      timezone: user.timezone,
      defaultTimes,
      now,
    });
  });

  revalidatePath("/treatments");
  revalidatePath("/dashboard");
  redirect("/treatments");
}
