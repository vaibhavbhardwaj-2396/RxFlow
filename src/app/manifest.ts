import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Regimen",
    short_name: "Regimen",
    description: "Your prescription, turned into a living treatment plan.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f7f4",
    theme_color: "#2f7d5f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
