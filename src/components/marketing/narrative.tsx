import { ArrowRight } from "lucide-react";

import { PATTERNS, PIPELINE_STEPS } from "@/lib/marketing-content";

import { CompareCard, PatternStrip, PhaseTimeline } from "./mockups";
import { Section } from "./section";

export function Pipeline() {
  return (
    <Section
      id="how-it-works"
      surface="sunken"
      eyebrow="How it works"
      heading="From instructions to action."
      lede="RxFlow isn't firing notifications into the void — it keeps every layer connected, so today's list always reflects the plan underneath it."
    >
      <ol className="flex flex-col gap-6 md:flex-row md:gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const last = i === PIPELINE_STEPS.length - 1;
          return (
            <li
              key={step.title}
              className="flex flex-1 items-start gap-3 md:block"
            >
              <div className="flex items-center gap-2 md:mb-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-surface font-mono text-xs text-accent">
                  {i + 1}
                </span>
                {!last && (
                  <span className="hidden flex-1 items-center gap-1 md:flex">
                    <span className="h-px flex-1 bg-line" />
                    <ArrowRight
                      className="size-3.5 shrink-0 text-ink-faint"
                      aria-hidden
                    />
                  </span>
                )}
              </div>
              <div>
                <p className="font-display text-[0.95rem] font-semibold text-ink">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-snug text-ink-muted md:pr-4">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function NotAReminder() {
  return (
    <Section
      id="features"
      tone="spine"
      align="left"
      eyebrow="Not just a reminder"
      heading="A reminder tells you what to do. RxFlow tells you where you are in the plan."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <CompareCard kind="plain">
          <div className="rounded-xl border border-line bg-surface-sunken px-4 py-6 text-center">
            <p className="font-mono text-sm text-ink-faint">20:00</p>
            <p className="mt-1 text-lg font-medium text-ink">Apply ointment</p>
          </div>
          <p className="text-sm text-ink-muted">
            That&rsquo;s all it knows — nothing about the course, the phase, or
            what happens after tonight.
          </p>
        </CompareCard>

        <CompareCard kind="rxflow">
          <div className="rounded-xl border border-line bg-surface px-4 py-4">
            <p className="font-display text-lg font-semibold text-ink">
              Ointment B
            </p>
            <p className="text-sm text-ink-muted">
              Day 8 of 47 · active phase · tonight, 10:30 PM
            </p>
            <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <p className="text-ink">
                <span className="text-ink-faint">Next — </span>12 days left in
                this phase
              </p>
              <p className="text-ink">
                <span className="text-ink-faint">Then — </span>a 7-day break
              </p>
              <p className="text-ink">
                <span className="text-ink-faint">Then — </span>20 more days
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            The same dose, with the context that makes it make sense.
          </p>
        </CompareCard>
      </div>
    </Section>
  );
}

export function ComplexityAndPhases() {
  return (
    <Section
      align="left"
      eyebrow="Complexity, handled"
      heading="However complicated the schedule, it stays understandable."
      lede="You describe the treatment the way it was described to you. RxFlow works out the calendar — even for the ones without a single schedule at all."
    >
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PATTERNS.map((p) => (
            <PatternStrip
              key={p.label}
              label={p.label}
              on={p.on}
              caption={p.caption}
            />
          ))}
        </div>
        <PhaseTimeline />
      </div>
    </Section>
  );
}
