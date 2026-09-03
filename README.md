# Regimen

**Your prescription, turned into a living treatment plan.**

Regimen takes a medical prescription — with its multiple products, schedules,
durations, gaps, tapering patterns and follow-up phases — and turns it into a
structured treatment plan with a calendar, a timeline, reminders and adherence
tracking. It works for medicines, supplements, ointments, shampoos, skincare and
physiotherapy routines alike.

It is a **scheduling and adherence tool**. It never diagnoses, recommends,
alters or invents medical instructions; it faithfully represents what the
prescriber said, and asks the user to clarify anything ambiguous.

---

## Status

**Milestone M0 — scaffold & auth — complete.**

- Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript strict · Tailwind v4
- PostgreSQL (project-local cluster) · Prisma
- Auth.js v5 — email + password (Argon2id), JWT sessions, multi-user
- `Clock` abstraction + dev time-travel (toolbar + `?now=` param)
- Vitest domain test suite (the correctness bar for the scheduling engine)

Next: **M1 — the recurrence engine and its full test suite.** See
[the architecture assessment](https://claude.ai/code/artifact/a1d81ed8-346f-41d6-bafd-afa42c3bd22b)
and `~/.claude/plans/okay-before-we-start-greedy-pearl.md`.

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

---

## Time travel

Everything in Regimen is date-driven, so in development you can view any screen
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

## Security & privacy notes

- Prescriptions are sensitive. Prescription upload (M8) is gated behind
  `FEATURE_PRESCRIPTION_UPLOAD` and stays **off** on any public deployment until
  its encrypted-storage and retention story is built and reviewed.
- No secrets in the repo: `.env` is gitignored, a `secretlint` pre-commit hook
  runs on every commit, and `.env.example` carries placeholders only.
- Seed data is fictional.
