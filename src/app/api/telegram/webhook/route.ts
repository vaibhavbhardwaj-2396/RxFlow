import { NextResponse } from "next/server";

import { env } from "@/env";
import {
  type TelegramUpdate,
  handleTelegramUpdate,
} from "@/server/notifications/telegram";

/**
 * Telegram pushes every bot message here. Registered by `npm run telegram:setup`
 * with `secret_token` = `TICK_SECRET`, which Telegram then echoes in the
 * `x-telegram-bot-api-secret-token` header. Only `/start <link-token>` messages
 * do anything (they link a user's chat); everything else is ignored.
 *
 * Always returns 200 — a non-200 makes Telegram retry and eventually drop the
 * webhook.
 */
export async function POST(request: Request) {
  const token = request.headers.get("x-telegram-bot-api-secret-token");
  if (token !== env.TICK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await request
    .json()
    .catch(() => null)) as TelegramUpdate | null;

  if (update) {
    try {
      await handleTelegramUpdate(update);
    } catch (error) {
      console.error("telegram webhook", error);
    }
  }

  return NextResponse.json({ ok: true });
}
