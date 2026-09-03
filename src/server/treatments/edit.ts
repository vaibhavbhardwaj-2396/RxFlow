"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateOccurrences } from "@/domain/scheduling";
import { addDays, localToday, maxDate, plainDate } from "@/domain/time";
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

export interface UpdateTreatmentResult {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Apply an edit to an existing treatment. The recurrence anchor is fixed, so the
 * start date can't move; regeneration runs from today forward. Past occurrences
 * and every AdherenceEvent are left untouched — only future un-actioned
 * occurrences are replaced, and the treatment's scheduleVersion is bumped.
 */
export async function updateTreatmentAction(
  id: string,
  input: unknown,
): Promise<UpdateTreatmentResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  const treatment = await prisma.treatment.findFirst({
    where: { id, userId },
    select: {
      scheduleVersion: true,
      anchorDate: true,
      timezone: true,
      phaseCycle: { select: { id: true } },
    },
  });
  if (!treatment?.phaseCycle) {
    return { error: "That treatment could not be found." };
  }

  const parsed = createTreatmentSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const data = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: { select: { defaultTimes: true } } },
  });
  const defaultTimes = (user?.settings?.defaultTimes ?? {}) as Record<
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

  const anchor = plainDate(treatment.anchorDate); // fixed — ignore input.anchorDate
  const newVersion = treatment.scheduleVersion + 1;
  const clock = await getRequestClock();
  const today = plainDate(localToday(clock, treatment.timezone));
  const from = maxDate(today, anchor);

  const occurrences = generateOccurrences({
    anchor,
    recurrenceRule: recurrenceRuleFromInput(data.recurrence, anchor),
    phaseCycle: phaseCycleFromInput(data.window),
    doseTimes: doseSpecsFromInput(data.doseTimes),
    timezone: treatment.timezone,
    defaultTimes,
    scheduleVersion: newVersion,
    range: { from, to: addDays(from, INITIAL_HORIZON_DAYS) },
  });

  const nested = toCreateData({
    anchorDate: treatment.anchorDate,
    recurrence: data.recurrence,
    window: data.window,
    doseTimes: data.doseTimes,
  });
  const cycleId = treatment.phaseCycle.id;

  await prisma.$transaction(async (tx) => {
    await tx.treatment.update({
      where: { id },
      data: {
        name: data.name,
        medicineName: data.medicineName ?? null,
        category: data.category,
        instructionsText: data.instructionsText ?? null,
        doseText: data.doseText ?? null,
        scheduleVersion: newVersion,
        status: nested.recurrence.needsConfirmation ? "draft" : "active",
      },
    });

    await tx.recurrenceRule.update({
      where: { treatmentId: id },
      data: {
        type: nested.recurrence.type,
        config: nested.recurrence.config as Prisma.InputJsonValue,
        recurrenceAnchor: nested.recurrence.recurrenceAnchor,
        needsConfirmation: nested.recurrence.needsConfirmation,
      },
    });

    await tx.phaseCycle.update({
      where: { id: cycleId },
      data: {
        repeatMode: nested.phaseCycle.repeatMode,
        repeatCount: nested.phaseCycle.repeatCount,
        repeatUntil: nested.phaseCycle.repeatUntil,
      },
    });
    await tx.treatmentPhase.deleteMany({ where: { phaseCycleId: cycleId } });
    await tx.treatmentPhase.createMany({
      data: nested.phaseCycle.phases.map((p) => ({
        ...p,
        phaseCycleId: cycleId,
      })),
    });

    await tx.doseTime.deleteMany({ where: { treatmentId: id } });
    await tx.doseTime.createMany({
      data: nested.doseTimes.map((d) => ({ ...d, treatmentId: id })),
    });

    await tx.scheduledOccurrence.deleteMany({
      where: {
        treatmentId: id,
        status: { in: ["scheduled", "reminder_sent"] },
        localDate: { gte: from },
      },
    });

    const survivors = await tx.scheduledOccurrence.findMany({
      where: { treatmentId: id, localDate: { gte: from } },
      select: { localDate: true, localTime: true },
    });
    const taken = new Set(
      survivors.map((s) => `${s.localDate}T${s.localTime}`),
    );

    const rows = occurrenceCreateRows(occurrences, id, userId).filter(
      (r) => !taken.has(`${r.localDate}T${r.localTime}`),
    );
    if (rows.length > 0) {
      await tx.scheduledOccurrence.createMany({ data: rows });
    }
  });

  revalidatePath("/treatments");
  revalidatePath(`/treatments/${id}`);
  revalidatePath("/dashboard");
  redirect(`/treatments/${id}`);
}
