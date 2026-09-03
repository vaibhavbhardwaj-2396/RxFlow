"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { MOCK_PHASE } from "@/lib/marketing-content";

import { AppFrame, PhaseTimeline, TodayMockup, WeekMockup } from "./mockups";

const TABS = [
  { id: "today", label: "Today" },
  { id: "timeline", label: "Timeline" },
  { id: "calendar", label: "Calendar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductPreview() {
  const [tab, setTab] = useState<TabId>("today");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Preview RxFlow"
        className="inline-flex self-start rounded-xl border border-line bg-surface p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-accent text-accent-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AppFrame>
        <div className="grid min-w-0">
          <Panel active={tab === "today"}>
            <TodayMockup compact />
          </Panel>
          <Panel active={tab === "timeline"}>
            <div className="flex flex-col gap-4">
              <PhaseTimeline />
              <div className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  What&rsquo;s changing
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-ink">{MOCK_PHASE.treatment} break</span>
                  <span className="text-ink-muted">in 12 days</span>
                </div>
              </div>
            </div>
          </Panel>
          <Panel active={tab === "calendar"}>
            <WeekMockup />
          </Panel>
        </div>
      </AppFrame>
    </div>
  );
}

function Panel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      aria-hidden={!active}
      className={cn(
        "col-start-1 row-start-1 min-w-0 transition-opacity duration-300",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {children}
    </div>
  );
}
