import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/env";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { fileStore } from "@/server/storage";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED: Record<string, "image" | "pdf"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
};

/** Upload a prescription document. Encrypted at rest; never served publicly. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!env.FEATURE_PRESCRIPTION_UPLOAD) {
    return NextResponse.json(
      { error: "Prescription upload is not enabled here." },
      { status: 403 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const sourceType = ACCEPTED[file.type];
  if (!sourceType) {
    return NextResponse.json(
      { error: "Upload a JPG, PNG, WebP or PDF." },
      { status: 415 },
    );
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "The file must be between 1 byte and 10 MB." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `${session.user.id}/${randomUUID()}`;

  await fileStore.put(storageKey, bytes, file.type);

  try {
    const prescription = await prisma.prescription.create({
      data: {
        userId: session.user.id,
        sourceType,
        status: "uploaded",
        storageKey,
        mimeType: file.type,
        byteSize: bytes.byteLength,
        checksum,
        originalName: file.name || null,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: prescription.id }, { status: 201 });
  } catch (error) {
    await fileStore.delete(storageKey).catch(() => {});
    throw error;
  }
}
