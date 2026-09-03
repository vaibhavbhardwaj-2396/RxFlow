import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { fileStore } from "@/server/storage";

/**
 * Stream a prescription file back to its owner. This is the ONLY way to read an
 * uploaded document — it is decrypted on demand, never cached, and never
 * reachable from a public or static path.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const prescription = await prisma.prescription.findFirst({
    where: { id, userId: session.user.id },
    select: { storageKey: true, mimeType: true, originalName: true },
  });
  if (!prescription) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let file;
  try {
    file = await fileStore.get(prescription.storageKey);
  } catch {
    return NextResponse.json({ error: "file unavailable" }, { status: 404 });
  }

  const filename = (prescription.originalName ?? "prescription").replace(
    /[^\w.\- ]+/g,
    "_",
  );
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "content-type": file.mimeType || prescription.mimeType,
      "content-disposition": `inline; filename="${filename}"`,
      "content-length": String(file.bytes.byteLength),
      "cache-control": "private, no-store, max-age=0",
    },
  });
}
