# Reminder notifications

RxFlow sends a reminder ahead of each dose. The `tick` job
(`netlify/functions/tick.mts`, every 5 min) materialises reminders at
`scheduledAt − leadMinutes` (clipped out of quiet hours) and dispatches the ones
that are due across every channel the user has turned on.

**Every notification carries only:** the treatment name, the time, and a deep
link back to the app. Never the dose text, the prescriber's instructions, or a
diagnosis.

Each user controls this in **Settings → Reminders**: global on/off, lead time,
quiet hours, and a per-channel toggle. Per-treatment reminders can also be turned
off on a treatment's page.

| Channel | Setup | Enabled for the deploy? |
|---|---|---|
| **In-app** | none — always on | ✅ (a bell + `/notifications` centre) |
| **Web Push** | VAPID keys (below) | when the 4 `VAPID_*` vars are set |
| **Telegram** | a bot + webhook (below) | when `TELEGRAM_BOT_*` are set |

---

## Web Push (browser notifications)

Works on desktop Chrome/Edge/Firefox and Android. On iOS the user must first add
the site to their Home Screen (Safari → Share → Add to Home Screen), then open it
from there.

1. Generate a VAPID keypair:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Set on Netlify (Site config → Environment variables):

   | var | value |
   |---|---|
   | `VAPID_PUBLIC_KEY` | the public key |
   | `VAPID_PRIVATE_KEY` | the private key |
   | `VAPID_SUBJECT` | `mailto:you@example.com` |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | **the same value** as `VAPID_PUBLIC_KEY` |

3. Redeploy. A **"Browser notifications"** card appears in Settings → Enable →
   grant the browser prompt. The subscription is stored server-side; the tick's
   `deliver()` then pushes to it, and `public/sw.js` shows the notification even
   when the tab is closed. A dead subscription (404/410) is pruned automatically.

## Telegram

Reminders arrive as a DM from your bot.

1. In Telegram, message **@BotFather** → `/newbot` → pick a name and a username.
   Copy the token.
2. Set on Netlify:

   | var | value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | the token from BotFather |
   | `TELEGRAM_BOT_USERNAME` | the bot's username, **without** the leading `@` |

3. Redeploy, then point the bot's webhook at the site (run once — and again if
   the site URL changes):
   ```bash
   NEXT_PUBLIC_APP_URL="https://<your-site>" \
   TELEGRAM_BOT_TOKEN="<token>" \
   TICK_SECRET="<same value as on Netlify>" \
     npm run telegram:setup
   ```
   This calls `setWebhook` with a `secret_token` (= `TICK_SECRET`); Telegram then
   POSTs every message to `/api/telegram/webhook`, which the route verifies via
   the `x-telegram-bot-api-secret-token` header. `npm run telegram:setup --delete`
   removes the webhook (falls back to the tick's `getUpdates` poll — fine for
   local dev, too slow for production linking).
4. A **"Telegram"** card appears in Settings → Connect → press **Start** in the
   Telegram chat that opens → "Connected" within a couple of seconds.

## Local development

Notifications are off unless you set the same env vars in `.env`. Without a
public URL you can't receive a Telegram webhook, so locally the tick's
`getUpdates` poll handles `/start` linking instead (`npm run tick`). `npm run
tick:watch` loops the job every 60 s.
