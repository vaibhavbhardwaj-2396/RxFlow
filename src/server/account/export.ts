import { env } from "@/env";
import { prisma } from "@/server/db/client";

/**
 * Everything the app holds for one user, as a plain object — for a
 * "download my data" export. Prescription *files* are referenced by their
 * authenticated URL, not embedded (they can be many MB each and are downloadable
 * while signed in).
 */
export async function buildAccountExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      timezone: true,
      emailVerified: true,
      createdAt: true,
      settings: true,
      plans: {
        select: {
          id: true,
          title: true,
          kind: true,
          color: true,
          archivedAt: true,
          createdAt: true,
        },
      },
      treatments: {
        select: {
          id: true,
          planId: true,
          name: true,
          medicineName: true,
          category: true,
          instructionsText: true,
          doseText: true,
          anchorDate: true,
          timezone: true,
          scheduleVersion: true,
          status: true,
          confirmedAt: true,
          remindersEnabled: true,
          createdAt: true,
          recurrence: {
            select: { type: true, config: true, recurrenceAnchor: true },
          },
          phaseCycle: {
            select: {
              repeatMode: true,
              repeatCount: true,
              repeatUntil: true,
              phases: {
                orderBy: { orderIndex: "asc" },
                select: {
                  orderIndex: true,
                  kind: true,
                  durationKind: true,
                  durationValue: true,
                  durationUntil: true,
                  ruleOverride: true,
                  label: true,
                },
              },
            },
          },
          doseTimes: {
            orderBy: { orderIndex: "asc" },
            select: {
              orderIndex: true,
              kind: true,
              clockValue: true,
              relativeAnchor: true,
            },
          },
        },
      },
      occurrences: {
        orderBy: { scheduledAt: "asc" },
        select: {
          treatmentId: true,
          scheduledAt: true,
          localDate: true,
          localTime: true,
          timezone: true,
          timeSpecSnapshot: true,
          phaseIndex: true,
          scheduleVersion: true,
          status: true,
        },
      },
      adherenceEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          occurrenceId: true,
          type: true,
          effectiveAt: true,
          source: true,
          createdAt: true,
        },
      },
      notifications: {
        orderBy: { createdAt: "asc" },
        select: {
          channel: true,
          title: true,
          body: true,
          url: true,
          deliveredAt: true,
          readAt: true,
          createdAt: true,
        },
      },
      prescriptions: {
        select: {
          id: true,
          planId: true,
          sourceType: true,
          status: true,
          mimeType: true,
          byteSize: true,
          checksum: true,
          originalName: true,
          note: true,
          createdAt: true,
          extractions: {
            select: {
              attempt: true,
              parserName: true,
              parserVersion: true,
              status: true,
              structured: true,
              createdAt: true,
            },
          },
          items: {
            orderBy: { orderIndex: "asc" },
            select: {
              orderIndex: true,
              extractedFields: true,
              ambiguityFlags: true,
              status: true,
              treatmentId: true,
            },
          },
        },
      },
    },
  });
  if (!user) return null;

  const { prescriptions, ...rest } = user;
  return {
    exportedAt: new Date().toISOString(),
    app: "RxFlow",
    ...rest,
    prescriptions: prescriptions.map((p) => ({
      ...p,
      fileUrl: `${env.NEXT_PUBLIC_APP_URL}/api/prescriptions/${p.id}/file`,
      fileIncluded: false,
    })),
  };
}
