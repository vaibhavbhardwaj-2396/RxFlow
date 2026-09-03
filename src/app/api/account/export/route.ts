import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { buildAccountExport } from "@/server/account/export";

/** Download everything RxFlow holds for the signed-in user, as JSON. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await buildAccountExport(session.user.id);
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="rxflow-export-${date}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
