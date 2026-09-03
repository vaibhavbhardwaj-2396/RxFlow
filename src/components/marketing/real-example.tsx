"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { MOCK_TODAY, RAW_INSTRUCTIONS } from "@/lib/marketing-content";

import { InstructionNote } from "./mockups";
import { Section } from "./section";

const TODAY_ROWS = MOCK_TODAY.sections.map((s) => ({
  time: s.doses[0].time,
  name: s.doses[0].name,
  note: s.doses[0].note,
}));

const NEXT_STEPS = [
  { head: "Ointment B", body: "finishes in 12 days" },
  { head: "Then", body: "a 7-day break" },
  { head: "Then", body: "20 more days" },
];

/**
 * The centrepiece: the same six treatments as raw instructions, then as a plan.
 * Also carries the "problem" — that question shouldn't need a spreadsheet.
 */
export function RealExample() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(true);

  useEffect(() => {
    const animates =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches &&
      typeof IntersectionObserver !== "undefined";
    const el = ref.current;
    if (!animates || !el) return;

    // Only stage the entrance if the panel starts below the fold.
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight * 0.85) return;

    setStarted(false);
    const reveal = () => setStarted(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    // Safety net: never leave the content hidden.
    const t = setTimeout(reveal, 1600);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  const stepClass = cn(
    "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
    started ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
  );

  return (
    <Section
      id="see-it"
      align="left"
      eyebrow="A real example"
      heading="Your prescription is short. The plan inside it isn't."
      lede={
        <>
          Six treatments, six rhythms, one of them on a cycle. &ldquo;Which one
          do I use tonight?&rdquo; shouldn&rsquo;t need a spreadsheet, a wall
          calendar and a good memory.
        </>
      }
    >
      <div
        ref={ref}
        className="grid items-start gap-6 lg:grid-cols-[1fr_auto_1.15fr] lg:gap-8"
      >
        <InstructionNote items={RAW_INSTRUCTIONS} />

        <div className="flex justify-center text-ink-faint lg:flex-col lg:self-center">
          <ArrowRight className="hidden size-6 lg:block" aria-hidden />
          <ArrowDown className="size-6 lg:hidden" aria-hidden />
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-line bg-canvas shadow-xl shadow-ink/5">
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Monday · Today
            </p>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <ul className="flex flex-col gap-2">
              {TODAY_ROWS.map((r, i) => (
                <li
                  key={r.name}
                  style={{ transitionDelay: started ? `${i * 80}ms` : "0ms" }}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5",
                    stepClass,
                  )}
                >
                  <div>
                    <span className="font-mono text-xs text-ink-faint">
                      {r.time}
                    </span>
                    <p className="font-medium text-ink">{r.name}</p>
                  </div>
                  <span className="text-xs text-ink-muted">{r.note}</span>
                </li>
              ))}
            </ul>

            <div
              style={{
                transitionDelay: started
                  ? `${TODAY_ROWS.length * 80}ms`
                  : "0ms",
              }}
              className={cn(
                "rounded-xl border border-accent/30 bg-accent-soft/40 p-3",
                stepClass,
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Next
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {NEXT_STEPS.map((s, i) => (
                  <p key={i} className="text-sm text-ink">
                    <span className="text-ink-faint">{s.head} </span>
                    {s.body}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
