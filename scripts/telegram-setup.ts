/**
 * Point the Telegram bot's webhook at the deployed app. Run once after setting
 * TELEGRAM_BOT_TOKEN (and again if NEXT_PUBLIC_APP_URL changes):
 *
 *   NEXT_PUBLIC_APP_URL="https://<site>" TELEGRAM_BOT_TOKEN="…" TICK_SECRET="…" \
 *     npm run telegram:setup
 *
 * `--delete` removes the webhook (falls back to the tick's getUpdates poll).
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const base = process.env.NEXT_PUBLIC_APP_URL;
const secret = process.env.TICK_SECRET;
const remove = process.argv.slice(2).includes("--delete");

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

async function api(method: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function main() {
  if (remove) {
    console.log("deleteWebhook:", await api("deleteWebhook"));
  } else {
    if (!base || !secret) {
      console.error("NEXT_PUBLIC_APP_URL and TICK_SECRET are required");
      process.exit(1);
    }
    console.log(
      "setWebhook:",
      await api("setWebhook", {
        url: `${base}/api/telegram/webhook`,
        secret_token: secret,
        allowed_updates: ["message"],
      }),
    );
  }
  console.log("getWebhookInfo:", await api("getWebhookInfo"));
}

void main();

export {};
