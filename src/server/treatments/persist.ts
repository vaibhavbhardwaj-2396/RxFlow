import type { Prisma } from "@prisma/client";

import { generateOccurrences } from "@/domain/scheduling";
import { addDays, plainDate } from "@/domain/time";
import {
  INITIAL_HORIZON_DAYS,
  doseSpecsFromInput,
  phaseCycleFromInput,
  recurrenceRuleFromInput,
  toCreateData,
} from "@/lib/treatment-mapping";
import type { CreateTreatmentInput } from "@/lib/validation/treatment";

import { occurrenceCreateRows } from "./mappers";

/** A relative dose time whose anchor the user has no saved time for. */
export function unknownDoseAnchor(
  doseTimes: CreateTreatmentInput["doseTimes"],
  defaultTimes: Record<string, string>,
): string | undefined {
  const missing = doseTimes.find(
    (d) => d.kind === "relative" && defaultTimes[d.anchor] === undefined,
  );
  return missing?.kind === "relative" ? missing.anchor : undefined;
}

/** Generate the initial occurrence batch a fresh treatment persists. */
export function generateInitialOccurrences(
  data: CreateTreatmentInput,
  timezone: string,
  defaultTimes: Record<string, string>,
) {
  const anchor = plainDate(data.anchorDate);
  return generateOccurrences({
    anchor,
    recurrenceRule: recurrenceRuleFromInput(data.recurrence, anchor),
    phaseCycle: phaseCycleFromInput(data.window),
    doseTimes: doseSpecsFromInput(data.doseTimes),
    timezone,
    defaultTimes,
    scheduleVersion: 1,
    range: { from: anchor, to: addDays(anchor, INITIAL_HORIZON_DAYS) },
  });
}

export interface PersistTreatmentArgs {
  data: CreateTreatmentInput;
  userId: string;
  planId: string;
  timezone: string;
  defaultTimes: Record<string, string>;
  /** The request clock's "now" — used for `confirmedAt`. */
  now: Date;
}

export interface PersistedTreatment {
  treatmentId: string;
  occurrenceCount: number;
  /** A bare "N times a week" with no chosen days — stays `draft` until confirmed. */
  unconfirmed: boolean;
}

/**
 * Write one treatment (recurrence + phase cycle + dose times) and its initial
 * occurrence batch inside an existing transaction. Shared by manual creation
 * ({@link ./create}) and the prescription plan builder
 * ({@link ../prescriptions/actions}).
 */
export async function persistTreatmentFromDraft(
  tx: Prisma.TransactionClient,
  { data, userId, planId, timezone, defaultTimes, now }: PersistTreatmentArgs,
): Promise<PersistedTreatment> {
  const occurrences = generateInitialOccurrences(data, timezone, defaultTimes);
  const nested = toCreateData({
    anchorDate: data.anchorDate,
    recurrence: data.recurrence,
    window: data.window,
    doseTimes: data.doseTimes,
  });
  const unconfirmed = nested.recurrence.needsConfirmation;

  const treatment = await tx.treatment.create({
    data: {
      userId,
      planId,
      name: data.name,
      medicineName: data.medicineName ?? null,
      category: data.category,
      instructionsText: data.instructionsText,
      doseText: data.doseText,
      anchorDate: data.anchorDate,
      timezone,
      scheduleVersion: 1,
      status: unconfirmed ? "draft" : "active",
      confirmedAt: unconfirmed ? null : now,
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
    select: { id: true },
  });

  if (occurrences.length > 0) {
    await tx.scheduledOccurrence.createMany({
      data: occurrenceCreateRows(occurrences, treatment.id, userId),
    });
  }

  return {
    treatmentId: treatment.id,
    occurrenceCount: occurrences.length,
    unconfirmed,
  };
}
