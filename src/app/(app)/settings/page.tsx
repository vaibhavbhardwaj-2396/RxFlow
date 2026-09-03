import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrowserNotificationsToggle } from "@/components/settings/browser-notifications-toggle";
import { ReminderSettingsForm } from "@/components/settings/reminder-settings-form";
import { TelegramConnect } from "@/components/settings/telegram-connect";
import { auth } from "@/server/auth";
import { getReminderSettings } from "@/server/settings/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const settings = await getReminderSettings(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Settings
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          Reminders
        </h1>
      </div>

      <ReminderSettingsForm settings={settings} />

      {settings.webPush.enabled && (
        <BrowserNotificationsToggle subscribed={settings.webPush.subscribed} />
      )}
      {settings.telegram.enabled && (
        <TelegramConnect connected={settings.telegram.connected} />
      )}

      {!settings.webPush.enabled && !settings.telegram.enabled && (
        <p className="text-xs text-ink-faint">
          Browser and Telegram notifications appear here once their keys are
          configured (see <code>.env.example</code>). In-app notifications
          always work.
        </p>
      )}
    </div>
  );
}
