"use client";

import { useState, useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui/button";
import { withBase } from "@/lib/base-path";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SUBSCRIBE_URL = withBase("/api/push/subscribe");

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const NOOP = () => () => {};

/** The browser's Notification permission, hydration-safe (null on the server). */
function useNotificationPermission(): NotificationPermission | null {
  return useSyncExternalStore(
    NOOP,
    () =>
      typeof Notification !== "undefined" ? Notification.permission : null,
    () => null,
  );
}

export function BrowserNotificationsToggle({
  subscribed: initial,
}: {
  subscribed: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const permission = useNotificationPermission();

  const shownMessage =
    message ??
    (permission === "denied"
      ? "Notifications are blocked in your browser settings. Allow them for this site, then try again."
      : null);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(
          permission === "denied"
            ? "You blocked notifications. In-app reminders still work; enable browser alerts from your site settings if you change your mind."
            : "Permission wasn't granted.",
        );
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID ?? ""),
      });
      const res = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setSubscribed(true);
    } catch {
      setMessage("Could not turn on browser notifications.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(SUBSCRIBE_URL, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Browser notifications</p>
          <p className="text-xs text-ink-muted">
            {subscribed
              ? "On for this device."
              : "Get an alert even when RxFlow isn't open."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={subscribed ? disable : enable}
          className={buttonClass(subscribed ? "secondary" : "primary", "md")}
        >
          {busy ? "…" : subscribed ? "Turn off" : "Enable"}
        </button>
      </div>
      {shownMessage && <p className="text-xs text-warn">{shownMessage}</p>}
    </div>
  );
}
