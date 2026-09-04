/**
 * Writes public/_redirects from NEXT_PUBLIC_BASE_PATH. Run first in the Netlify
 * build (see netlify.toml).
 *
 * When the app is served under a subpath (NEXT_PUBLIC_BASE_PATH=/rxflow), a
 * request to this origin's bare "/" isn't a Next route and would 404 — bounce it
 * to the mount point. When the base path is empty (root domain / local), the
 * file is emptied so nothing is redirected.
 */
import { writeFileSync } from "node:fs";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const body = basePath ? `/    ${basePath}/    301\n` : "";

writeFileSync(new URL("../public/_redirects", import.meta.url), body);
console.log(
  basePath
    ? `gen-redirects: / → ${basePath}/`
    : "gen-redirects: no base path, _redirects emptied",
);
