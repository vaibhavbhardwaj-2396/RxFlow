@AGENTS.md

# Regimen — project notes for Claude

**What it is:** a prescription → treatment-plan scheduling and adherence app.
It is NOT a medical adviser. It never diagnoses, recommends, alters or invents
instructions. Ambiguity is surfaced to the user, never guessed.

**Source of truth for design:** the architecture assessment
(https://claude.ai/code/artifact/a1d81ed8-346f-41d6-bafd-afa42c3bd22b) and
`~/.claude/plans/okay-before-we-start-greedy-pearl.md`.

## Hard rules

- `src/domain/**` is pure: no `react`, no `next`, no `@prisma/client`, no imports
  from `@/server`, `@/app`, `@/components`. Enforced by ESLint. It takes plain
  inputs and returns plain data.
- Nothing calls `new Date()` / `Date.now()` / `DateTime.now()`. Take a `Clock`
  (`src/domain/time/`). Server code uses `getRequestClock()`.
- The scheduling engine models **recurrence** and **phase availability** as
  independent concepts, intersected to produce occurrences. Interval recurrence
  (alternate-day) keeps a fixed anchor **across breaks** — break days advance the
  interval clock; the rhythm never resets when an active phase resumes.
- Adherence events are append-only. Editing a schedule bumps `scheduleVersion`
  and only regenerates future, un-actioned occurrences.
- `npm run verify` (typecheck + lint + test) must pass before every commit.

## Milestones

M0 scaffold/auth ✅ · M1 recurrence engine + tests (gate) ✅ — `src/domain/`,
recurrence × phase-cycle intersection built now (not deferred) · M2 manual
creation ✅ — wizard → review → confirm → `generateOccurrences` → list; treatment
+ recurrence + phaseCycle + doseTime + occurrence tables; single ACTIVE window
only (cycle builder is M6) · M3 Today dashboard ✅ — doses grouped by time of day,
mark complete/skip/undo, append-only `AdherenceEvent` log, `src/domain/adherence/`
state machine · M4 treatment detail ✅ — `/treatments/[id]` (phase progress
"Day N of M", timeline, adherence history) + edit-schedule: bumps
`scheduleVersion`, deletes only future un-actioned occurrences, regenerates
forward, leaves past + every `AdherenceEvent` intact · M5 calendar ✅ —
`/calendar` day / week (treatment × weekday grid) / month (activity density +
phase-break markers); `prisma/seed.ts` now loads the Section 30 domain onto the
demo account (Mon 7 Sep 2026, incl. Ointment B's 20/7/20 cycle) · M6 the M1 engine's remaining UX (phase-cycle builder, times_per_week
confirm flow, relative-dose settings, per-phase tapering override, "what's
changing" feed) · M7 reminders/missed-sweep · M8 prescription upload +
verification · M9 settings/a11y/conflicts.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TS strict · Tailwind v4 ·
Prisma + local Postgres (`scripts/db.sh`, port 5433) · Auth.js v5 (credentials,
JWT) · Luxon · Vitest. Deploy target: Netlify + Neon (after M2).
