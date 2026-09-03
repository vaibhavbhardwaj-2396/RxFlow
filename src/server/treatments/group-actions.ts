"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { GROUP_COLORS } from "@/lib/group-color";
import { isNamedGroup } from "@/lib/group-shape";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";

export interface GroupActionResult {
  error?: string;
  id?: string;
}

const groupSchema = z.object({
  title: z.string().trim().min(1, "Give the group a name.").max(60),
  kind: z.enum(["ongoing", "course"]),
  color: z.enum(GROUP_COLORS).nullable().default(null),
});

function bump() {
  revalidatePath("/treatments");
  revalidatePath("/dashboard");
}

export async function createGroupAction(
  input: unknown,
): Promise<GroupActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const group = await prisma.treatmentPlan.create({
    data: { userId: session.user.id, ...parsed.data },
    select: { id: true },
  });
  bump();
  return { id: group.id };
}

export async function updateGroupAction(
  id: string,
  input: unknown,
): Promise<GroupActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const result = await prisma.treatmentPlan.updateMany({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });
  if (result.count === 0) return { error: "That group was not found." };
  bump();
  revalidatePath(`/treatments/groups/${id}/edit`);
  return { id };
}

export async function archiveGroupAction(
  id: string,
  archived: boolean,
): Promise<GroupActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const result = await prisma.treatmentPlan.updateMany({
    where: { id, userId: session.user.id },
    data: { archivedAt: archived ? new Date() : null },
  });
  if (result.count === 0) return { error: "That group was not found." };
  bump();
  return { id };
}

export async function deleteGroupAction(
  id: string,
): Promise<GroupActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };

  const group = await prisma.treatmentPlan.findFirst({
    where: { id, userId: session.user.id },
    select: { _count: { select: { treatments: true } } },
  });
  if (!group) return { error: "That group was not found." };
  if (group._count.treatments > 0) {
    return { error: "Move its treatments out first." };
  }

  await prisma.treatmentPlan.delete({ where: { id } });
  bump();
  return {};
}

/**
 * Move a treatment into a group (`groupId`) or out to a fresh solo "shadow"
 * plan (`groupId === null`). Cleans up an emptied shadow plan left behind.
 */
export async function moveTreatmentToGroupAction(
  treatmentId: string,
  groupId: string | null,
): Promise<GroupActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  const treatment = await prisma.treatment.findFirst({
    where: { id: treatmentId, userId },
    select: {
      name: true,
      planId: true,
      plan: {
        select: {
          title: true,
          kind: true,
          color: true,
          archivedAt: true,
          prescription: { select: { id: true } },
          treatments: { select: { name: true } },
        },
      },
    },
  });
  if (!treatment) return { error: "That treatment was not found." };

  if (groupId) {
    const target = await prisma.treatmentPlan.findFirst({
      where: { id: groupId, userId },
      select: { id: true },
    });
    if (!target) return { error: "That group was not found." };
  }

  const fromShadow = !isNamedGroup({
    title: treatment.plan.title,
    kind: treatment.plan.kind,
    color: treatment.plan.color,
    archivedAt: treatment.plan.archivedAt,
    hasPrescription: Boolean(treatment.plan.prescription),
    treatmentNames: treatment.plan.treatments.map((t) => t.name),
  });

  await prisma.$transaction(async (tx) => {
    const destId =
      groupId ??
      (
        await tx.treatmentPlan.create({
          data: { userId, title: treatment.name },
          select: { id: true },
        })
      ).id;

    await tx.treatment.update({
      where: { id: treatmentId },
      data: { planId: destId },
    });

    // The old plan is now empty and was just a shadow → remove it.
    if (fromShadow && treatment.planId !== destId) {
      await tx.treatmentPlan.deleteMany({
        where: { id: treatment.planId, treatments: { none: {} } },
      });
    }
  });

  bump();
  revalidatePath(`/treatments/${treatmentId}`);
  return {};
}

/** Create a group and immediately move a treatment into it. */
export async function createGroupAndAssignAction(
  treatmentId: string,
  input: unknown,
): Promise<GroupActionResult> {
  const created = await createGroupAction(input);
  if (created.error || !created.id) return created;
  const moved = await moveTreatmentToGroupAction(treatmentId, created.id);
  if (moved.error) return moved;
  redirect(`/treatments/${treatmentId}`);
}
