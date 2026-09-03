/** The accent-colour palette a treatment group can be tagged with. Stored as a
 * plain string on `TreatmentPlan.color`; validated against this list. */
export const GROUP_COLORS = [
  "slate",
  "emerald",
  "amber",
  "rose",
  "violet",
  "sky",
] as const;

export type GroupColor = (typeof GROUP_COLORS)[number];

export function isGroupColor(value: unknown): value is GroupColor {
  return (
    typeof value === "string" &&
    (GROUP_COLORS as readonly string[]).includes(value)
  );
}

/** Literal Tailwind class strings per colour (v4's scanner needs them whole).
 * `dot` — a small filled circle; `badge` — a pill background; `bar` — a left rule. */
export const GROUP_COLOR_CLASSES: Record<
  GroupColor,
  { dot: string; badge: string; bar: string }
> = {
  slate: {
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    bar: "bg-slate-400",
  },
  emerald: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  amber: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  rose: {
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    bar: "bg-rose-500",
  },
  violet: {
    dot: "bg-violet-500",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  sky: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
    bar: "bg-sky-500",
  },
};

/** Class set for a colour that may be null/unknown — falls back to a neutral dot. */
export function groupColorClasses(color: string | null | undefined) {
  return isGroupColor(color)
    ? GROUP_COLOR_CLASSES[color]
    : {
        dot: "bg-ink-faint",
        badge: "bg-surface-sunken text-ink-muted",
        bar: "bg-line",
      };
}
