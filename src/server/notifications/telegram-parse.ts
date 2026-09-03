/** A Telegram `message` update, as far as we care about it. */
export interface TelegramUpdate {
  update_id?: number;
  message?: { chat?: { id?: number }; text?: string };
}

/** The link token + chat id from a `/start <token>` message, or null. Pure. */
export function telegramStartToken(update: TelegramUpdate): {
  token: string;
  chatId: number;
} | null {
  const token = (update.message?.text ?? "").match(/^\/start\s+(\S+)/)?.[1];
  const chatId = update.message?.chat?.id;
  return token && typeof chatId === "number" ? { token, chatId } : null;
}
