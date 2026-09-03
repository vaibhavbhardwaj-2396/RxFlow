import type { NotificationPayload } from "./payload";

export type ChannelId = "in_app" | "web_push" | "telegram";

export interface SendResult {
  ok: boolean;
  detail?: string;
}

/**
 * A notification transport. Adding email / SMS / WhatsApp later means one more
 * of these — nothing else changes. Channels never touch the scheduling engine.
 */
export interface NotificationChannel {
  id: ChannelId;
  /** Whether this channel is configured (env keys present). In-app is always on. */
  available(): boolean;
  send(userId: string, payload: NotificationPayload): Promise<SendResult>;
}
