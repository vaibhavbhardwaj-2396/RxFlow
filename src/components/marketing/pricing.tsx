import { Check } from "lucide-react";

import { cn } from "@/lib/cn";
import { PRICING_TIERS } from "@/lib/marketing-content";

import { CtaLink, TryDemoButton } from "./cta-buttons";
import { Section } from "./section";

export function Pricing({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      heading="Free while we build it."
      lede="RxFlow is in early access. Everything you need to run a treatment plan is free today; a paid tier for heavier use will come later."
    >
      <div className="mx-auto grid max-w-3xl items-start gap-5 sm:grid-cols-2">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "flex flex-col gap-5 rounded-2xl border p-6",
              tier.cta === "primary"
                ? "border-accent/40 bg-surface"
                : "border-line bg-surface-sunken",
            )}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {tier.name}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {tier.price}
              </p>
              <p className="text-sm text-ink-muted">{tier.priceNote}</p>
            </div>
            <p className="text-sm text-ink">{tier.for}</p>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-ink-muted">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      tier.cta === "primary" ? "text-accent" : "text-ink-faint",
                    )}
                    aria-hidden
                  />
                  {f}
                </li>
              ))}
            </ul>
            {tier.cta === "primary" ? (
              <TryDemoButton
                demoEnabled={demoEnabled}
                size="md"
                className="w-full"
              />
            ) : (
              <CtaLink
                href="/sign-up"
                variant="outline"
                size="md"
                className="w-full"
              >
                Create your plan
              </CtaLink>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-ink-faint">
        No card required. No fake numbers here until the real ones are decided.
      </p>
    </Section>
  );
}
