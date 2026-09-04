import type { MetadataRoute } from "next";

import { BASE_PATH, withBase } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RxFlow",
    short_name: "RxFlow",
    description: "Your prescription, turned into a living treatment plan.",
    start_url: withBase("/dashboard"),
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f5f7f4",
    theme_color: "#2f7d5f",
    icons: [
      { src: withBase("/icon.svg"), sizes: "any", type: "image/svg+xml" },
    ],
  };
}
