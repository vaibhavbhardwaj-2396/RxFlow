import { prisma } from "@/server/db/client";

import type { ChannelId, NotificationChannel } from "./channel";
import { inAppChannel } from "./in-app";
import type { NotificationPayload } from "./payload";
import { telegramChannel } from "./telegram";
import { webPushChannel } from "./web-push";

const ALL_CHANNELS: NotificationChannel[] = [
  inAppChannel,
  webPushChannel,
  telegramChannel,
];

/** Channel ids that are configured right now (in-app is always in the list). */
export function availableChannels(): ChannelId[] {
  return ALL_CHANNELS.filter((c) => c.available()).map((c) => c.id);
}

/**
 * Send `payload` to the user across their enabled + available channels (in-app
 * always included) and record one NotificationLog row per channel.
 */
export async function deliver(
  userId: string,
  payload: NotificationPayload,
  ctx: { occurrenceId?: string; enabledChannels: string[] },
  now: Date,
): Promise<void> {
  const wanted = new Set<string>([...ctx.enabledChannels, "in_app"]);
  const channels = ALL_CHANNELS.filter(
    (c) => c.available() && wanted.has(c.id),
  );

  await Promise.all(
    channels.map(async (channel) => {
      let ok = false;
      let detail: string | undefined;
      try {
        const result = await channel.send(userId, payload);
        ok = result.ok;
        detail = result.detail;
      } catch (error) {
        detail = error instanceof Error ? error.message : "error";
      }
      await prisma.notificationLog.create({
        data: {
          userId,
          occurrenceId: ctx.occurrenceId ?? null,
          channel: channel.id,
          title: payload.title,
          body: detail && !ok ? `${payload.body} (undelivered)` : payload.body,
          url: payload.url,
          deliveredAt: ok ? now : null,
        },
      });
    }),
  );
}
