import webpush from "web-push";

import { env, webPushEnabled } from "@/env";
import { prisma } from "@/server/db/client";

import type { NotificationChannel } from "./channel";

let configured = false;
function ensureConfigured(): boolean {
  if (!webPushEnabled) return false;
  if (!configured) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT!,
      env.VAPID_PUBLIC_KEY!,
      env.VAPID_PRIVATE_KEY!,
    );
    configured = true;
  }
  return true;
}

export const webPushChannel: NotificationChannel = {
  id: "web_push",
  available: () => webPushEnabled,

  async send(userId, payload) {
    if (!ensureConfigured()) return { ok: false, detail: "not configured" };

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return { ok: false, detail: "no subscriptions" };

    let delivered = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.authKey },
          },
          JSON.stringify(payload),
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        }
      }
    }
    return { ok: delivered > 0, detail: `${delivered}/${subs.length}` };
  },
};
