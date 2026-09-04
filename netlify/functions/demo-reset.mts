import type { Config } from "@netlify/functions";

/**
 * Nightly re-seed of the shared demo account so the public showcase stays clean
 * and stays anchored to the current week. No-op if the demo isn't enabled — the
 * route just re-creates `demo@regimen.test` and never touches any other user.
 * Calls this deploy's own origin, honouring the app's basePath.
 */
export default async function demoReset(): Promise<Response> {
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
  const res = await fetch(`${base}/api/internal/demo-reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`demo-reset → ${res.status} ${body}`);
  return new Response(body, { status: res.status });
}

export const config: Config = {
  schedule: "@daily",
};
