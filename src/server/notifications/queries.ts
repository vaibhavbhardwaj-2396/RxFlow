import { prisma } from "@/server/db/client";

export interface NotificationRow {
  id: string;
  channel: string;
  title: string;
  body: string;
  url: string | null;
  createdAt: Date;
  readAt: Date | null;
  deliveredAt: Date | null;
}

export async function getNotifications(
  userId: string,
): Promise<NotificationRow[]> {
  return prisma.notificationLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      channel: true,
      title: true,
      body: true,
      url: true,
      createdAt: true,
      readAt: true,
      deliveredAt: true,
    },
  });
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notificationLog.count({ where: { userId, readAt: null } });
}
