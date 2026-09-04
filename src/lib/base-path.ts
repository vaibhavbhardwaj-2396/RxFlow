/**
 * The app's URL prefix. Empty by default — set `NEXT_PUBLIC_BASE_PATH` (e.g.
 * `/rxflow`) to serve RxFlow under a subpath of another site. `next.config.ts`
 * reads the same variable for Next's own `basePath`, which auto-prefixes
 * `<Link>`, `redirect()`, `_next/*` assets and `/api/*` routes. This helper is
 * only for the few spots Next can't reach: raw `fetch()`, the service worker
 * registration, and the web-app manifest.
 *
 * Value is `""` or a leading-slash segment with no trailing slash (`/rxflow`).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix an app-absolute path with the base path. `withBase("/api/x")`. */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
