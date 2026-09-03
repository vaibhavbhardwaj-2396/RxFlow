"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { markNotificationsReadAction } from "@/server/notifications/actions";

/** Marks everything read on mount, then refreshes so the bell clears. */
export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnread) return;
    void markNotificationsReadAction().then(() => router.refresh());
  }, [hasUnread, router]);
  return null;
}
