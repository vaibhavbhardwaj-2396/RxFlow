"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";

export async function markNotificationsReadAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.notificationLog.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
