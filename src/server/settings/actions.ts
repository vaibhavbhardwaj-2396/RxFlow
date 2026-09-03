"use server";

import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/env";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";

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
