/**
 * Static content for the public marketing homepage (`/`). Kept here, away from
 * server code, so the marketing components stay presentational and importable
 * without pulling in Prisma / auth. The mock treatment data mirrors the shape of
 * the "Section 30" demo seed (`src/server/seed/section30.ts`) so what a visitor
 * sees matches what the live demo actually contains.
 */

export interface MockDose {
  time: string;
  name: string;
  note: string;
  /** ISO weekday numbers this dose lands on within the mock week (1 = Mon). */
  days: number[];
}

/** A calm, realistic Monday for the demo domain. */
export const MOCK_TODAY = {
  weekday: "Monday",
  date: "7 September",
  sections: [
    {
      label: "Morning",
      doses: [{ time: "08:00", name: "Multivitamin A", note: "1 tablet" }],
    },
    {
      label: "Afternoon",
      doses: [
        { time: "13:00", name: "Shampoo A", note: "a coin-sized amount" },
      ],
    },
    {
      label: "Evening",
      doses: [{ time: "20:00", name: "Ointment A", note: "thin layer" }],
    },
    {
      label: "Before sleep",
      doses: [{ time: "22:30", name: "Ointment B", note: "thin layer" }],
    },
  ],
  completed: 3,
  total: 4,
} as const;

/** The six treatments as raw instruction shorthand — the "before" state. */
export const RAW_INSTRUCTIONS = [
  { name: "Multivitamin A", rule: "Monday to Friday, morning" },
  { name: "Multivitamin B", rule: "Every other day" },
  { name: "Shampoo A", rule: "3–4 times a week" },
  { name: "Shampoo B", rule: "Tuesday & Saturday evenings" },
  { name: "Ointment A", rule: "Every night for 2 months" },
  { name: "Ointment B", rule: "20 days → 7-day break → 20 days" },
] as const;

/** Ointment B's phase cycle: 20 active / 7 break / 20 active = 47 days. */
export const MOCK_PHASE = {
  treatment: "Ointment B",
  dayOf: 8,
  totalDays: 47,
  daysLeftInPhase: 12,
  segments: [
    { kind: "active", label: "Active", from: "7 Sep", to: "26 Sep", days: 20 },
    { kind: "break", label: "Break", from: "27 Sep", to: "3 Oct", days: 7 },
    { kind: "active", label: "Active", from: "4 Oct", to: "23 Oct", days: 20 },
  ],
} as const;

/** Week grid: treatment rows × Mon–Sun, dot on active days. */
export const MOCK_WEEK: {
  days: string[];
  rows: { name: string; on: number[] }[];
} = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  rows: [
    { name: "Multivitamin A", on: [1, 2, 3, 4, 5] },
    { name: "Multivitamin B", on: [1, 3, 5, 7] },
    { name: "Shampoo A", on: [1, 3, 5] },
    { name: "Shampoo B", on: [2, 6] },
    { name: "Ointment A", on: [1, 2, 3, 4, 5, 6, 7] },
    { name: "Ointment B", on: [1, 2, 3, 4, 5, 6, 7] },
  ],
};

export const PIPELINE_STEPS = [
  {
    title: "Instructions",
    body: "What the prescription, the label or the physio actually said.",
  },
  {
    title: "Treatment plan",
    body: "Each treatment structured — schedule, duration, phases, dose times.",
  },
  {
    title: "Schedule",
    body: "Every dose placed on a real calendar, weeks ahead.",
  },
  {
    title: "Today",
    body: "Just the things due now, grouped by time of day.",
  },
  {
    title: "Reminders",
    body: "A nudge where you already are — in-app, browser or Telegram.",
  },
  {
    title: "Adherence",
    body: "A quiet record of what happened. No streaks, no scores.",
  },
] as const;

export const PATTERNS: {
  label: string;
  on: number[];
  caption?: string;
}[] = [
  { label: "Alternate day", on: [1, 3, 5, 7] },
  {
    label: "A few times a week",
    on: [1, 3, 5],
    caption: "RxFlow suggests Mon · Wed · Fri — change it if you like",
  },
  { label: "Every 3 days", on: [1, 4, 7] },
  { label: "Specific weekdays", on: [2, 6], caption: "Tue & Sat" },
];

export const REMINDER_CHANNELS = [
  {
    channel: "In-app",
    detail: "A bell in RxFlow and a notification centre.",
  },
  {
    channel: "Browser",
    detail: "A system notification even when RxFlow is closed.",
  },
  {
    channel: "Telegram",
    detail: "A direct message from the RxFlow bot.",
  },
] as const;

export const GROUPS = [
  {
    name: "Dermatology",
    kind: "Course",
    meta: "through late October",
    treatments: ["Ointment A", "Ointment B", "Shampoo A", "Shampoo B"],
  },
  {
    name: "Daily supplements",
    kind: "Ongoing",
    meta: "no planned end",
    treatments: ["Multivitamin A", "Multivitamin B"],
  },
] as const;

export const PERSONAS = [
  {
    title: "Dermatology",
    body: "Several creams, shampoos and supplements, each on its own rhythm and cycle.",
  },
  {
    title: "Recovery",
    body: "Post-procedure routines that change as you move through phases.",
  },
  {
    title: "Physiotherapy",
    body: "Exercises and routines to do on a structured schedule.",
  },
  {
    title: "Dental",
    body: "Treatments with specific windows and a fixed number of days.",
  },
  {
    title: "Supplements",
    body: "A handful of things on different days and different times.",
  },
  {
    title: "Long-term routines",
    body: "Ongoing treatment where the daily tasks keep shifting.",
  },
] as const;

export const TRUST_PRINCIPLES = [
  {
    title: "No diagnosis",
    body: "RxFlow doesn't identify conditions or interpret symptoms.",
  },
  {
    title: "No recommendations",
    body: "It never tells you what medicine or treatment to take.",
  },
  {
    title: "No guessing",
    body: "If an instruction is ambiguous, RxFlow asks you to clarify it — it never fills the gap itself.",
  },
] as const;

export const PRIVACY_POINTS = [
  {
    title: "Private by design",
    body: "Your plan is yours. Nothing is shared, sold or used to train anything.",
  },
  {
    title: "Encrypted prescription files",
    body: "Uploads are encrypted at rest and served only through an authenticated, no-store route — never a public link.",
  },
  {
    title: "Minimal notifications",
    body: "A reminder carries a treatment name, a time and a link. Never the dose or the instructions.",
  },
  {
    title: "Export anytime",
    body: "Download everything you've entered as JSON, whenever you want.",
  },
  {
    title: "Delete for real",
    body: "Remove a treatment, a prescription or your whole account — rows and files are erased, not hidden.",
  },
  {
    title: "Timezone-aware",
    body: "Every dose time resolves in your timezone, so travel doesn't scramble the plan.",
  },
] as const;

export const PRICING_TIERS = [
  {
    name: "Early Access",
    price: "Free",
    priceNote: "while RxFlow is in development",
    for: "For understanding and running a treatment plan.",
    features: [
      "Unlimited treatment plans",
      "Today, calendar and timeline",
      "Recurrence, phases and cycles",
      "Adherence history",
      "Groups",
      "In-app, browser and Telegram reminders",
    ],
    cta: "primary" as const,
  },
  {
    name: "Plus",
    price: "Coming soon",
    priceNote: "for more complex routines",
    for: "For people managing a lot at once.",
    features: [
      "Richer adherence history",
      "More reminder controls",
      "Prescription reference library",
      "More to come",
    ],
    cta: "muted" as const,
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Is RxFlow a medical app?",
    a: "No. RxFlow is a scheduling and adherence tool. It doesn't diagnose, recommend or change treatment — it organises the instructions you were already given.",
  },
  {
    q: "Can RxFlow tell me what medicine to take?",
    a: "No. You enter the treatments and their instructions. RxFlow turns them into a schedule and reminds you — it never decides what belongs in the plan.",
  },
  {
    q: "Can I use it for creams, ointments, shampoos and skincare?",
    a: "Yes. RxFlow works for anything with a schedule — topicals, supplements, medicines, physiotherapy routines and more.",
  },
  {
    q: "Can it handle every-other-day and a-few-times-a-week schedules?",
    a: "Yes. Daily, specific weekdays, alternate days, every N days, and “a few times a week” (RxFlow suggests evenly-spaced days you can change).",
  },
  {
    q: "Can it handle treatment breaks and cycles?",
    a: "Yes. A treatment can run in active/break phases — 20 days on, 7 off, 20 on — and RxFlow keeps the timeline running through the pause.",
  },
  {
    q: "Can I run several treatments at once?",
    a: "Yes. That's the point. Multiple treatments, each on its own schedule, all resolved into one Today view.",
  },
  {
    q: "Does RxFlow read my prescription automatically?",
    a: "Not today. An uploaded prescription is an encrypted reference document; you structure each treatment by hand and check every instruction before the plan is created. Optional AI-assisted drafting may come later.",
  },
  {
    q: "What happens if I miss a dose?",
    a: "RxFlow records it as missed or skipped, based on what you do. It never decides that you should take an extra dose to make up for it.",
  },
] as const;

export const APP_TAGLINE =
  "Your prescription, turned into a living treatment plan.";
