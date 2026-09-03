import { env, telegramEnabled } from "@/env";
import { prisma } from "@/server/db/client";

import type { NotificationChannel } from "./channel";

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
