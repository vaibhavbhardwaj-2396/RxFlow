import { type Prisma, PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

import type {
  DoseTimeSpec,
  PhaseCycle,
  RecurrenceRule,
} from "../src/domain/scheduling";
import { generateOccurrences } from "../src/domain/scheduling";
import { addDays, plainDate } from "../src/domain/time";
import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();

/**
 * Seed data for local development.
 *
 * The demo account carries the brief's Section 30 example domain, anchored to
 * Monday 7 September 2026 so every screen has real content. The plain dev
 * account is left empty to show the fresh-registration experience.
 */
const ANCHOR = "2026-09-07";
const TZ = "Asia/Kolkata";
const DEFAULT_TIMES: Record<string, string> = {
  morning: "08:00",
  breakfast: "08:30",
  lunch: "13:00",
  dinner: "20:00",
  beforeSleep: "22:30",
};

interface SeedAccount {
  email: string;
  password: string;
  displayName: string;
  isDemo?: boolean;
  section30?: boolean;
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: "demo@regimen.test",
    password: "regimen-demo",
    displayName: "Demo",
    isDemo: true,
    section30: true,
  },
  { email: "dev@regimen.test", password: "password123", displayName: "Dev" },
];

const anchor = () => plainDate(ANCHOR);

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

const SECTION_30: TreatmentSpec[] = [
  {
    name: "Multivitamin A",
    category: "supplement",
    instructionsText: "One tablet each morning with food, Monday to Friday.",
    doseText: "1 tablet",
    recurrence: {
      type: "specific_weekdays",
      anchor: anchor(),
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
    recurrence: { type: "interval_days", anchor: anchor(), interval: 2 },
    phaseCycle: foreverActive,
    doseTimes: [{ kind: "clock", value: "08:00" }],
  },
  {
    name: "Shampoo A",
    category: "topical",
    instructionsText: "Use 3–4 times a week.",
    doseText: "a coin-sized amount",
    recurrence: { type: "times_per_week", anchor: anchor(), count: 3 },
    phaseCycle: foreverActive,
    doseTimes: [{ kind: "clock", value: "21:00" }],
    needsConfirmation: true,
  },
  {
    name: "Shampoo B",
    category: "topical",
    instructionsText: "Twice weekly — Tuesday and Saturday evenings.",
    doseText: "a coin-sized amount",
    recurrence: {
      type: "specific_weekdays",
      anchor: anchor(),
      weekdays: [2, 6],
    },
    phaseCycle: foreverActive,
    doseTimes: [{ kind: "clock", value: "21:00" }],
  },
  {
    name: "Ointment A",
    category: "topical",
    instructionsText: "Apply a thin layer after dinner. Continue for 2 months.",
    doseText: "thin layer",
    recurrence: { type: "daily", anchor: anchor() },
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
    recurrence: { type: "daily", anchor: anchor() },
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

async function seedTreatment(userId: string, spec: TreatmentSpec) {
  const from = anchor();
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

  const plan = await prisma.treatmentPlan.create({
    data: { userId, title: spec.name },
  });

  const treatment = await prisma.treatment.create({
    data: {
      userId,
      planId: plan.id,
      name: spec.name,
      category: spec.category,
      instructionsText: spec.instructionsText,
      doseText: spec.doseText,
      anchorDate: ANCHOR,
      timezone: TZ,
      scheduleVersion: 1,
      status: spec.needsConfirmation ? "draft" : "active",
      confirmedAt: spec.needsConfirmation ? null : new Date(),
      recurrence: {
        create: {
          type: spec.recurrence.type,
          config: recurrenceConfig(spec.recurrence) as Prisma.InputJsonValue,
          recurrenceAnchor: ANCHOR,
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
    await prisma.scheduledOccurrence.createMany({
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

  console.log(
    `    + ${spec.name} — ${occurrences.length} occurrence${
      occurrences.length === 1 ? "" : "s"
    }`,
  );
}

async function main() {
  for (const account of ACCOUNTS) {
    await prisma.user.deleteMany({ where: { email: account.email } });
    const user = await prisma.user.create({
      data: {
        email: account.email,
        passwordHash: await hashPassword(account.password),
        displayName: account.displayName,
        isDemo: account.isDemo ?? false,
        emailVerified: new Date(),
        settings: { create: {} },
      },
    });
    console.log(`seeded ${user.email}${user.isDemo ? " (demo)" : ""}`);

    if (account.section30) {
      for (const spec of SECTION_30) {
        await seedTreatment(user.id, spec);
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
