import type { NotificationChannel } from "./channel";

/**
 * In-app delivery *is* the NotificationLog row that `deliver()` writes — so this
 * channel just reports success. It is always available.
 */
export const inAppChannel: NotificationChannel = {
  id: "in_app",
  available: () => true,
  send: async () => ({ ok: true }),
};
