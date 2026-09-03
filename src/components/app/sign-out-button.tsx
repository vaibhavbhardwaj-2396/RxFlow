import { LogOut } from "lucide-react";

import { signOutAction } from "@/server/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <LogOut className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </button>
    </form>
  );
}
