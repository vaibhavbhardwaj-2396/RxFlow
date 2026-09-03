import { type GroupShapeInput, isNamedGroup } from "@/lib/group-shape";
import { prisma } from "@/server/db/client";

import {
  TREATMENT_LIST_INCLUDE,
  type TreatmentListItem,
  nextDoseByTreatment,
  toTreatmentListItem,
} from "./queries";

export interface GroupVM {
  id: string;
  title: string;
  kind: "ongoing" | "course";
  color: string | null;
  archived: boolean;
  treatmentCount: number;
  /** For a `course`: the last local date any of its treatments has a dose. */
  endsOn: string | null;
  treatments: TreatmentListItem[];
}

export interface TreatmentsView {
  groups: GroupVM[];
  archived: GroupVM[];
  ungrouped: TreatmentListItem[];
}

/**
 * The whole `/treatments` page: named groups (active + archived) and the loose
 * treatments that sit in single-treatment "shadow" plans.
 */
export async function listTreatmentGroupsForUser(
  userId: string,
  today: string,
): Promise<TreatmentsView> {
  const [plans, nextByTreatment, settings, courseEnds] = await Promise.all([
    prisma.treatmentPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        kind: true,
        color: true,
        archivedAt: true,
        prescription: { select: { id: true } },
        treatments: {
          orderBy: { createdAt: "asc" },
          include: TREATMENT_LIST_INCLUDE,
        },
      },
    }),
    nextDoseByTreatment(userId, today),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { defaultTimes: true },
    }),
    prisma.scheduledOccurrence.groupBy({
      by: ["treatmentId"],
      where: { userId },
      _max: { localDate: true },
    }),
  ]);

  const defaultTimes = (settings?.defaultTimes ?? {}) as Record<string, string>;
  const lastDoseByTreatment = new Map(
    courseEnds.flatMap((r) =>
      r._max.localDate ? [[r.treatmentId, r._max.localDate]] : [],
    ),
  );

  const groups: GroupVM[] = [];
  const archived: GroupVM[] = [];
  const ungrouped: TreatmentListItem[] = [];

  for (const plan of plans) {
    const shape: GroupShapeInput = {
      title: plan.title,
      kind: plan.kind,
      color: plan.color,
      archivedAt: plan.archivedAt,
      hasPrescription: Boolean(plan.prescription),
      treatmentNames: plan.treatments.map((t) => t.name),
    };

    const items = plan.treatments.map((t) =>
      toTreatmentListItem(t, defaultTimes, nextByTreatment.get(t.id) ?? null),
    );

    if (!isNamedGroup(shape)) {
      ungrouped.push(...items);
      continue;
    }

    const endsOn =
      plan.kind === "course"
        ? (plan.treatments
            .map((t) => lastDoseByTreatment.get(t.id))
            .filter((d): d is string => Boolean(d))
            .sort()
            .at(-1) ?? null)
        : null;

    const vm: GroupVM = {
      id: plan.id,
      title: plan.title,
      kind: plan.kind,
      color: plan.color,
      archived: plan.archivedAt != null,
      treatmentCount: plan.treatments.length,
      endsOn,
      treatments: items,
    };
    (vm.archived ? archived : groups).push(vm);
  }

  return { groups, archived, ungrouped };
}

/** Non-archived groups, for the wizard + "move to group" pickers. */
export async function listGroupOptionsForUser(
  userId: string,
): Promise<Array<{ id: string; title: string }>> {
  const plans = await prisma.treatmentPlan.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      kind: true,
      color: true,
      archivedAt: true,
      prescription: { select: { id: true } },
      treatments: { select: { name: true } },
    },
  });

  return plans
    .filter((p) =>
      isNamedGroup({
        title: p.title,
        kind: p.kind,
        color: p.color,
        archivedAt: p.archivedAt,
        hasPrescription: Boolean(p.prescription),
        treatmentNames: p.treatments.map((t) => t.name),
      }),
    )
    .map((p) => ({ id: p.id, title: p.title }));
}
