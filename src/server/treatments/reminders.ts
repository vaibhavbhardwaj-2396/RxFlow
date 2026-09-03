"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";

export async function toggleTreatmentRemindersAction(
  id: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const result = await prisma.treatment.updateMany({
    where: { id, userId: session.user.id },
    data: { remindersEnabled: enabled },
  });
  if (result.count === 0)
    return { error: "That treatment could not be found." };
  revalidatePath(`/treatments/${id}`);
  return {};
}
