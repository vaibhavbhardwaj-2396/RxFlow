import type { Config } from "@netlify/functions";

/**
 * Runs the RxFlow background job every 5 minutes: sweep overdue doses to
 * `missed`, materialise + dispatch due reminders (in-app / Web Push / Telegram),
 * roll the occurrence horizon forward. Calls the secret-guarded internal route
 * on this deploy's own origin, honouring the app's basePath.
 */
export default async function tick(): Promise<Response> {
  const origin = (
    process.env.URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    ""
  ).replace(/\/$/, "");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const secret = process.env.TICK_SECRET;
  if (!origin || !secret) {
    return new Response("URL / TICK_SECRET not configured", { status: 500 });
  }

  const base = origin.endsWith(basePath) ? origin : `${origin}${basePath}`;
  const res = await fetch(`${base}/api/internal/tick`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`tick → ${res.status} ${body}`);
  return new Response(body, { status: res.status });
}

export const config: Config = {
  schedule: "*/5 * * * *",
};
