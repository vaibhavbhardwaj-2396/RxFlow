import { ArrowRight } from "lucide-react";

import { CtaLink, TryDemoButton } from "./cta-buttons";

export function DemoBand({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <section className="bg-surface-sunken py-20 sm:py-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
          See it before you sign up
        </p>
        <h2 className="text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          The demo is a real, filled-in account.
        </h2>
        <p className="max-w-xl text-pretty text-lg text-ink-muted">
          Six treatments with genuine schedule complexity — alternate days, a
          few times a week, a 20/7/20 cycle. Poke around Today, the calendar and
          a treatment&rsquo;s timeline. It resets every night.
        </p>
        <div className="mt-2">
          <TryDemoButton
            demoEnabled={demoEnabled}
            size="lg"
            label="Explore the live demo"
          />
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <section className="bg-ink py-24 text-[color:var(--canvas)] sm:py-32">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-balance font-display text-4xl font-semibold tracking-tight text-[color:var(--canvas)] sm:text-5xl">
          Stop carrying your treatment plan in your head.
        </h2>
        <p className="max-w-xl text-pretty text-lg text-[color:var(--surface-sunken)]">
          RxFlow turns complicated instructions into something you can see,
          follow and understand.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <TryDemoButton
            demoEnabled={demoEnabled}
            size="lg"
            variant="inverse"
          />
          <CtaLink href="/sign-up" variant="inverse-ghost" size="lg">
            Create your account
            <ArrowRight className="size-4" aria-hidden />
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
