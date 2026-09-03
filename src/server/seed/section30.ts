import type { Prisma, PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

import {
  type DoseTimeSpec,
  type PhaseCycle,
  type RecurrenceRule,
  generateOccurrences,
} from "@/domain/scheduling";
import { addDays, plainDate } from "@/domain/time";
import { hashPassword } from "@/server/auth/password";

/**
 * The brief's "Section 30" example domain — six treatments covering every
 * scheduling shape (weekday set, alternate-day, times-per-week, a fixed 2-month
 * window, a 20/7/20 phase cycle). Shared by `prisma/seed.ts` (local dev) and the
 * `/api/internal/demo-reset` route (the live self-resetting demo).
 */

export { DEMO_EMAIL, DEMO_PASSWORD, DEMO_DISPLAY_NAME } from "./constants";

const TZ = "Asia/Kolkata";
const DEFAULT_TIMES: Record<string, string> = {
  morning: "08:00",
  breakfast: "08:30",
  lunch: "13:00",
  dinner: "20:00",
  beforeSleep: "22:30",
};

type Db = PrismaClient | Prisma.TransactionClient;

interface TreatmentSpec {
  name: string;
  category: "medication" | "supplement" | "topical" | "therapy" | "other";
  instructionsText: string;
  doseText: string;
  recurrence: RecurrenceRule;
  phaseCycle: PhaseCycle;
  doseTimes: DoseTimeSpec[];
  needsConfirmation?: boolean;
}

const foreverActive: PhaseCycle = {
  phases: [{ kind: "active", duration: { kind: "forever" } }],
  repeat: { mode: "once" },
};

function section30Specs(anchorISO: string): TreatmentSpec[] {
  const anchor = plainDate(anchorISO);
  return [
    {
      name: "Multivitamin A",
      category: "supplement",
      instructionsText: "One tablet each morning with food, Monday to Friday.",
      doseText: "1 tablet",
      recurrence: {
        type: "specific_weekdays",
        anchor,
        weekdays: [1, 2, 3, 4, 5],
      },
      phaseCycle: foreverActive,
      doseTimes: [{ kind: "clock", value: "08:00" }],
    },
    {
      name: "Multivitamin B",
      category: "supplement",
      instructionsText: "One tablet on alternate days, starting Monday.",
      doseText: "1 tablet",
      recurrence: { type: "interval_days", anchor, interval: 2 },
      phaseCycle: foreverActive,
      doseTimes: [{ kind: "clock", value: "08:00" }],
    },
    {
      name: "Shampoo A",
      category: "topical",
      instructionsText: "Use 3–4 times a week.",
      doseText: "a coin-sized amount",
      recurrence: { type: "times_per_week", anchor, count: 3 },
      phaseCycle: foreverActive,
      doseTimes: [{ kind: "clock", value: "21:00" }],
      needsConfirmation: true,
    },
    {
      name: "Shampoo B",
      category: "topical",
      instructionsText: "Twice weekly — Tuesday and Saturday evenings.",
      doseText: "a coin-sized amount",
      recurrence: { type: "specific_weekdays", anchor, weekdays: [2, 6] },
      phaseCycle: foreverActive,
      doseTimes: [{ kind: "clock", value: "21:00" }],
    },
    {
      name: "Ointment A",
      category: "topical",
      instructionsText:
        "Apply a thin layer after dinner. Continue for 2 months.",
      doseText: "thin layer",
      recurrence: { type: "daily", anchor },
      phaseCycle: {
        phases: [{ kind: "active", duration: { kind: "months", value: 2 } }],
        repeat: { mode: "once" },
      },
      doseTimes: [{ kind: "relative", anchor: "dinner" }],
    },
    {
      name: "Ointment B",
      category: "topical",
      instructionsText:
        "Apply every night for 20 days, then a 7-day break, then another 20 days.",
      doseText: "thin layer",
      recurrence: { type: "daily", anchor },
      phaseCycle: {
        phases: [
          { kind: "active", duration: { kind: "days", value: 20 } },
          { kind: "break", duration: { kind: "days", value: 7 } },
          { kind: "active", duration: { kind: "days", value: 20 } },
        ],
        repeat: { mode: "once" },
      },
      doseTimes: [{ kind: "clock", value: "22:00" }],
    },
  ];
}

function recurrenceConfig(rule: RecurrenceRule): Record<string, unknown> {
  switch (rule.type) {
    case "daily":
      return {};
    case "specific_weekdays":
      return { weekdays: rule.weekdays };
    case "interval_days":
      return { interval: rule.interval };
    case "times_per_week":
      return rule.weekdays
        ? { count: rule.count, weekdays: rule.weekdays }
        : { count: rule.count };
  }
}

async function seedTreatment(
  db: Db,
  userId: string,
  spec: TreatmentSpec,
  anchorISO: string,
) {
  const from = plainDate(anchorISO);
  const occurrences = spec.needsConfirmation
    ? []
    : generateOccurrences({
        anchor: from,
        recurrenceRule: spec.recurrence,
        phaseCycle: spec.phaseCycle,
        doseTimes: spec.doseTimes,
        timezone: TZ,
        defaultTimes: DEFAULT_TIMES,
        scheduleVersion: 1,
        range: { from, to: addDays(from, 90) },
      });

  const plan = await db.treatmentPlan.create({
    data: { userId, title: spec.name },
  });

  const treatment = await db.treatment.create({
    data: {
      userId,
      planId: plan.id,
      name: spec.name,
      category: spec.category,
      instructionsText: spec.instructionsText,
      doseText: spec.doseText,
      anchorDate: anchorISO,
      timezone: TZ,
      scheduleVersion: 1,
      status: spec.needsConfirmation ? "draft" : "active",
      confirmedAt: spec.needsConfirmation ? null : new Date(),
      recurrence: {
        create: {
          type: spec.recurrence.type,
          config: recurrenceConfig(spec.recurrence) as Prisma.InputJsonValue,
          recurrenceAnchor: anchorISO,
          needsConfirmation: spec.needsConfirmation ?? false,
        },
      },
      phaseCycle: {
        create: {
          repeatMode: spec.phaseCycle.repeat.mode,
          repeatCount:
            spec.phaseCycle.repeat.mode === "count"
              ? spec.phaseCycle.repeat.count
              : null,
          repeatUntil:
            spec.phaseCycle.repeat.mode === "until"
              ? spec.phaseCycle.repeat.date
              : null,
          phases: {
            create: spec.phaseCycle.phases.map((p, orderIndex) => ({
              orderIndex,
              kind: p.kind,
              durationKind: p.duration.kind,
              durationValue: "value" in p.duration ? p.duration.value : null,
              durationUntil:
                p.duration.kind === "until" ? p.duration.date : null,
            })),
          },
        },
      },
      doseTimes: {
        create: spec.doseTimes.map((d, orderIndex) => ({
          orderIndex,
          kind: d.kind,
          clockValue: d.kind === "clock" ? d.value : null,
          relativeAnchor: d.kind === "relative" ? d.anchor : null,
        })),
      },
    },
  });

  if (occurrences.length > 0) {
    await db.scheduledOccurrence.createMany({
      data: occurrences.map((o) => ({
        treatmentId: treatment.id,
        userId,
        scheduledAt: DateTime.fromISO(o.scheduledAt).toJSDate(),
        localDate: o.localDate,
        localTime: o.localTime,
        timezone: o.timezone,
        timeSpecSnapshot: o.timeSpecSnapshot as Prisma.InputJsonValue,
        phaseIndex: o.phaseIndex,
        scheduleVersion: o.scheduleVersion,
        status: "scheduled",
      })),
    });
  }

  return { name: spec.name, occurrences: occurrences.length };
}

export interface ReseedAccountInput {
  email: string;
  password: string;
  displayName: string;
  isDemo?: boolean;
  withSection30?: boolean;
  /** "YYYY-MM-DD" the treatments are anchored to. */
  anchorDate: string;
}

/**
 * Delete a user by email (cascading everything they own) and recreate them,
 * optionally with the full Section 30 treatment set. Idempotent — safe to run
 * repeatedly. Never touches any other user.
 */
export async function reseedAccount(
  db: Db,
  input: ReseedAccountInput,
): Promise<{ email: string; treatments: number }> {
  await db.user.deleteMany({ where: { email: input.email } });
  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName,
      isDemo: input.isDemo ?? false,
      emailVerified: new Date(),
      settings: { create: {} },
    },
  });

  let treatments = 0;
  if (input.withSection30) {
    for (const spec of section30Specs(input.anchorDate)) {
      const result = await seedTreatment(db, user.id, spec, input.anchorDate);
      treatments += 1;
      console.log(`    + ${result.name} — ${result.occurrences} occurrences`);
    }
  }
  return { email: user.email, treatments };
}
