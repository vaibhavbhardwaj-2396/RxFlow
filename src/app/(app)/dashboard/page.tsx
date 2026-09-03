import { CalendarPlus, Sparkles } from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConflictNotice } from "@/components/dashboard/conflict-notice";
import { TodayBoard } from "@/components/dashboard/today-board";
import { WhatsChanging } from "@/components/dashboard/whats-changing";
import { buttonClass } from "@/components/ui/button";
import { localToday } from "@/domain/time";
import { auth } from "@/server/auth";
import { getTodayBoard } from "@/server/occurrences/queries";
import { getUpcomingChanges } from "@/server/treatments/changes";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Today" };

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const { now } = await props.searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const clock = await getRequestClock(now);
  const today = localToday(clock, session.user.timezone);
  const heading = DateTime.fromISO(today).toFormat("cccc, d LLLL yyyy");
  const [board, changes] = await Promise.all([
    getTodayBoard(session.user.id, today, clock.now().toJSDate()),
    getUpcomingChanges(session.user.id, today),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Today
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {heading}
          </h1>
        </div>
        {board.treatmentCount > 0 && (
          <Link
            href="/treatments/new"
            className={buttonClass("secondary", "md")}
          >
            <CalendarPlus className="size-4" aria-hidden />
            Add
          </Link>
        )}
      </div>

      {board.treatmentCount === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Your treatment plan is empty
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
              Add a treatment or upload a prescription and RxFlow will build the
              schedule, timeline and reminders around it.
            </p>
          </div>
          <Link href="/treatments/new" className={buttonClass("primary", "md")}>
            <CalendarPlus className="size-4" aria-hidden />
            Add treatment
          </Link>
        </section>
      ) : (
        <>
          <ConflictNotice overlaps={board.overlaps} />
          <TodayBoard board={board} />
          <WhatsChanging changes={changes} />
        </>
      )}
    </div>
  );
}
