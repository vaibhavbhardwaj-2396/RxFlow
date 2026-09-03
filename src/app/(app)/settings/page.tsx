import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DangerZone } from "@/components/settings/danger-zone";
import { DefaultTimesForm } from "@/components/settings/default-times-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { BrowserNotificationsToggle } from "@/components/settings/browser-notifications-toggle";
import { ReminderSettingsForm } from "@/components/settings/reminder-settings-form";
import { TelegramConnect } from "@/components/settings/telegram-connect";
import { auth } from "@/server/auth";
import {
  getAccountSettings,
  getReminderSettings,
} from "@/server/settings/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [account, reminders] = await Promise.all([
    getAccountSettings(session.user.id),
    getReminderSettings(session.user.id),
  ]);
  if (!account) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Settings
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          Settings
        </h1>
      </div>

      <ProfileForm settings={account} />
      <DefaultTimesForm settings={account} />

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold text-ink">
          Reminders
        </h2>
        <ReminderSettingsForm settings={reminders} />
        {reminders.webPush.enabled && (
          <BrowserNotificationsToggle
            subscribed={reminders.webPush.subscribed}
          />
        )}
        {reminders.telegram.enabled && (
          <TelegramConnect connected={reminders.telegram.connected} />
        )}
        {!reminders.webPush.enabled && !reminders.telegram.enabled && (
          <p className="text-xs text-ink-faint">
            Browser and Telegram notifications appear here once their keys are
            configured (see <code>.env.example</code>). In-app notifications
            always work.
          </p>
        )}
      </div>

      <DangerZone email={account.email} />
    </div>
  );
}
