# RxFlow

**Your prescription, turned into a living treatment plan.**

RxFlow takes a medical prescription — with its multiple products, schedules,
durations, gaps, tapering patterns and follow-up phases — and turns it into a
structured treatment plan with a calendar, a timeline, reminders and adherence
tracking. It works for medicines, supplements, ointments, shampoos, skincare and
physiotherapy routines alike.

It is a **scheduling and adherence tool**. It never diagnoses, recommends,
alters or invents medical instructions; it faithfully represents what the
prescriber said, and asks the user to clarify anything ambiguous.

---

## Status

**The MVP is complete — milestones M0–M9.**

- Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript strict · Tailwind v4
- PostgreSQL (project-local cluster) · Prisma
- Auth.js v5 — email + password (Argon2id), JWT sessions, multi-user
- `Clock` abstraction + dev time-travel (toolbar + `?now=` param)
- **Scheduling engine** (`src/domain/`) — recurrence rules × phase-cycle
  intersection, timezone-resolved occurrence generation, exhaustively unit-tested
- **Manual treatment creation** — a wizard that generates every dose on confirm,
  persists the plan, and lists it
- **Today dashboard** — doses grouped by time of day, marked complete / skipped
  explicitly, backed by an append-only adherence log
- **Treatment detail + editing** — phase progress, timeline, adherence history;
  editing the schedule regenerates only future doses and never touches history
- **Calendar** — day / week (treatment × weekday grid) / month (activity density
  + phase-break markers)
- **Phase-cycle builder** — define repeating on/off cycles in the wizard; "N times
  a week" treatments prompt you to pick which days
- **Seed** — `npm run seed` loads the Section 30 example domain onto the demo
  account (anchored Mon 7 Sep 2026), so every screen has real content
- **Reminders & missed-detection** — an idempotent `tick` job sweeps overdue
  doses to `missed`, materialises reminders (lead time + quiet hours), dispatches
  them through an abstracted channel port (in-app always on; Web Push and
  Telegram behind env-var gates), and rolls the occurrence horizon forward.
  Notifications carry only the treatment name, time, and a deep link — never
  dose text or instructions. `/settings` tunes reminders; `/notifications` is the
  in-app centre with an unread bell
- **Prescription upload** — manual-first: upload a photo or PDF as an *encrypted
  reference document* (AES-256-GCM at rest, served only through an authenticated
  `no-store` route — never a public URL), then structure each treatment it lists
  by hand, check every card against the document, and confirm to build the plan.
  A `PrescriptionParser` port keeps a stub in place for an AI "help me fill this
  in" assistant later. Flag-gated by `FEATURE_PRESCRIPTION_UPLOAD` (off on the
  public demo)
- **Settings & data lifecycle** — edit your profile and timezone; edit the named
  "default times" that relative doses resolve to (changing one re-times future,
  un-taken doses only). Download everything as JSON. Delete a treatment, delete
  a prescription (the encrypted file is shredded), or delete your whole account
  behind a typed confirmation — all cascading with no orphaned rows or files
- **Schedule-overlap notice** — the dashboard flags when several doses fall on
  the same minute. It only points out the overlap; it never judges whether
  combining them is safe
- **Accessibility** — skip link, live-announced dose actions, keyboard-first
  wizard and a focus-trapped confirm dialog

Design source: [the architecture assessment](https://claude.ai/code/artifact/a1d81ed8-346f-41d6-bafd-afa42c3bd22b)
and `~/.claude/plans/okay-before-we-start-greedy-pearl.md`. Kept extensible for
later: per-phase tapering (`ruleOverride`) and an AI "help me fill this in"
prescription parser.

---

## Quick start

```bash
cp .env.example .env        # then set AUTH_SECRET (npx auth secret)
npm install                 # also runs prisma generate + lefthook install
npm run db:start            # project-local Postgres on 127.0.0.1:5433
npm run db:migrate          # apply migrations
npm run seed                # demo + dev accounts
npm run dev                 # http://localhost:3000
```

Sign in with **`demo@regimen.test` / `regimen-demo`** (or `dev@regimen.test` /
`password123`).

### Testing on a phone

`npm run dev` binds to `0.0.0.0`. Find your Mac's address with
`ipconfig getifaddr en0` and open `http://<that-address>:3000` on a phone on the
same Wi-Fi. If you see a cross-origin dev warning, set `DEV_ALLOWED_ORIGINS` in
`.env`.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (brings the DB up first) |
| `npm run build` / `start` | Production build / serve |
| `npm run verify` | `typecheck` + `lint` + `test` — run before every commit |
| `npm test` / `test:watch` | Vitest (domain suite) |
| `npm run test:scheduling` | Just the scheduling-engine specs |
| `npm run typecheck` / `lint` / `format` | TypeScript / ESLint / Prettier |
| `npm run db:start` / `db:stop` / `db:status` | Project-local Postgres cluster |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:reset` | Drop, re-migrate, reseed |
| `npm run db:studio` | Prisma Studio |
| `npm run seed` | Load dev seed data |
| `npm run tick` | Run the background job once (missed-sweep + reminders — M7) |
| `npm run tick:watch` | Same, looped every 60s (needs the dev server running) |
| `npm run telegram:setup` | Point the Telegram bot's webhook at the deploy ([NOTIFICATIONS.md](NOTIFICATIONS.md)) |
| `npm run seed:remote` | Seed a remote DB (no local Postgres) — used once against Neon |

---

## Time travel

Everything in RxFlow is date-driven, so in development you can view any screen
as if it were any date — no waiting, no editing seed dates.

- **Dev toolbar** — the strip at the bottom of the app: date picker, ±1 day,
  +1 week, back to live.
- **URL** — add `?now=2026-09-27` to any page.

Both are stripped from production builds. The whole app reads "now" from a
`Clock` service (`src/domain/time/`); nothing calls `new Date()` directly.

---

## Architecture

```
src/
  domain/       pure TypeScript — scheduling, time, adherence. No React, no Prisma, no I/O.
  server/       application services, Prisma repositories, auth, adapters
  app/          Next.js routes (RSC) + API route handlers
  components/    UI — no scheduling math
  lib/          shared client/server utilities, Zod schemas
scripts/db.sh   project-local Postgres cluster
```

An ESLint boundary rule keeps `src/domain/` free of framework and persistence
imports. Full rationale in the assessment linked above.

---

## Deploy

Netlify (Next.js runtime) + Neon Postgres, connected to GitHub so every push to
`main` deploys. `netlify.toml` runs `prisma migrate deploy` before the build;
two scheduled functions (`netlify/functions/`) run the `tick` job every 5
minutes and re-seed the demo account nightly. Prescription upload stays off on
the deploy. **Full walkthrough: [DEPLOY.md](DEPLOY.md)** · reminder channels
(in-app / Web Push / Telegram): **[NOTIFICATIONS.md](NOTIFICATIONS.md)**.

---

## Security & privacy notes

- Prescriptions are sensitive. Upload is gated behind
  `FEATURE_PRESCRIPTION_UPLOAD` and stays **off** on the public demo. Uploaded
  files are AES-256-GCM encrypted at rest in a local store (`./storage`,
  gitignored) under an opaque, user-scoped key, and are only ever returned
  through an authenticated, ownership-checked, `no-store` route — never a public
  or static path. A prescription is treated as a reference document; nothing is
  parsed from it for medical meaning, and the user structures and confirms every
  treatment by hand.
- No secrets in the repo: `.env` is gitignored, a `secretlint` pre-commit hook
  runs on every commit, and `.env.example` carries placeholders only.
- Notifications leave the app only as a treatment name, a time, and a deep link.
  Dose text and verbatim prescription instructions are never sent over Web Push
  or Telegram. Both channels are off unless their keys are configured.
- Deletion is real: removing a treatment, a prescription or an account erases
  the rows and any encrypted files with no soft-delete tombstone. Account
  deletion requires retyping the email and cascades every user-owned record.
  Finishing a treatment is a separate action that never deletes history.
- `GET /api/account/export` returns a signed-in user's full data as JSON;
  prescription files are referenced by their authenticated URL, not embedded.
- Seed data is fictional.
