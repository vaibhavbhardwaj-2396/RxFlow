import { FileText, Upload } from "lucide-react";

import { PERSONAS, REMINDER_CHANNELS } from "@/lib/marketing-content";

import {
  AppFrame,
  GroupsMockup,
  ReminderPreview,
  TodayMockup,
  WeekMockup,
} from "./mockups";
import { Section } from "./section";

export function TodayAndCalendar() {
  return (
    <Section
      tone="spine"
      align="left"
      eyebrow="Today"
      heading="When it matters, RxFlow gets out of the way."
      lede="On a normal morning you don't want a plan — you want a short list. Everything else is one tap away when you need the bigger picture."
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,19rem)_1fr]">
        <AppFrame>
          <TodayMockup compact />
        </AppFrame>
        <div className="flex flex-col gap-5">
          <WeekMockup />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                This week
              </p>
              <p className="mt-2 text-sm text-ink">
                <span className="font-medium">6 completed</span> · 1 skipped · 1
                missed
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Follow-through without guilt — no streaks to protect, no score
                to chase.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-ink">Ointment A</p>
                <p className="text-sm text-ink-muted">86%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: "86%" }}
                />
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Complete, skip, undo. See what happened, plainly.
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            Step back and the same plan becomes a week grid and a month view —
            one temporal model, three zoom levels.
          </p>
        </div>
      </div>
    </Section>
  );
}

export function RemindersAndPrescription() {
  return (
    <Section
      surface="sunken"
      align="left"
      eyebrow="Reminders & prescriptions"
      heading="Meet the plan where you already are — starting from what you already have."
      lede="Choose how RxFlow nudges you. Bring your prescription as a reference. Neither one changes what's in the plan without you."
    >
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {REMINDER_CHANNELS.map((c) => (
            <ReminderPreview
              key={c.channel}
              channel={c.channel}
              detail={c.detail}
            />
          ))}
        </div>
        <p className="text-sm text-ink-muted">
          A reminder carries a treatment name, a time and a link — never the
          dose or the instructions. Both extra channels stay off until you turn
          them on.
        </p>

        <div className="grid items-center gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-canvas text-ink-muted">
              <Upload className="size-5" aria-hidden />
            </span>
            <span className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-canvas text-ink-muted">
              <FileText className="size-5" aria-hidden />
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-semibold text-ink">
              Start with the instructions you already have.
            </h3>
            <p className="text-sm text-ink-muted">
              Upload a photo or PDF of your prescription. You structure each
              treatment by hand and check every instruction against the document
              before the plan is created. RxFlow never decides what your
              prescriber meant — that&rsquo;s the whole point.
            </p>
            <p className="text-sm text-ink-faint">
              Coming later: optional help turning a reference document into
              draft entries you still review.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function GroupsAndAudience() {
  return (
    <Section
      align="left"
      eyebrow="Groups"
      heading="Keep related treatments together."
      lede="A dermatology course, a set of daily supplements, a travel kit — group them so the plan reads the way you think about it. Groups never change how anything is scheduled."
    >
      <div className="flex flex-col gap-10">
        <GroupsMockup />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Who it&rsquo;s for
          </p>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Especially useful when the instructions are more than one thing,
            once a day:
          </p>
          <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {PERSONAS.map((p) => (
              <div key={p.title} className="border-t border-line pt-3 text-sm">
                <span className="font-medium text-ink">{p.title}</span>
                <span className="text-ink-muted"> — {p.body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
