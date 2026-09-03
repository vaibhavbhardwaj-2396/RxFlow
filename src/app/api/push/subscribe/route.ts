import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh, authKey },
    update: { userId: session.user.id, p256dh, authKey },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
  } | null;
  if (body?.endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint, userId: session.user.id },
    });
  }
  return NextResponse.json({ ok: true });
}
