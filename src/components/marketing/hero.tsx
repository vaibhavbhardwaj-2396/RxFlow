import { ArrowRight } from "lucide-react";

import { CtaLink, TryDemoButton } from "./cta-buttons";
import { ProductPreview } from "./product-preview";

export function Hero({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-12 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-20">
        <div className="max-w-xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Treatment management, reimagined
          </p>
          <h1 className="mt-4 text-balance font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Your treatment plan, finally organized.
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-ink-muted">
            A prescription gives you instructions. RxFlow turns them into a
            living plan — the right treatments, on the right days, at the right
            times, through every phase and break.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <TryDemoButton demoEnabled={demoEnabled} size="lg" />
            <CtaLink href="/sign-up" variant="outline" size="lg">
              Create your plan
            </CtaLink>
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            Already have a treatment plan?{" "}
            <a
              href="#see-it"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              See what RxFlow does with it
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </p>
        </div>

        <div className="lg:pl-4">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
