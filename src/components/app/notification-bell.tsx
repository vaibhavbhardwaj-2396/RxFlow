import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={
        count > 0 ? `Notifications, ${count} unread` : "Notifications"
      }
      className="relative rounded-md p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-semibold text-accent-ink">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
