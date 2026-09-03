import { prisma } from "@/server/db/client";

export interface PrescriptionListItem {
  id: string;
  status: string;
  sourceType: string;
  originalName: string | null;
  mimeType: string;
  createdAt: string;
  treatmentCount: number;
  planId: string | null;
}

export interface PrescriptionDetail {
  id: string;
  status: string;
  sourceType: string;
  mimeType: string;
  originalName: string | null;
  byteSize: number;
  note: string | null;
  createdAt: string;
  planId: string | null;
  treatments: Array<{ id: string; name: string; status: string }>;
  items: Array<{
    id: string;
    orderIndex: number;
    ambiguityFlags: string[];
    status: string;
    treatmentId: string | null;
  }>;
}

/** The prescription library for a user — newest first, archived excluded. */
export async function listPrescriptionsForUser(
  userId: string,
): Promise<PrescriptionListItem[]> {
  const rows = await prisma.prescription.findMany({
    where: { userId, status: { not: "archived" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      sourceType: true,
      originalName: true,
      mimeType: true,
      createdAt: true,
      planId: true,
      plan: { select: { _count: { select: { treatments: true } } } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    sourceType: r.sourceType,
    originalName: r.originalName,
    mimeType: r.mimeType,
    createdAt: r.createdAt.toISOString(),
    treatmentCount: r.plan?._count.treatments ?? 0,
    planId: r.planId,
  }));
}

export async function getPrescriptionForUser(
  userId: string,
  id: string,
): Promise<PrescriptionDetail | null> {
  const row = await prisma.prescription.findFirst({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      sourceType: true,
      mimeType: true,
      originalName: true,
      byteSize: true,
      note: true,
      createdAt: true,
      planId: true,
      plan: {
        select: {
          treatments: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, status: true },
          },
        },
      },
      items: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          orderIndex: true,
          ambiguityFlags: true,
          status: true,
          treatmentId: true,
        },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    sourceType: row.sourceType,
    mimeType: row.mimeType,
    originalName: row.originalName,
    byteSize: row.byteSize,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    planId: row.planId,
    treatments: row.plan?.treatments ?? [],
    items: row.items,
  };
}
