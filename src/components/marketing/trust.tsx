import { ShieldCheck } from "lucide-react";

import { PRIVACY_POINTS, TRUST_PRINCIPLES } from "@/lib/marketing-content";

import { Section } from "./section";

export function Trust() {
  return (
    <Section
      align="left"
      eyebrow="Trust & privacy"
      heading="RxFlow organizes instructions. It doesn't invent them."
      lede="This is treatment-adjacent software, so the boundaries matter. RxFlow is a scheduling and adherence tool — not a medical adviser."
    >
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {TRUST_PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-5"
            >
              <ShieldCheck className="size-5 text-accent" aria-hidden />
              <p className="font-display text-base font-semibold text-ink">
                {p.title}
              </p>
              <p className="text-sm leading-snug text-ink-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-ink">
            Your treatment plan is yours.
          </h3>
          <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRIVACY_POINTS.map((p) => (
              <div key={p.title} className="border-t border-line pt-3 text-sm">
                <span className="font-medium text-ink">{p.title}</span>
                <span className="text-ink-muted"> — {p.body}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink-faint">
            RxFlow makes no compliance, certification or medical-outcome claims.
          </p>
        </div>
      </div>
    </Section>
  );
}
