import { Plus } from "lucide-react";

import { FAQ_ITEMS } from "@/lib/marketing-content";

import { Section } from "./section";

export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" heading="Questions people ask first.">
      <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
              <span className="font-display text-lg font-medium text-ink">
                {item.q}
              </span>
              <Plus
                className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-45"
                aria-hidden
              />
            </summary>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-ink-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
