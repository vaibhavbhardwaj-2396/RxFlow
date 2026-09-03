import { env, telegramEnabled } from "@/env";
import { prisma } from "@/server/db/client";

import type { NotificationChannel } from "./channel";
import { type TelegramUpdate, telegramStartToken } from "./telegram-parse";

export { type TelegramUpdate, telegramStartToken } from "./telegram-parse";

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

/** Call a Telegram Bot API method. Throws if the token isn't configured. */
export async function telegramApi(
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramResponse> {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error("Telegram is not configured");
  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return (await res.json()) as TelegramResponse;
}

/**
 * If `update` is a `/start <token>` whose token matches a user's
 * `telegramLinkToken`, link that user's chat and reply. Shared by the tick's
 * `getUpdates` poll (local dev) and the production webhook route. Returns
 * whether a user was linked.
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate,
): Promise<boolean> {
  const start = telegramStartToken(update);
  if (!start) return false;

  const user = await prisma.user.findUnique({
    where: { telegramLinkToken: start.token },
    select: { id: true },
  });
  if (!user) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: String(start.chatId), telegramLinkToken: null },
  });
  await telegramApi("sendMessage", {
    chat_id: start.chatId,
    text: "✓ Connected to RxFlow — dose reminders will arrive here.",
  });
  return true;
}

export const telegramChannel: NotificationChannel = {
  id: "telegram",
  available: () => telegramEnabled,

  async send(userId, payload) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });
    if (!user?.telegramChatId) return { ok: false, detail: "not connected" };

    const text = `⏰ ${payload.title}\n${payload.body}\n${payload.url}`;
    const result = await telegramApi("sendMessage", {
      chat_id: user.telegramChatId,
      text,
      disable_web_page_preview: true,
    });
    return { ok: result.ok, detail: result.description };
  },
};
