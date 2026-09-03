import { DateTime } from "luxon";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { NotificationRow } from "@/server/notifications/queries";

const CHANNEL_LABEL: Record<string, string> = {
  in_app: "In-app",
  web_push: "Browser",
  telegram: "Telegram",
};

function relativePath(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith("/") ? url : null;
  }
}

export function NotificationList({
  notifications,
}: {
  notifications: NotificationRow[];
}) {
  if (notifications.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
        No notifications yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((n) => {
        const href = relativePath(n.url);
        const inner = (
          <div
            className={cn(
              "rounded-xl border px-3 py-3",
              n.readAt
                ? "border-line bg-surface"
                : "border-accent/40 bg-accent-soft/40",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-ink">{n.title}</p>
              <span className="shrink-0 text-[0.6rem] uppercase tracking-wide text-ink-faint">
                {CHANNEL_LABEL[n.channel] ?? n.channel}
              </span>
            </div>
            <p className="text-sm text-ink-muted">{n.body}</p>
            <p className="mt-1 text-xs text-ink-faint">
              {DateTime.fromJSDate(n.createdAt).toRelative()}
            </p>
          </div>
        );
        return (
          <li key={n.id}>{href ? <Link href={href}>{inner}</Link> : inner}</li>
        );
      })}
    </ul>
  );
}
