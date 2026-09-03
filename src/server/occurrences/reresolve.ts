import type { Prisma } from "@prisma/client";

import { type TimeSpecSnapshot, wallTimeToInstant } from "@/domain/scheduling";
import { localToday, plainDate } from "@/domain/time";
import { prisma } from "@/server/db/client";
import { getRequestClock } from "@/server/time/request-clock";

/**
 * Re-resolve future, un-actioned occurrences after a preference change:
 *  - a named default time moved (`changedAnchors`) — `relative` doses using that
 *    anchor pick up the new time;
 *  - the user's timezone changed — every future occurrence keeps its wall
 *    (`localTime`) but its UTC `scheduledAt` is recomputed in the new zone.
 *
 * Completed / skipped / missed occurrences are outside the status filter, so
 * history is never touched. (A future per-occurrence manual time override would
 * carry a flag this filter also excludes.)
 */
export async function reresolveFutureOccurrences(
  userId: string,
  opts: { changedAnchors?: ReadonlySet<string>; timezoneChanged?: boolean },
): Promise<{ updated: number }> {
  const changedAnchors = opts.changedAnchors ?? new Set<string>();
  const timezoneChanged = opts.timezoneChanged ?? false;
  if (changedAnchors.size === 0 && !timezoneChanged) return { updated: 0 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, settings: { select: { defaultTimes: true } } },
  });
  if (!user) return { updated: 0 };

  const tz = user.timezone;
  const defaultTimes = (user.settings?.defaultTimes ?? {}) as Record<
    string,
    string
  >;

  const clock = await getRequestClock();
  const today = localToday(clock, tz);

  const rows = await prisma.scheduledOccurrence.findMany({
    where: {
      userId,
      status: { in: ["scheduled", "reminder_sent"] },
      localDate: { gte: today },
    },
    select: {
      id: true,
      localDate: true,
      localTime: true,
      timezone: true,
      timeSpecSnapshot: true,
    },
  });

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  const touchedIds: string[] = [];

  for (const row of rows) {
    const snap = row.timeSpecSnapshot as TimeSpecSnapshot;
    let localTime = row.localTime;
    let snapshot: TimeSpecSnapshot = snap;

    if (
      snap.kind === "relative" &&
      changedAnchors.has(snap.anchor) &&
      typeof defaultTimes[snap.anchor] === "string"
    ) {
      localTime = defaultTimes[snap.anchor];
      snapshot = {
        kind: "relative",
        anchor: snap.anchor,
        resolvedFrom: defaultTimes[snap.anchor],
      };
    }

    const timeChanged = localTime !== row.localTime;
    const zoneChanged = timezoneChanged && row.timezone !== tz;
    if (!timeChanged && !zoneChanged) continue;

    writes.push(
      prisma.scheduledOccurrence.update({
        where: { id: row.id },
        data: {
          localTime,
          timezone: tz,
          scheduledAt: new Date(
            wallTimeToInstant(plainDate(row.localDate), localTime, tz),
          ),
          timeSpecSnapshot: snapshot as Prisma.InputJsonValue,
        },
      }),
    );
    touchedIds.push(row.id);
  }

  if (writes.length === 0) return { updated: 0 };

  // Drop pending reminders for the shifted occurrences — the tick job
  // re-materialises them against the new time on its next pass.
  writes.push(
    prisma.reminder.deleteMany({
      where: { occurrenceId: { in: touchedIds }, status: "pending" },
    }),
  );

  await prisma.$transaction(writes);
  return { updated: touchedIds.length };
}
