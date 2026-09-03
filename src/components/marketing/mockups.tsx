import { Bell, Check, Send, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  GROUPS,
  MOCK_PHASE,
  MOCK_TODAY,
  MOCK_WEEK,
} from "@/lib/marketing-content";

/* ------------------------------------------------------------------ *
 * Static, presentational reproductions of real RxFlow UI. No state,
 * no server calls — they exist to show a visitor what the app looks
 * like. Class names track the real components so they stay honest.
 * ------------------------------------------------------------------ */

/** A framed "screen" that reads as the actual app. */
export function AppFrame({
  children,
  label = "Demo",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-line bg-canvas shadow-2xl shadow-ink/10",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-ink">
            RxFlow
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-accent">
            {label}
          </span>
        </div>
        <span className="text-xs text-ink-faint">Today</span>
      </div>
      <div className="min-w-0 p-4">{children}</div>
    </div>
  );
}

function AdherenceBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">
          {completed} of {total} done today
        </p>
        <p className="text-xs text-ink-faint">{total - completed} to go</p>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="bg-accent"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** The Today board — doses grouped by time of day. */
export function TodayMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {MOCK_TODAY.weekday} · {MOCK_TODAY.date}
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">
            Good morning
          </p>
        </div>
      )}
      <AdherenceBar completed={MOCK_TODAY.completed} total={MOCK_TODAY.total} />
      {MOCK_TODAY.sections.map((section, si) => (
        <div key={section.label} className="flex flex-col gap-1.5">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {section.label}
          </h4>
          <ul className="flex flex-col gap-1.5">
            {section.doses.map((dose) => {
              const done = si < 3;
              return (
                <li
                  key={dose.name}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5",
                    done ? "bg-surface-sunken" : "bg-surface",
                  )}
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-ink-faint">
                      {dose.time}
                    </span>
                    <p
                      className={cn(
                        "truncate font-medium",
                        done ? "text-ink-muted line-through" : "text-ink",
                      )}
                    >
                      {dose.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {dose.note}
                    </p>
                  </div>
                  {done ? (
                    <span className="text-xs text-ink-muted">Done</span>
                  ) : (
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent bg-accent text-accent-ink">
                      <Check className="size-4" aria-hidden />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Treatment × weekday grid, dot on active days. Mirrors the calendar week view. */
export function WeekMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          This week
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th />
              {MOCK_WEEK.days.map((d, i) => (
                <th
                  key={d}
                  className={cn(
                    "px-1 pb-2 pt-3 text-center text-[0.6rem] font-medium uppercase tracking-wide",
                    i === 0 ? "text-accent" : "text-ink-faint",
                  )}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_WEEK.rows.map((row) => (
              <tr key={row.name}>
                <th className="whitespace-nowrap py-2 pl-4 pr-3 text-left align-middle font-medium text-ink">
                  {row.name}
                </th>
                {MOCK_WEEK.days.map((_, di) => {
                  const on = row.on.includes(di + 1);
                  return (
                    <td
                      key={di}
                      className={cn(
                        "border-t border-line px-1 py-2 text-center align-middle",
                        di === 0 && "bg-accent-soft/40",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-2 rounded-full",
                          on ? "bg-accent" : "border border-line",
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[0.7rem] text-ink-faint">
        <span className="inline-block size-2 rounded-full bg-accent" /> dose
        <span className="ml-3 inline-block size-2 rounded-full border border-line" />{" "}
        rest day
      </div>
    </div>
  );
}

/** Horizontal ACTIVE / BREAK / ACTIVE timeline for a phased treatment. */
export function PhaseTimeline() {
  const total = MOCK_PHASE.totalDays;
  const herePct = (MOCK_PHASE.dayOf / total) * 100;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg font-semibold text-ink">
          {MOCK_PHASE.treatment}
        </p>
        <p className="text-sm text-ink-muted">
          Day {MOCK_PHASE.dayOf} of {MOCK_PHASE.totalDays}
        </p>
      </div>

      <div className="relative mt-6">
        <div className="flex gap-1.5">
          {MOCK_PHASE.segments.map((seg, i) => (
            <div
              key={i}
              style={{ flexGrow: seg.days }}
              className={cn(
                "flex h-11 items-center justify-center rounded-lg border text-[0.7rem] font-medium uppercase tracking-wide",
                seg.kind === "active"
                  ? "border-accent/30 bg-accent-soft text-accent"
                  : "border-line bg-surface-sunken text-ink-faint",
              )}
            >
              {seg.label}
            </div>
          ))}
        </div>
        <div
          className="absolute -top-1.5 bottom-[-0.375rem] w-0.5 rounded-full bg-ink"
          style={{ left: `calc(${herePct}% - 1px)` }}
          aria-hidden
        >
          <span className="absolute -left-[3.5px] -top-1.5 size-2 rounded-full bg-ink" />
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[0.7rem] text-ink-faint">
        {MOCK_PHASE.segments.map((seg, i) => (
          <span key={i}>
            {seg.from}
            {i === MOCK_PHASE.segments.length - 1 ? ` – ${seg.to}` : ""}
          </span>
        ))}
      </div>

      <p className="mt-5 text-sm text-ink-muted">
        <span className="font-medium text-ink">
          {MOCK_PHASE.daysLeftInPhase} days left
        </span>{" "}
        in this phase, then a 7-day break, then 20 more days. RxFlow keeps
        counting through the pause.
      </p>
    </div>
  );
}

/** The raw prescription shorthand — the "before" state. */
export function InstructionNote({
  items,
  className,
}: {
  items: readonly { name: string; rule: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-5 sm:p-6",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        The instructions
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((it) => (
          <li key={it.name} className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-ink">{it.name}</span>
            <span className="font-mono text-[0.8rem] text-ink-muted">
              {it.rule}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A single minimal reminder — name + time + link only. */
export function ReminderPreview({
  channel,
  detail,
}: {
  channel: string;
  detail: string;
}) {
  const Icon = channel === "Telegram" ? Send : Bell;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
        <Icon className="size-3.5" aria-hidden />
        {channel}
      </div>
      <div className="rounded-xl border border-line bg-surface-sunken px-3 py-2.5">
        <p className="text-sm font-medium text-ink">RxFlow · Ointment B</p>
        <p className="text-xs text-ink-muted">Due at 10:30 PM · open</p>
      </div>
      <p className="text-xs text-ink-muted">{detail}</p>
    </div>
  );
}

/** Two treatment groups, colour-dotted, as on the treatments screen. */
export function GroupsMockup() {
  const dots = ["bg-warn", "bg-accent"];
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {GROUPS.map((g, gi) => (
        <div
          key={g.name}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <div className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", dots[gi])} />
            <span className="font-display text-base font-semibold text-ink">
              {g.name}
            </span>
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-ink-muted">
              {g.kind}
            </span>
          </div>
          <p className="text-xs text-ink-faint">{g.meta}</p>
          <ul className="flex flex-col gap-1.5">
            {g.treatments.map((t) => (
              <li
                key={t}
                className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** A mini 7-day strip showing which days a pattern lands on. */
export function PatternStrip({
  label,
  on,
  caption,
}: {
  label: string;
  on: readonly number[];
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span
            key={i}
            className={cn(
              "flex size-7 items-center justify-center rounded-md text-[0.7rem] font-medium",
              on.includes(i + 1)
                ? "bg-accent text-accent-ink"
                : "bg-surface-sunken text-ink-faint",
            )}
          >
            {d}
          </span>
        ))}
      </div>
      {caption && <p className="text-xs text-ink-muted">{caption}</p>}
    </div>
  );
}

/** Generic reminder vs RxFlow. */
export function CompareCard({
  kind,
  children,
}: {
  kind: "plain" | "rxflow";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 sm:p-6",
        kind === "rxflow"
          ? "border-accent/40 bg-accent-soft/40"
          : "border-line bg-surface",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.14em]",
          kind === "rxflow" ? "text-accent" : "text-ink-faint",
        )}
      >
        {kind === "rxflow" ? "RxFlow" : "A generic reminder"}
      </p>
      {children}
    </div>
  );
}

export { Check, X };
