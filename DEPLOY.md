# Deploying RxFlow to Netlify + Neon

RxFlow runs on **Netlify's Next.js runtime** with a **Neon Postgres** database.
Auth stays as the app's own Auth.js (credentials); Neon is Postgres only.
Everything below is a one-time setup; after that, every push to `main` deploys.

## 1. Database — Neon (already provisioned)

The Neon project **`RxFlow`** (`divine-mud-18655802`, org `winter-union`,
region `aws-us-east-2`, Postgres 18) is created and linked to this repo via the
`neon` CLI (`.neon`, gitignored). Its `production` branch already has all
migrations applied and the demo + dev accounts seeded.

The `neon.ts` policy keeps **Neon Auth off** (`auth: false`) and declares a
scratch `hello.ts` Neon Function (a deploy smoke test — not used by the app).
`neon config apply` / `neon deploy` push that policy.

Get the two connection strings for Netlify from the Neon console (Project →
Connect) or the CLI:

```bash
neon connection-string production --pooled      # → DATABASE_URL
neon connection-string production               # → DIRECT_URL
```

- **pooled** (host has `-pooler`) → `DATABASE_URL`
- **direct** (no `-pooler`) → `DIRECT_URL`

To create a *fresh* Neon project instead: `neon projects create --name RxFlow`,
then `neon link --project-id <id> --branch production`.

## 2. Site — Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → pick the GitHub repo.
2. Leave the build settings as detected — `netlify.toml` sets the build command
   (`npx prisma migrate deploy && npm run build`), the publish dir (`.next`) and
   Node 22. Netlify adds its Next.js runtime automatically.
3. **Site configuration → Environment variables** — add:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** string |
   | `DIRECT_URL` | Neon **direct** string |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `PRESCRIPTION_ENCRYPTION_KEY` | any string ≥ 16 chars (required even though upload is off — `env.ts` validates it) |
   | `TICK_SECRET` | any string ≥ 8 chars (guards the internal job routes) |
   | `NEXT_PUBLIC_APP_URL` | the site URL, e.g. `https://rxflow.netlify.app` |
   | `NEXT_PUBLIC_DEMO_ENABLED` | `true` |

   Leave `FEATURE_PRESCRIPTION_UPLOAD` **unset** (defaults to `false`).
   `RESEND_API_KEY` stays unset. Add `VAPID_*` (Web Push) and `TELEGRAM_BOT_*`
   (Telegram) when you want those reminder channels — see
   [NOTIFICATIONS.md](NOTIFICATIONS.md).

4. **Deploy site.** The build runs `prisma migrate deploy` (a no-op — migrations
   are already applied) then `next build`.

## 3. Seed the demo account

Already done against the linked Neon branch:

```bash
SEED_ANCHOR="$(date -v-7d +%Y-%m-%d)" npm run seed:remote   # anchors ~a week back
```

This created `demo@regimen.test` (Section 30 plan) and an empty
`dev@regimen.test`. From here the **nightly `demo-reset` scheduled function**
keeps the demo fresh and re-anchored — re-run the seed only if you re-create the
database.

## 4. Verify

- Open the site → **Try the demo** → the dashboard loads with real doses.
- Register a new account → it starts empty and is isolated from the demo.
- **Netlify → Functions** shows `tick` (every 5 min) and `demo-reset` (nightly).
- Manually poke the job:
  ```bash
  curl -X POST -H "authorization: Bearer <TICK_SECRET>" \
    https://<site>/api/internal/tick
  # → {"ok":true,"missed":...,"remindersCreated":...}
  ```

## Notes

- **Neon free tier auto-suspends** after ~5 min idle; the first request wakes it
  (~0.5 s). Fine for a demo.
- The **pooled** `DATABASE_URL` runs through PgBouncer. Prisma 6 handles this,
  but if you ever see `prepared statement "s0" already exists`, append
  `?pgbouncer=true` (keep `sslmode=require`).
- **Prescription upload is off** on this deploy — Netlify functions have an
  ephemeral filesystem, so the encrypted file store can't persist. The manual
  treatment wizard is the full experience.
- **Deploy previews** (PRs) share the same Neon `production` branch. `neon.ts`
  has a `preview` block for spinning up ephemeral Neon branches + a `hello.ts`
  function per preview — not wired to Netlify previews, just available.
- **Email verification is soft** — users can use the app immediately. Wiring
  Resend is a later, standalone-project change.
- The `neon` CLI is set up locally: `neon skills` vendored Neon skills into
  `.claude/skills/` (checked in), `neon mcp` registered the Neon MCP server in
  `~/.claude.json`. Local `.env` now points at the Neon branch too — swap
  `DATABASE_URL`/`DIRECT_URL` back to the `127.0.0.1:5433` values to use the
  project-local Postgres instead.
- The site is intentionally **not** password-protected; privacy comes from
  gating real-data features, not from hiding the URL.
