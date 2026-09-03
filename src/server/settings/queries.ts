import type { QuietHours } from "@/domain/scheduling";
import { env, telegramEnabled, webPushEnabled } from "@/env";
import { prisma } from "@/server/db/client";

export interface AccountSettings {
  displayName: string;
  email: string;
  timezone: string;
  defaultTimes: Record<string, string>;
}

export async function getAccountSettings(
  userId: string,
): Promise<AccountSettings | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      email: true,
      timezone: true,
      settings: { select: { defaultTimes: true } },
    },
  });
  if (!user) return null;
  return {
    displayName: user.displayName ?? "",
    email: user.email,
    timezone: user.timezone,
    defaultTimes: (user.settings?.defaultTimes ?? {}) as Record<string, string>,
  };
}

export interface ReminderSettings {
  reminderLeadMinutes: number;
  quietHours: QuietHours | null;
  enabledChannels: string[];
  remindersEnabled: boolean;
  webPush: { enabled: boolean; subscribed: boolean };
  telegram: {
    enabled: boolean;
    connected: boolean;
    botUsername: string | null;
  };
}

export async function getReminderSettings(
  userId: string,
): Promise<ReminderSettings> {
  const [settings, pushCount, user] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.pushSubscription.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    }),
  ]);

  return {
    reminderLeadMinutes: settings?.reminderLeadMinutes ?? 15,
    quietHours: (settings?.quietHours as QuietHours | null) ?? null,
    enabledChannels: settings?.enabledChannels ?? ["in_app"],
    remindersEnabled: settings?.remindersEnabled ?? true,
    webPush: { enabled: webPushEnabled, subscribed: pushCount > 0 },
    telegram: {
      enabled: telegramEnabled,
      connected: Boolean(user?.telegramChatId),
      botUsername: env.TELEGRAM_BOT_USERNAME ?? null,
    },
  };
}
