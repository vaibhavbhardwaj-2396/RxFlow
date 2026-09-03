"use client";

import { CalendarDays, FileText, House, Pill, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const BASE_ITEMS = [
  { href: "/dashboard", label: "Today", icon: House },
  { href: "/treatments", label: "Treatments", icon: Pill },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

const SETTINGS_ITEM = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
} as const;

export function BottomNav({
  prescriptionsEnabled = false,
}: {
  prescriptionsEnabled?: boolean;
}) {
  const pathname = usePathname();

  const items = [
    ...BASE_ITEMS,
    ...(prescriptionsEnabled
      ? [{ href: "/prescriptions", label: "Rx", icon: FileText } as const]
      : []),
    SETTINGS_ITEM,
  ];

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
              >
                <span
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium",
                    active ? "text-accent" : "text-ink-faint",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
