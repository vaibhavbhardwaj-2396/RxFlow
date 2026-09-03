import { plainDate } from "@/domain/time";
import { type UpcomingChange, upcomingChanges } from "@/lib/phase-transitions";
import { prisma } from "@/server/db/client";

import { phaseCycleFromRows } from "./mappers";

/** Upcoming schedule shifts across all of a user's active treatments. */
export async function getUpcomingChanges(
  userId: string,
  today: string,
): Promise<UpcomingChange[]> {
  const treatments = await prisma.treatment.findMany({
    where: { userId, status: "active" },
    select: {
      id: true,
      name: true,
      anchorDate: true,
      phaseCycle: {
        include: { phases: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  const changes = treatments.flatMap((t) =>
    t.phaseCycle
      ? upcomingChanges(
          t.id,
          t.name,
          plainDate(t.anchorDate),
          phaseCycleFromRows(t.phaseCycle, t.phaseCycle.phases),
          plainDate(today),
        )
      : [],
  );

  return changes
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, 6);
}
