import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  heading?: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  /** Visual weight — "spine" sections get a little more air. */
  tone?: "default" | "spine";
  /** Background band. */
  surface?: "canvas" | "sunken" | "ink";
  /** Header block alignment. */
  align?: "center" | "left";
  className?: string;
}

export function Section({
  id,
  eyebrow,
  heading,
  lede,
  children,
  tone = "default",
  surface = "canvas",
  align = "center",
  className,
}: SectionProps) {
  const hasHeader = Boolean(eyebrow || heading || lede);
  const onInk = surface === "ink";

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        tone === "spine" ? "py-20 sm:py-28" : "py-14 sm:py-20",
        surface === "sunken" && "bg-surface-sunken",
        onInk && "bg-ink text-[color:var(--canvas)]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        {hasHeader && (
          <div
            className={cn(
              "max-w-3xl",
              align === "center" && "mx-auto text-center",
            )}
          >
            {eyebrow && (
              <p
                className={cn(
                  "text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
                  onInk ? "text-[color:var(--accent)]" : "text-accent",
                )}
              >
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2
                className={cn(
                  "mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[1.1]",
                  onInk ? "text-[color:var(--canvas)]" : "text-ink",
                )}
              >
                {heading}
              </h2>
            )}
            {lede && (
              <p
                className={cn(
                  "mt-4 text-pretty text-lg leading-relaxed",
                  onInk
                    ? "text-[color:var(--surface-sunken)]"
                    : "text-ink-muted",
                )}
              >
                {lede}
              </p>
            )}
          </div>
        )}
        {children && (
          <div className={cn(hasHeader && "mt-8 sm:mt-10")}>{children}</div>
        )}
      </div>
    </section>
  );
}
