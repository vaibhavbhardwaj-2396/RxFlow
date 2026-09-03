import { env } from "@/env";

/** The whole of what a notification carries. Deliberately minimal — no dose
 * text, no prescriber instructions, no diagnosis. Name + time + a link home. */
export interface NotificationPayload {
  title: string;
  body: string;
  url: string;
}

export function reminderPayload(input: {
  treatmentName: string;
  localTime: string;
  treatmentId: string;
}): NotificationPayload {
  return {
    title: `Time for ${input.treatmentName}`,
    body: `Scheduled for ${input.localTime}`,
    url: `${env.NEXT_PUBLIC_APP_URL}/treatments/${input.treatmentId}`,
  };
}
