import Link from "next/link";

import { APP_TAGLINE } from "@/lib/marketing-content";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-lg font-semibold text-ink">
              RxFlow
            </p>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">
              {APP_TAGLINE}
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {col.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("#") ? (
                      <a
                        href={l.href}
                        className="text-ink-muted hover:text-ink"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-ink-muted hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-ink-faint">
            RxFlow is a scheduling and adherence tool. It does not provide
            medical advice, diagnosis or treatment recommendations. Always
            follow the instructions of your prescriber or pharmacist, and check
            with them about anything you&rsquo;re unsure of.
          </p>
          <p className="mt-4 text-xs text-ink-faint">© 2026 RxFlow</p>
        </div>
      </div>
    </footer>
  );
}
