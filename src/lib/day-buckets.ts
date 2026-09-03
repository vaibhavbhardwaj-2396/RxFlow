/** The four parts of the day the dashboard groups doses into. */
export type DayPart = "morning" | "afternoon" | "evening" | "night";

export const DAY_PART_ORDER: readonly DayPart[] = [
  "morning",
  "afternoon",
  "evening",
  "night",
] as const;

export const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Before sleep",
};

/**
 * Which part of the day a `"HH:mm"` wall time falls in.
 * <12:00 morning · <17:00 afternoon · <21:00 evening · otherwise before-sleep.
 */
export function dayPart(localTime: string): DayPart {
  const hour = Number.parseInt(localTime.slice(0, 2), 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}
