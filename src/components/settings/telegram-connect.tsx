"use client";

import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  disconnectTelegramAction,
  startTelegramLinkAction,
  telegramStatusAction,
} from "@/server/settings/actions";

export function TelegramConnect({
  connected: initial,
}: {
  connected: boolean;
}) {
  const [connected, setConnected] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const connect = () => {
    setError(null);
    startTransition(async () => {
      const result = await startTelegramLinkAction();
      if (result.error || !result.url) {
        setError(result.error ?? "Could not start the connection.");
        return;
      }
      window.open(result.url, "_blank", "noopener");
      setWaiting(true);
      // Poll for the link to complete (the tick job records it).
      const started = Date.now();
      const poll = async () => {
        const { connected: ok } = await telegramStatusAction();
        if (ok) {
          setConnected(true);
          setWaiting(false);
          return;
        }
        if (Date.now() - started < 120_000) setTimeout(poll, 4000);
        else setWaiting(false);
      };
      setTimeout(poll, 4000);
    });
  };

  const disconnect = () => {
    startTransition(async () => {
      await disconnectTelegramAction();
      setConnected(false);
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Telegram</p>
          <p className="text-xs text-ink-muted">
            {connected
              ? "Connected — reminders arrive as a Telegram message."
              : waiting
                ? "Waiting for you to press Start in Telegram…"
                : "Reminders as a Telegram message (name + time only)."}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={connected ? disconnect : connect}
          className={buttonClass(connected ? "secondary" : "primary", "md")}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
