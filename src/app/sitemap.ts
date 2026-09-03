import type { MetadataRoute } from "next";

import { env } from "@/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/sign-up`, priority: 0.5 },
    { url: `${base}/sign-in`, priority: 0.3 },
  ];
}
