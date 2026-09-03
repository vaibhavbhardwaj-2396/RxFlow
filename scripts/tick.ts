/**
 * Runs the background "tick" once (or on a 60s loop with --watch) by calling the
 * app's own secret-guarded endpoint — the same path a cron / Netlify Scheduled
 * Function hits in production. Needs the dev server running (`npm run dev`).
 *
 * Optional: `npm run tick -- --now 2026-09-12T09:00:00Z` simulates the clock.
 */
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SECRET = process.env.TICK_SECRET ?? "";

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const nowIdx = args.indexOf("--now");
const now = nowIdx >= 0 ? args[nowIdx + 1] : undefined;

async function once(): Promise<void> {
  const url = new URL(`${BASE}/api/internal/tick`);
  if (now) url.searchParams.set("now", now);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const body = await res.json().catch(() => ({}));
    console.log(new Date().toISOString(), res.status, JSON.stringify(body));
    if (!res.ok && !watch) process.exitCode = 1;
  } catch (error) {
    console.error(
      "tick: could not reach the app — is `npm run dev` running?",
      error instanceof Error ? error.message : error,
    );
    if (!watch) process.exitCode = 1;
  }
}

async function main() {
  if (watch) {
    console.log(
      "tick: watching — one pass now, then every 60s (Ctrl-C to stop)",
    );
    await once();
    setInterval(() => void once(), 60_000);
  } else {
    await once();
  }
}

void main();

export {};
