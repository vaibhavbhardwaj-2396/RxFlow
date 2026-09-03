"use server";

import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/env";
import { auth, unstable_update } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { reresolveFutureOccurrences } from "@/server/occurrences/reresolve";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const settingsSchema = z.object({
  reminderLeadMinutes: z.number().int().min(0).max(240),
  quietStart: z.string().regex(HHMM).nullable(),
  quietEnd: z.string().regex(HHMM).nullable(),
  channels: z.array(z.enum(["in_app", "web_push", "telegram"])),
  remindersEnabled: z.boolean(),
});

export interface SettingsResult {
  error?: string;
}

export async function updateReminderSettingsAction(
  input: unknown,
): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Those settings look off." };
  const d = parsed.data;

  const quietHours =
    d.quietStart && d.quietEnd
      ? { start: d.quietStart, end: d.quietEnd }
      : null;

  await prisma.userSettings.update({
    where: { userId: session.user.id },
    data: {
      reminderLeadMinutes: d.reminderLeadMinutes,
      quietHours: quietHours ?? Prisma.JsonNull,
      enabledChannels: [...new Set(["in_app", ...d.channels])],
      remindersEnabled: d.remindersEnabled,
    },
  });

  revalidatePath("/settings");
  return {};
}

const profileSchema = z.object({
  displayName: z.string().trim().max(80),
  timezone: z
    .string()
    .min(1)
    .refine(
      (tz) => DateTime.local().setZone(tz).isValid,
      "That isn't a recognised timezone.",
    ),
});

export async function updateProfileAction(
  input: unknown,
): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { displayName, timezone } = parsed.data;
  const timezoneChanged = session.user.timezone !== timezone;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: displayName || null, timezone },
  });

  if (timezoneChanged) {
    await reresolveFutureOccurrences(session.user.id, {
      timezoneChanged: true,
    });
  }

  // Refresh the JWT-carried copy so pages don't need a re-login.
  await unstable_update({
    user: { timezone, displayName: displayName || null },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return {};
}

const defaultTimesSchema = z
  .record(
    z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,23}$/, "Use letters and digits."),
    z.string().regex(HHMM, "Use a 24-hour time like 08:00."),
  )
  .refine((m) => Object.keys(m).length >= 1, "Keep at least one time.")
  .refine((m) => Object.keys(m).length <= 12, "Twelve times is the maximum.");

export async function updateDefaultTimesAction(
  input: unknown,
): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const parsed = defaultTimesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the times." };
  }
  const next = parsed.data;

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { defaultTimes: true },
  });
  const prev = (settings?.defaultTimes ?? {}) as Record<string, string>;

  const changedAnchors = new Set<string>();
  for (const [slug, time] of Object.entries(next)) {
    if (prev[slug] !== time) changedAnchors.add(slug);
  }

  await prisma.userSettings.update({
    where: { userId: session.user.id },
    data: { defaultTimes: next as Prisma.InputJsonValue },
  });

  if (changedAnchors.size > 0) {
    await reresolveFutureOccurrences(session.user.id, { changedAnchors });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return {};
}

export async function startTelegramLinkAction(): Promise<{
  url?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  if (!env.TELEGRAM_BOT_USERNAME) return { error: "Telegram isn't set up." };

  const token = randomBytes(12).toString("hex");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramLinkToken: token },
  });
  return { url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${token}` };
}

export async function telegramStatusAction(): Promise<{ connected: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { connected: false };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramChatId: true },
  });
  return { connected: Boolean(user?.telegramChatId) };
}

export async function disconnectTelegramAction(): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramChatId: null, telegramLinkToken: null },
  });
  revalidatePath("/settings");
  return {};
}
