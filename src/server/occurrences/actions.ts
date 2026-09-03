"use server";

import { revalidatePath } from "next/cache";

import {
  type AdherenceAction,
  InvalidAdherenceActionError,
  applyAdherenceAction,
} from "@/domain/adherence";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getRequestClock } from "@/server/time/request-clock";

export type OccurrenceActionResult = { ok: true } | { error: string };

async function act(
  occurrenceId: string,
  action: AdherenceAction,
): Promise<OccurrenceActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const userId = session.user.id;

  const occurrence = await prisma.scheduledOccurrence.findUnique({
    where: { id: occurrenceId },
    select: { userId: true, status: true },
  });
  if (!occurrence || occurrence.userId !== userId) {
    return { error: "That dose could not be found." };
  }

  let next;
  try {
    next = applyAdherenceAction(occurrence.status, action);
  } catch (error) {
    // Already in the target state — nothing to record.
    if (error instanceof InvalidAdherenceActionError) return { ok: true };
    throw error;
  }

  const clock = await getRequestClock();

  await prisma.$transaction([
    prisma.adherenceEvent.create({
      data: {
        occurrenceId,
        userId,
        type: next.event,
        effectiveAt: clock.now().toJSDate(),
        source: "dashboard",
      },
    }),
    prisma.scheduledOccurrence.update({
      where: { id: occurrenceId },
      data: { status: next.status },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function completeOccurrence(
  id: string,
): Promise<OccurrenceActionResult> {
  return act(id, "complete");
}

export async function skipOccurrence(
  id: string,
): Promise<OccurrenceActionResult> {
  return act(id, "skip");
}

export async function reopenOccurrence(
  id: string,
): Promise<OccurrenceActionResult> {
  return act(id, "reopen");
}
