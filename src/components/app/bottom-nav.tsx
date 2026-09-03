"use client";

import { CalendarDays, House, Pill, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/dashboard", label: "Today", icon: House, ready: true },
  { href: "/treatments", label: "Treatments", icon: Pill, ready: false },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, ready: false },
  { href: "/settings", label: "Settings", icon: Settings, ready: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {ITEMS.map(({ href, label, icon: Icon, ready }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const content = (
            <span
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium",
                active ? "text-accent" : "text-ink-faint",
                !ready && "opacity-60",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              {!ready && <span className="sr-only">(coming soon)</span>}
            </span>
          );

          return (
            <li key={href} className="flex flex-1">
              {ready ? (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title="Coming soon"
                  className="flex flex-1 cursor-not-allowed"
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
