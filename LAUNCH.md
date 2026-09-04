# Running RxFlow under `bhardwajvaibhav.com/rxflow`

RxFlow is a standalone Next.js app on Netlify (`rxflow-project.netlify.app`).
It can also be **mounted under a subpath** of another site — the personal
portfolio at `bhardwajvaibhav.com` — without merging the two codebases and
without touching the portfolio's root.

```
browser ──▶ bhardwajvaibhav.com/rxflow/*   (portfolio Netlify site)
                     │  200 proxy
                     ▼
        rxflow-project.netlify.app/rxflow/*  (this app, basePath = /rxflow)
```

The mount point is a single env var, so promoting RxFlow back to the root of a
dedicated domain later is an env change, not a code change.

---

## One-time setup

### 1. RxFlow site — Netlify environment variables

Add on `rxflow-project.netlify.app` (Site configuration → Environment variables):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | `/rxflow` |
| `NEXT_PUBLIC_APP_URL` | `https://bhardwajvaibhav.com/rxflow` |
| `AUTH_URL` | `https://bhardwajvaibhav.com/rxflow/api/auth` |

`NEXT_PUBLIC_APP_URL` must include the `/rxflow` suffix. `AUTH_URL` is required
because the proxy hides the real host from the origin, so Auth.js can't infer
its own URL. Then **trigger a deploy** (the build reads `NEXT_PUBLIC_BASE_PATH`
for `next.config.ts`'s `basePath`).

### 2. Portfolio site — one file

In `Vaibhav_Portfolio_version_2026`, add a proxy rewrite. Either in
`netlify.toml`:

```toml
[[redirects]]
  from = "/rxflow/*"
  to = "https://rxflow-project.netlify.app/rxflow/:splat"
  status = 200
  force = true
```

…or in `public/_redirects` (or wherever that repo keeps redirects):

```
/rxflow/*  https://rxflow-project.netlify.app/rxflow/:splat  200!
```

`status = 200` (not 301) keeps the URL bar on `bhardwajvaibhav.com`. Nothing
else in that repo changes; the root site is untouched. Deploy it.

### 3. Telegram webhook (if Telegram reminders are configured)

```bash
NEXT_PUBLIC_APP_URL="https://bhardwajvaibhav.com/rxflow" npm run telegram:setup
```

Registers the webhook at `…/rxflow/api/telegram/webhook`.

### 4. Verify

- `bhardwajvaibhav.com/` — unchanged.
- `bhardwajvaibhav.com/rxflow` — RxFlow marketing page.
- Sign in / demo → the URL stays `bhardwajvaibhav.com/rxflow/dashboard`; every
  in-app link is under `/rxflow`.
- Settings → enable browser notifications → still works (SW registers with scope
  `/rxflow/`).
- Netlify → Functions on the RxFlow site → `tick` still returns `{"ok":true}`.
- `rxflow-project.netlify.app/` → 301 to `/rxflow/` (so the bare origin isn't a
  404).

---

## Local development

`NEXT_PUBLIC_BASE_PATH` is **empty by default** — `npm run dev` serves RxFlow at
`localhost:3000/` exactly as before. To exercise the subpath locally:

```bash
NEXT_PUBLIC_BASE_PATH=/rxflow \
NEXT_PUBLIC_APP_URL=http://localhost:3000/rxflow \
AUTH_URL=http://localhost:3000/rxflow/api/auth \
  npm run build && npm run start
# → http://localhost:3000/rxflow
```

---

## Promoting RxFlow to its own domain (future)

No code changes:

1. Point the domain at the RxFlow Netlify site.
2. Clear `NEXT_PUBLIC_BASE_PATH` (or set to `""`).
3. Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to the new domain (no `/rxflow`).
4. Redeploy.
5. Remove the `/rxflow/*` proxy from the portfolio repo.
6. Re-run `npm run telegram:setup` with the new URL.

`robots.txt` / `sitemap.xml` (which sit at `/rxflow/…` while subpathed) return
to the domain root automatically.
