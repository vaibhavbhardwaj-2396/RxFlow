# Deploying RxFlow to Netlify + Neon

RxFlow runs on Netlify's Next.js runtime with a Neon Postgres database.
Everything below is a one-time setup; after that, every push to `main` deploys.

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech) (the free tier is enough).
2. From the project dashboard, copy **two** connection strings:
   - the **pooled** one (host contains `-pooler`) → `DATABASE_URL`
   - the **direct** one (no `-pooler`) → `DIRECT_URL`
   Both should end with `?sslmode=require`.

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
   `VAPID_*`, `TELEGRAM_*`, `RESEND_API_KEY` stay unset.

4. **Deploy site.** The build runs `prisma migrate deploy` (applies all
   migrations to the empty Neon DB) then `next build`.

## 3. Seed the demo account (one-time)

From a machine with the repo checked out:

```bash
DATABASE_URL="<neon-direct-url>" DIRECT_URL="<neon-direct-url>" npm run seed:remote
```

This creates `demo@regimen.test` with the Section 30 example plan and an empty
`dev@regimen.test`. After this the **nightly `demo-reset` scheduled function**
keeps the demo account fresh and re-anchored to the current week — you never
need to run the seed again.

## 4. Verify

- Open the site → **Try the demo** → the dashboard loads with real doses.
- Register a new account → it starts empty and is isolated from the demo.
- **Netlify → Functions** shows `tick` (every 15 min) and `demo-reset` (nightly).
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
- **Deploy previews** (PRs) share the same Neon database and run the same
  migrations. Use a separate Neon branch/project for previews if that matters.
- **Email verification is soft** — users can use the app immediately. Wiring
  Resend is a later, standalone-project change.
- The site is intentionally **not** password-protected; privacy comes from
  gating real-data features, not from hiding the URL.
