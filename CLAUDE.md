@AGENTS.md

# RxFlow — project notes for Claude

**What it is:** RxFlow, a prescription → treatment-plan scheduling and adherence
app. It is NOT a medical adviser. It never diagnoses, recommends, alters or
invents instructions. Ambiguity is surfaced to the user, never guessed.
(Some internal identifiers — the `regimen_dev` DB, the `regimen_sim_now` cookie,
`*@regimen.test` seed emails — keep the old name deliberately; the rename was
user-facing only.)

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
demo account (Mon 7 Sep 2026, incl. Ointment B's 20/7/20 cycle) · M6 phase-cycle
builder + confirm flow ✅ — wizard "Repeating cycle" step (ACTIVE/BREAK segments +
once/count/until/forever), editable cycles, `times_per_week` → "which days?"
banner with even-spread suggestion, "What's changing" feed. **Deferred to M9:**
default-times editor + relative-occurrence re-resolution, per-phase `ruleOverride`
tapering (schema fields kept intact) · M7 reminders/missed-sweep ✅ — idempotent
`tick` job (`npm run tick` → secret-guarded `POST /api/internal/tick`): sweep
overdue → `missed` (+ `missed` `AdherenceEvent`, `source: tick`), materialise
`Reminder` rows at `reminderFireAt` (lead time, quiet-hours push-out), dispatch
due ones, roll the 90-day horizon forward. Abstract `NotificationChannel` port:
in-app (always on, `NotificationLog` + `/notifications` centre + unread bell),
Web Push (VAPID + `public/sw.js`, env-gated), Telegram (`/start` deep-link poll,
env-gated). Notifications carry name + time + deep link only — never dose or
instructions. `/settings` reminders section; per-treatment reminders toggle ·
M8 prescription upload + manual verify ✅ — **manual-first**: an uploaded
prescription is an optional *encrypted reference document*, never authoritative
schedule data. `POST /api/prescriptions` (route handler, `formData`) →
`EncryptedLocalFileStore` (AES-256-GCM under gitignored `./storage`, opaque
`storageKey`); the file is served ONLY by `GET /api/prescriptions/[id]/file`
(auth + ownership + `no-store`). `PrescriptionParser` port —
`manualParser` (real, infers nothing) + `ocrAiParser` (documented stub,
`available: () => false`). `/prescriptions` library + `/prescriptions/[id]`
plan builder: reuses `TreatmentWizard` per card, mandatory per-card "checked
against my prescription" + blocking `needsDayChoice`, `confirmPrescriptionPlanAction`
→ one `TreatmentPlan` + `PrescriptionExtraction` (manual) + N `PrescriptionItem`
+ `persistTreatmentFromDraft` (shared with `create.ts`). Feature-gated by
`FEATURE_PRESCRIPTION_UPLOAD` (nav "Rx" tab + routes + upload all check it) ·
M9 settings/lifecycle/a11y ✅ — `/settings` gains **Profile** (name + IANA
timezone) and a **Default-times editor**; both call
`reresolveFutureOccurrences` (`src/server/occurrences/reresolve.ts`) — future
un-actioned occurrences whose `timeSpecSnapshot` resolves differently get their
`localTime`/`scheduledAt`/snapshot rewritten and pending `Reminder`s dropped;
completed/skipped/missed rows are untouched. Domain `wallTimeToInstant`
extracted for reuse. **Hard delete + file shred**
(`src/server/account/delete.ts`): `deleteTreatmentAction` (rows + occurrences +
adherence + notification logs; empty non-prescription plan too),
`deletePrescriptionAction` (`fileStore.delete` then row cascade),
`deleteAccountAction` (typed-email confirm → shred every file → `user.delete`
cascade → `signOut` → `/goodbye`). `GET /api/account/export` streams all
user-owned data as JSON (files by URL, not bytes). **Schedule-overlap notice**:
pure `findTimeConflicts` (`src/domain/scheduling/conflicts.ts`) → dashboard
`ConflictNotice` — same-minute clusters of 2+ treatments, neutral wording,
never a medical claim. **a11y**: skip link + `<main id>`, `aria-live` on dose
actions, native-`<dialog>` `ConfirmDialog` (focus trap + return), wizard focus
moves to the step heading. `Treatment.deletedAt` dropped (real delete
replaces it). **Renamed Regimen → RxFlow** across the UI/metadata/comments.

**Post-MVP · Deploy** — Netlify (Next.js runtime) + Neon Postgres,
GitHub-connected; `netlify.toml` runs `prisma migrate deploy` in the build; two
Netlify scheduled functions (`netlify/functions/`) run the `tick` job every 15
min and re-seed the demo nightly. `neon` CLI linked (project `divine-mud-18655802`
"RxFlow"), Neon Auth off (Auth.js stays), `.claude/skills/` vendored. See
`DEPLOY.md`. **Post-MVP · Perf** — `(app)/loading.tsx` + `staleTimes` +
`<Link prefetch>` + session-carried timezone → navigation is a client-cache hit
(~60 ms, 0 RSC). **Post-MVP · Groups** — `TreatmentPlan` surfaced in the UI as a
**Group** (`+ GroupKind {ongoing,course}`, `color`, `archivedAt`): `/treatments`
grouped by group (header = colour dot + kind badge + inferred course-end),
`/treatments/groups/{new,[id]/edit}`, `src/server/treatments/group-actions.ts`
(create/update/archive/move), a "shadow" solo plan renders flat under "Ungrouped"
(`src/lib/group-shape.ts` `isNamedGroup`), move a treatment from its detail page,
wizard "Group" field, a group colour dot on dashboard dose rows. Groups are
organizational only — never touch scheduling. **Post-MVP · Notifications live** —
the M7 channels wired up for the deploy: `netlify/functions/tick.mts` → every
5 min; `POST /api/telegram/webhook` (secret_token = `TICK_SECRET`) so `/start`
linking is instant on serverless (`handleTelegramUpdate` shared with the tick's
`getUpdates` poll, which self-disables once a webhook is set); `npm run
telegram:setup` registers it. Web Push is config-only (4 `VAPID_*` env vars) —
fixed a latent hydration bug in `browser-notifications-toggle.tsx` (client-only
`Notification.permission` read → `useSyncExternalStore`). See `NOTIFICATIONS.md`.

**Post-MVP · Wizard UX pass** — feedback from live use. `Treatment.medicineName`
(optional brand/drug name, migration `20260904004650_treatment_medicine_name`,
distinct from the free-text `name`; shows on detail + review + export). Basics
step: medicine field, Group picker always shown in the standalone create flow
(`showGroupPicker` prop) with an inline "＋ New group" (`create.ts` reads
`newGroupTitle` from raw input, like `groupId`), the two "we never interpret
this" hints removed. Schedule step: "Every other day" → **"Alternate day"**;
`RadioGroup` descriptions disambiguate "Every few days" vs "A few times a week";
**"A few times a week" resolves its days inline** — `DraftRecurrence`
`times_per_week` gained `weekdays: number[]`, auto-filled from
`suggestWeekdays(count)` on select / count-change, editable via a "Change days"
disclosure (`recurrenceInputSchema` + `recurrenceRuleFromInput` pass `weekdays`
through; `configFromRule` / `recurrenceRuleFromRow` already did) — so the manual
wizard never emits a `needsConfirmation` treatment (`ConfirmScheduleForm` stays
for seed/prescription drafts). `ToggleGroup` selected state is now solid;
Weekdays/Weekends quick-picks show an active state. Duration: past-date hint;
"Ongoing" verified loop-safe (`expandPhaseCycle` hard-stops at `horizonEnd`) +
regression test. Dose-times step redesigned — one "when is it taken?" select
(named routine times + "Specific time"); a routine shows `= 8:00 PM · from
Settings` with no competing clock, "Use a different time" falls back to a clock.
`describeWeekdays` → "Weekdays (Mon–Fri)" / "Weekends (Sat–Sun)";
`describeRecurrence` times_per_week+weekdays → "3× a week (Mon, Wed & Fri)".
Wizard nav: step-aware header back (`exitHref`/`exitLabel`), visible footer
"Back". Settings default-times copy rewritten.

**Deferred beyond MVP:** real AI/OCR extraction, per-phase `ruleOverride`
tapering, link-upload-to-existing-plan, S3 driver, calendar-by-group,
group-level adherence rollups — all interfaces kept extensible.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TS strict · Tailwind v4 ·
Prisma + local Postgres (`scripts/db.sh`, port 5433) · Auth.js v5 (credentials,
JWT) · Luxon · Vitest. Deploy target: Netlify + Neon (after M2).
