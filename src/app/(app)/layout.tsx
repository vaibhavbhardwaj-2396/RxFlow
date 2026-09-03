import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BottomNav } from "@/components/app/bottom-nav";
import { NotificationBell } from "@/components/app/notification-bell";
import { PushRegistrar } from "@/components/app/push-registrar";
import { SignOutButton } from "@/components/app/sign-out-button";
import { localToday } from "@/domain/time";
import { isProd } from "@/env";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { unreadNotificationCount } from "@/server/notifications/queries";
import { getRequestClock, getSimNow } from "@/server/time/request-clock";

const DevToolbar = isProd
  ? null
  : dynamic(() =>
      import("@/components/dev/dev-toolbar").then((m) => m.DevToolbar),
    );

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, email: true, timezone: true, isDemo: true },
  });
  if (!user) redirect("/sign-in");

  const clock = await getRequestClock();
  const effectiveDate = localToday(clock, user.timezone);
  const simNow = await getSimNow();
  const unread = await unreadNotificationCount(session.user.id);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <PushRegistrar />
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-ink">
            Regimen
          </span>
          {user.isDemo && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="hidden sm:inline">
            {user.displayName ?? user.email}
          </span>
          <NotificationBell count={unread} />
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 px-4 py-5">{children}</main>

      {DevToolbar && (
        <div className="pointer-events-none sticky bottom-16 z-30 flex justify-center px-4">
          <Suspense fallback={null}>
            <DevToolbar simNow={simNow} effectiveDate={effectiveDate} />
          </Suspense>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
