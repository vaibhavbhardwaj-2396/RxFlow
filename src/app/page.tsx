import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarketingHome } from "@/components/marketing/marketing-home";
import { demoEnabled, env } from "@/env";
import { auth } from "@/server/auth";

const DESCRIPTION =
  "RxFlow turns a prescription into a living treatment plan — the right treatments on the right days and times, through every phase and break. A scheduling and adherence tool, not a medical adviser.";

export const metadata: Metadata = {
  title: "RxFlow — turn your treatment plan into something you can follow",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "RxFlow — your prescription, turned into a living treatment plan",
    description: DESCRIPTION,
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: "RxFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RxFlow",
    description: DESCRIPTION,
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RxFlow",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  url: env.NEXT_PUBLIC_APP_URL,
  description: DESCRIPTION,
};

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <MarketingHome demoEnabled={demoEnabled} />
    </>
  );
}
