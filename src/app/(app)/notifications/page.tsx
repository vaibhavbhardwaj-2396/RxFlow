import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarkAllRead } from "@/components/notifications/mark-all-read";
import { NotificationList } from "@/components/notifications/notification-list";
import { auth } from "@/server/auth";
import { getNotifications } from "@/server/notifications/queries";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const notifications = await getNotifications(session.user.id);
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <div className="flex flex-col gap-5">
      <MarkAllRead hasUnread={hasUnread} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Alerts
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          Notifications
        </h1>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
