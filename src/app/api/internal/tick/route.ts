import { NextResponse } from "next/server";

import { env } from "@/env";
import { runTick } from "@/server/tick/run";

/** The background job. Guarded by `TICK_SECRET` (Bearer header or `?secret=`). */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const secret = bearer ?? url.searchParams.get("secret");
  if (!secret || secret !== env.TICK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nowParam = url.searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : undefined;

  const summary = await runTick(
    now && !Number.isNaN(now.getTime()) ? now : undefined,
  );
  return NextResponse.json({ ok: true, ...summary });
}
