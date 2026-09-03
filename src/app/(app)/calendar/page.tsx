import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { CalendarShell } from "@/components/calendar/calendar-shell";
import { DayView } from "@/components/calendar/day-view";
import { MonthGridView } from "@/components/calendar/month-grid";
import { WeekGridView } from "@/components/calendar/week-grid";
import { localToday, plainDate } from "@/domain/time";
import { monthGrid, startOfMonth, weekDays } from "@/lib/calendar-grid";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import {
  getDayBoard,
  getMonthGrid,
  getWeekGrid,
} from "@/server/occurrences/queries";
import { getRequestClock } from "@/server/time/request-clock";

export const metadata: Metadata = { title: "Calendar" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; now?: string }>;
}) {
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  if (!user) redirect("/sign-in");

  const clock = await getRequestClock(sp.now);
  const today = localToday(clock, user.timezone);
  const view =
    sp.view === "day" || sp.view === "month" ? sp.view : ("week" as const);
  const date = sp.date && DATE_RE.test(sp.date) ? sp.date : today;
  const userId = session.user.id;

  let content: ReactNode;
  if (view === "day") {
    const board = await getDayBoard(userId, date, clock.now().toJSDate());
    content = <DayView board={board} />;
  } else if (view === "month") {
    const weeks = monthGrid(plainDate(date));
    const grid = await getMonthGrid(userId, weeks.flat());
    content = (
      <MonthGridView
        grid={grid}
        weeks={weeks}
        monthAnchor={startOfMonth(plainDate(date))}
        today={today}
        now={sp.now}
      />
    );
  } else {
    const days = weekDays(plainDate(date));
    const grid = await getWeekGrid(userId, days);
    content = (
      <WeekGridView grid={grid} days={days} today={today} now={sp.now} />
    );
  }

  return (
    <CalendarShell view={view} date={date} today={today} now={sp.now}>
      {content}
    </CalendarShell>
  );
}
