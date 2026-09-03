"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateOccurrences } from "@/domain/scheduling";
import { addDays, plainDate } from "@/domain/time";
import {
  INITIAL_HORIZON_DAYS,
  doseSpecsFromInput,
  phaseCycleFromInput,
  recurrenceRuleFromInput,
  toCreateData,
} from "@/lib/treatment-mapping";
import {
  createTreatmentSchema,
  fieldErrorsOf,
} from "@/lib/validation/treatment";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getRequestClock } from "@/server/time/request-clock";

import { occurrenceCreateRows } from "./mappers";

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

  const unknownAnchor = data.doseTimes.find(
    (d) => d.kind === "relative" && defaultTimes[d.anchor] === undefined,
  );
  if (unknownAnchor?.kind === "relative") {
    return {
      fieldErrors: {
        doseTimes: `You don't have a saved time for "${unknownAnchor.anchor}".`,
      },
    };
  }

  const clock = await getRequestClock();
  const anchor = plainDate(data.anchorDate);

  const occurrences = generateOccurrences({
    anchor,
    recurrenceRule: recurrenceRuleFromInput(data.recurrence, anchor),
    phaseCycle: phaseCycleFromInput(data.duration),
    doseTimes: doseSpecsFromInput(data.doseTimes),
    timezone: user.timezone,
    defaultTimes,
    scheduleVersion: 1,
    range: { from: anchor, to: addDays(anchor, INITIAL_HORIZON_DAYS) },
  });

  const nested = toCreateData({
    anchorDate: data.anchorDate,
    recurrence: data.recurrence,
    duration: data.duration,
    doseTimes: data.doseTimes,
  });

  await prisma.$transaction(async (tx) => {
    const plan = await tx.treatmentPlan.create({
      data: { userId, title: data.name },
    });

    const treatment = await tx.treatment.create({
      data: {
        userId,
        planId: plan.id,
        name: data.name,
        category: data.category,
        instructionsText: data.instructionsText,
        doseText: data.doseText,
        anchorDate: data.anchorDate,
        timezone: user.timezone,
        scheduleVersion: 1,
        status: "active",
        confirmedAt: clock.now().toJSDate(),
        recurrence: {
          create: {
            type: nested.recurrence.type,
            config: nested.recurrence.config as Prisma.InputJsonValue,
            recurrenceAnchor: nested.recurrence.recurrenceAnchor,
            needsConfirmation: nested.recurrence.needsConfirmation,
          },
        },
        phaseCycle: {
          create: {
            repeatMode: nested.phaseCycle.repeatMode,
            repeatCount: nested.phaseCycle.repeatCount,
            repeatUntil: nested.phaseCycle.repeatUntil,
            phases: { create: nested.phaseCycle.phases },
          },
        },
        doseTimes: { create: nested.doseTimes },
      },
    });

    if (occurrences.length > 0) {
      await tx.scheduledOccurrence.createMany({
        data: occurrenceCreateRows(occurrences, treatment.id, userId),
      });
    }
  });

  revalidatePath("/treatments");
  revalidatePath("/dashboard");
  redirect("/treatments");
}
