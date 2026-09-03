import type { Config } from "@netlify/functions";

/**
 * Runs the RxFlow background job every 15 minutes: sweep overdue doses to
 * `missed`, materialise + dispatch due reminders, roll the occurrence horizon
 * forward. Just calls the secret-guarded internal route.
 */
export default async function tick(): Promise<Response> {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TICK_SECRET;
  if (!base || !secret) {
    return new Response("URL / TICK_SECRET not configured", { status: 500 });
  }

  const res = await fetch(`${base}/api/internal/tick`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`tick → ${res.status} ${body}`);
  return new Response(body, { status: res.status });
}

export const config: Config = {
  schedule: "*/15 * * * *",
};
