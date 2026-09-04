import path from "node:path";

import type { NextConfig } from "next";

// For testing on a phone over the LAN: set DEV_ALLOWED_ORIGINS in .env to your
// Mac's address, e.g. "192.168.1.23:3000,192.168.1.23".
const devAllowedOrigins = process.env.DEV_ALLOWED_ORIGINS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Serve under a subpath (e.g. "/rxflow" behind another site's proxy). Empty =
// mounted at the domain root. See src/lib/base-path.ts.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  // Pin the workspace root — a stray package-lock.json in the home directory
  // otherwise makes Turbopack guess the wrong root.
  turbopack: { root: path.resolve(import.meta.dirname) },
  experimental: {
    // Keep visited routes in the client cache so tapping around the nav is
    // instant; mutations still call revalidatePath, which clears it.
    staleTimes: { dynamic: 30, static: 300 },
  },
  ...(devAllowedOrigins?.length
    ? { allowedDevOrigins: devAllowedOrigins }
    : {}),
};

export default nextConfig;
