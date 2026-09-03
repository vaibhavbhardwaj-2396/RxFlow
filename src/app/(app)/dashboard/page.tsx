import { DateTime } from "luxon";
import type { Metadata } from "next";
import { CalendarPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonClass } from "@/components/ui/button";
import { localToday } from "@/domain/time";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Today" };

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const { now } = await props.searchParams;

  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, email: true, timezone: true },
  });
  if (!user) redirect("/sign-in");

  const clock = await getRequestClock(now);
  const today = localToday(clock, user.timezone);
  const heading = DateTime.fromISO(today).toFormat("cccc, d LLLL yyyy");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Today
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          {heading}
        </h1>
      </div>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Sparkles className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Your treatment plan is empty
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
            Add a treatment or upload a prescription and Regimen will build the
            schedule, timeline and reminders around it.
          </p>
        </div>
        <Link href="/treatments/new" className={buttonClass("primary", "md")}>
          <CalendarPlus className="size-4" aria-hidden />
          Add treatment
        </Link>
      </section>

      <p className="text-center text-xs text-ink-faint">
        Signed in as {user.displayName ?? user.email} · timezone {user.timezone}
      </p>
    </div>
  );
}
