import { DateTime } from "luxon";

import {
  type OccurrenceStatus,
  applyAdherenceAction,
} from "@/domain/adherence";
import {
  type QuietHours,
  generateOccurrences,
  reminderFireAt,
} from "@/domain/scheduling";
import { addDays, localToday, maxDate, plainDate } from "@/domain/time";
import { telegramEnabled } from "@/env";
import { INITIAL_HORIZON_DAYS } from "@/lib/treatment-mapping";
import { prisma } from "@/server/db/client";
import { deliver } from "@/server/notifications/dispatch";
import { reminderPayload } from "@/server/notifications/payload";
import { telegramApi } from "@/server/notifications/telegram";
import {
  doseSpecsFromRows,
  occurrenceCreateRows,
  phaseCycleFromRows,
  recurrenceRuleFromRow,
} from "@/server/treatments/mappers";

export interface TickSummary {
  missed: number;
  remindersCreated: number;
  remindersSent: number;
  occurrencesAdded: number;
  telegramLinked: number;
}

const MATERIALISE_AHEAD_HOURS = 36;
const MAX_STALE_REMINDER_HOURS = 6;
const HORIZON_REFILL_DAYS = 30;
const MAX_ATTEMPTS = 3;
const ACTIONABLE: OccurrenceStatus[] = ["scheduled", "reminder_sent"];

/** One pass of the background job. Every step is idempotent. */
export async function runTick(nowInput?: Date): Promise<TickSummary> {
  const now = nowInput ?? new Date();
  const nowDt = DateTime.fromJSDate(now, { zone: "utc" });

  return {
    missed: await sweepMissed(now, nowDt),
    remindersCreated: await materialiseReminders(nowDt),
    remindersSent: await dispatchDue(now),
    occurrencesAdded: await extendHorizon(nowDt),
    telegramLinked: telegramEnabled ? await pollTelegram() : 0,
  };
}

async function sweepMissed(now: Date, nowDt: DateTime): Promise<number> {
  const clock = { now: () => nowDt };
  const rows = await prisma.scheduledOccurrence.findMany({
    where: {
      status: { in: ACTIONABLE },
      scheduledAt: { lt: now },
    },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      localDate: true,
      userId: true,
      user: {
        select: {
          timezone: true,
          settings: { select: { missedGraceMinutes: true } },
        },
      },
    },
    take: 5000,
  });

  let count = 0;
  for (const o of rows) {
    const grace = o.user.settings?.missedGraceMinutes ?? 0;
    const overdue =
      grace > 0
        ? o.scheduledAt.getTime() + grace * 60_000 < now.getTime()
        : o.localDate < localToday(clock, o.user.timezone);
    if (!overdue) continue;

    applyAdherenceAction(o.status as "scheduled" | "reminder_sent", "miss");
    await prisma.$transaction([
      prisma.adherenceEvent.create({
        data: {
          occurrenceId: o.id,
          userId: o.userId,
          type: "missed",
          effectiveAt: o.scheduledAt,
          source: "tick",
        },
      }),
      prisma.scheduledOccurrence.update({
        where: { id: o.id },
        data: { status: "missed" },
      }),
      prisma.reminder.updateMany({
        where: { occurrenceId: o.id, status: "pending" },
        data: { status: "cancelled" },
      }),
    ]);
    count += 1;
  }
  return count;
}

async function materialiseReminders(nowDt: DateTime): Promise<number> {
  const now = nowDt.toJSDate();
  const ahead = nowDt.plus({ hours: MATERIALISE_AHEAD_HOURS }).toJSDate();
  const stale = nowDt.minus({ hours: MAX_STALE_REMINDER_HOURS });

  const occurrences = await prisma.scheduledOccurrence.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { gte: now, lte: ahead },
      reminder: { is: null },
      treatment: {
        remindersEnabled: true,
        user: { settings: { remindersEnabled: true } },
      },
    },
    select: {
      id: true,
      scheduledAt: true,
      userId: true,
      treatment: { select: { timezone: true } },
      user: {
        select: {
          settings: {
            select: { reminderLeadMinutes: true, quietHours: true },
          },
        },
      },
    },
    take: 2000,
  });

  const data = occurrences.flatMap((o) => {
    const settings = o.user.settings;
    const fireAt = reminderFireAt(
      DateTime.fromJSDate(o.scheduledAt, { zone: "utc" }),
      settings?.reminderLeadMinutes ?? 15,
      (settings?.quietHours as QuietHours | null) ?? null,
      o.treatment.timezone,
    );
    if (fireAt < stale) return [];
    return [
      { occurrenceId: o.id, userId: o.userId, fireAt: fireAt.toJSDate() },
    ];
  });

  if (data.length === 0) return 0;
  const result = await prisma.reminder.createMany({
    data,
    skipDuplicates: true,
  });
  return result.count;
}

async function dispatchDue(now: Date): Promise<number> {
  const due = await prisma.reminder.findMany({
    where: {
      status: "pending",
      fireAt: { lte: now },
      attemptCount: { lt: MAX_ATTEMPTS },
    },
    select: {
      id: true,
      userId: true,
      occurrenceId: true,
      attemptCount: true,
      occurrence: {
        select: {
          status: true,
          localTime: true,
          treatmentId: true,
          treatment: { select: { name: true } },
        },
      },
      user: { select: { settings: { select: { enabledChannels: true } } } },
    },
    take: 500,
  });

  let sent = 0;
  for (const reminder of due) {
    if (!ACTIONABLE.includes(reminder.occurrence.status)) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "cancelled" },
      });
      continue;
    }

    const payload = reminderPayload({
      treatmentName: reminder.occurrence.treatment.name,
      localTime: reminder.occurrence.localTime,
      treatmentId: reminder.occurrence.treatmentId,
    });

    try {
      await deliver(
        reminder.userId,
        payload,
        {
          occurrenceId: reminder.occurrenceId,
          enabledChannels: reminder.user.settings?.enabledChannels ?? [
            "in_app",
          ],
        },
        now,
      );
      await prisma.$transaction([
        prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "sent", attemptCount: reminder.attemptCount + 1 },
        }),
        prisma.scheduledOccurrence.updateMany({
          where: { id: reminder.occurrenceId, status: "scheduled" },
          data: { status: "reminder_sent" },
        }),
      ]);
      sent += 1;
    } catch {
      const nextAttempt = reminder.attemptCount + 1;
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          attemptCount: nextAttempt,
          status: nextAttempt >= MAX_ATTEMPTS ? "failed" : "pending",
        },
      });
    }
  }
  return sent;
}

async function extendHorizon(nowDt: DateTime): Promise<number> {
  const today = plainDate(nowDt.toISODate() ?? "");
  const refillBy = addDays(today, HORIZON_REFILL_DAYS);

  const treatments = await prisma.treatment.findMany({
    where: { status: "active" },
    select: {
      id: true,
      userId: true,
      anchorDate: true,
      timezone: true,
      scheduleVersion: true,
      recurrence: true,
      phaseCycle: {
        include: { phases: { orderBy: { orderIndex: "asc" } } },
      },
      doseTimes: { orderBy: { orderIndex: "asc" } },
      user: { select: { settings: { select: { defaultTimes: true } } } },
      occurrences: {
        orderBy: { localDate: "desc" },
        take: 1,
        select: { localDate: true },
      },
    },
  });

  let added = 0;
  for (const t of treatments) {
    if (!t.recurrence || !t.phaseCycle) continue;
    const last = t.occurrences[0]?.localDate;
    if (last && last >= refillBy) continue;

    const from = last ? maxDate(today, addDays(plainDate(last), 1)) : today;
    const anchor = plainDate(t.anchorDate);
    const defaultTimes = (t.user.settings?.defaultTimes ?? {}) as Record<
      string,
      string
    >;

    const generated = generateOccurrences({
      anchor,
      recurrenceRule: recurrenceRuleFromRow(t.recurrence),
      phaseCycle: phaseCycleFromRows(t.phaseCycle, t.phaseCycle.phases),
      doseTimes: doseSpecsFromRows(t.doseTimes),
      timezone: t.timezone,
      defaultTimes,
      scheduleVersion: t.scheduleVersion,
      range: { from, to: addDays(from, INITIAL_HORIZON_DAYS) },
    });
    if (generated.length === 0) continue;

    const existing = await prisma.scheduledOccurrence.findMany({
      where: { treatmentId: t.id, localDate: { gte: from } },
      select: { localDate: true, localTime: true },
    });
    const taken = new Set(existing.map((e) => `${e.localDate}T${e.localTime}`));
    const rows = occurrenceCreateRows(generated, t.id, t.userId).filter(
      (r) => !taken.has(`${r.localDate}T${r.localTime}`),
    );
    if (rows.length > 0) {
      const result = await prisma.scheduledOccurrence.createMany({
        data: rows,
      });
      added += result.count;
    }
  }
  return added;
}

async function pollTelegram(): Promise<number> {
  const KEY = "telegram_offset";
  const state = await prisma.systemState.findUnique({ where: { key: KEY } });
  const offset = typeof state?.value === "number" ? state.value : 0;

  const res = await telegramApi("getUpdates", {
    ...(offset ? { offset: offset + 1 } : {}),
    timeout: 0,
    allowed_updates: ["message"],
  });
  if (!res.ok || !Array.isArray(res.result)) return 0;

  const updates = res.result as Array<{
    update_id: number;
    message?: { chat?: { id: number }; text?: string };
  }>;

  let linked = 0;
  let newOffset = offset;
  for (const update of updates) {
    newOffset = Math.max(newOffset, update.update_id);
    const match = (update.message?.text ?? "").match(/^\/start\s+(\S+)/);
    const chatId = update.message?.chat?.id;
    if (!match || !chatId) continue;

    const user = await prisma.user.findUnique({
      where: { telegramLinkToken: match[1] },
      select: { id: true },
    });
    if (!user) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: String(chatId), telegramLinkToken: null },
    });
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "✓ Connected to RxFlow — dose reminders will arrive here.",
    });
    linked += 1;
  }

  if (newOffset !== offset) {
    await prisma.systemState.upsert({
      where: { key: KEY },
      create: { key: KEY, value: newOffset },
      update: { value: newOffset },
    });
  }
  return linked;
}
