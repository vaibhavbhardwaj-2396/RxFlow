import { NextResponse } from "next/server";

import { env } from "@/env";
import { prisma } from "@/server/db/client";
import {
  DEMO_DISPLAY_NAME,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  reseedAccount,
} from "@/server/seed/section30";
import { getRequestClock } from "@/server/time/request-clock";

/**
 * Re-seed the shared demo account so the public showcase stays clean. Anchored
 * to a week ago (Asia/Kolkata) so the demo always shows recent history plus
 * upcoming doses. Guarded by `TICK_SECRET`; run nightly by a Netlify scheduled
 * function.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const secret = bearer ?? url.searchParams.get("secret");
  if (!secret || secret !== env.TICK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const clock = await getRequestClock();
  const anchorDate =
    clock.now().setZone("Asia/Kolkata").minus({ days: 7 }).toISODate() ??
    "2026-09-07";

  const result = await reseedAccount(prisma, {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    displayName: DEMO_DISPLAY_NAME,
    isDemo: true,
    withSection30: true,
    anchorDate,
  });

  return NextResponse.json({ ok: true, anchorDate, ...result });
}
