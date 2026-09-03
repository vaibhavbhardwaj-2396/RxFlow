import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BottomNav } from "@/components/app/bottom-nav";
import { NotificationBell } from "@/components/app/notification-bell";
import { PushRegistrar } from "@/components/app/push-registrar";
import { SignOutButton } from "@/components/app/sign-out-button";
import { localToday } from "@/domain/time";
import { env, isProd } from "@/env";
import { auth } from "@/server/auth";
import { unreadNotificationCount } from "@/server/notifications/queries";
import { getRequestClock, getSimNow } from "@/server/time/request-clock";

const DevToolbar = isProd
  ? null
  : dynamic(() =>
      import("@/components/dev/dev-toolbar").then((m) => m.DevToolbar),
    );

async function UnreadBell({ userId }: { userId: string }) {
  const unread = await unreadNotificationCount(userId);
  return <NotificationBell count={unread} />;
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const { id, email, displayName, timezone, isDemo } = session.user;

  const clock = await getRequestClock();
  const effectiveDate = localToday(clock, timezone);
  const simNow = await getSimNow();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink"
      >
        Skip to content
      </a>
      <PushRegistrar />
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-ink">
            RxFlow
          </span>
          {isDemo && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="hidden sm:inline">{displayName ?? email}</span>
          <Suspense fallback={<NotificationBell count={0} />}>
            <UnreadBell userId={id} />
          </Suspense>
          <SignOutButton />
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 px-4 py-5 focus:outline-none"
      >
        {children}
      </main>

      {DevToolbar && (
        <div className="pointer-events-none sticky bottom-16 z-30 flex justify-center px-4">
          <Suspense fallback={null}>
            <DevToolbar simNow={simNow} effectiveDate={effectiveDate} />
          </Suspense>
        </div>
      )}

      <BottomNav prescriptionsEnabled={env.FEATURE_PRESCRIPTION_UPLOAD} />
    </div>
  );
}
