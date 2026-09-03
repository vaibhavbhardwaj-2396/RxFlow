"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

import { CtaLink, TryDemoButton } from "./cta-buttons";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav({ demoEnabled }: { demoEnabled: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors",
        scrolled || open
          ? "border-b border-line bg-canvas/85 backdrop-blur"
          : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"
      >
        <Link
          href="/"
          className="font-display text-lg font-semibold text-ink"
          onClick={() => setOpen(false)}
        >
          RxFlow
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <CtaLink href="/sign-in" variant="ghost" size="sm">
            Sign in
          </CtaLink>
          <TryDemoButton demoEnabled={demoEnabled} size="sm" />
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="size-5" aria-hidden />
          ) : (
            <Menu className="size-5" aria-hidden />
          )}
        </button>
      </nav>

      {open && (
        <div className="flex h-[calc(100dvh-4rem)] flex-col border-t border-line bg-canvas px-6 pb-10 pt-6 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-lg text-ink hover:bg-surface-sunken"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <TryDemoButton
              demoEnabled={demoEnabled}
              size="md"
              className="w-full"
            />
            <CtaLink
              href="/sign-in"
              variant="outline"
              size="md"
              className="w-full"
            >
              Sign in
            </CtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
