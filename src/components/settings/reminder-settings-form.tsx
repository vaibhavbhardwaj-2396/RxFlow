"use client";

import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/cn";
import type { ReminderSettings } from "@/server/settings/queries";
import { updateReminderSettingsAction } from "@/server/settings/actions";

const LEAD_OPTIONS = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
] as const;

const timeClass =
  "h-11 rounded-lg border border-line bg-surface px-3 text-[0.95rem] text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function ReminderSettingsForm({
  settings,
}: {
  settings: ReminderSettings;
}) {
  const [lead, setLead] = useState(String(settings.reminderLeadMinutes));
  const [quiet, setQuiet] = useState<boolean>(settings.quietHours !== null);
  const [quietStart, setQuietStart] = useState(
    settings.quietHours?.start ?? "22:00",
  );
  const [quietEnd, setQuietEnd] = useState(settings.quietHours?.end ?? "07:00");
  const [remindersEnabled, setRemindersEnabled] = useState(
    settings.remindersEnabled,
  );
  const [wantPush, setWantPush] = useState(
    settings.enabledChannels.includes("web_push"),
  );
  const [wantTelegram, setWantTelegram] = useState(
    settings.enabledChannels.includes("telegram"),
  );

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const channels: string[] = ["in_app"];
      if (settings.webPush.enabled && wantPush) channels.push("web_push");
      if (settings.telegram.enabled && wantTelegram) channels.push("telegram");
      const result = await updateReminderSettingsAction({
        reminderLeadMinutes: Number(lead),
        quietStart: quiet ? quietStart : null,
        quietEnd: quiet ? quietEnd : null,
        channels,
        remindersEnabled,
      });
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">Reminders</span>
        <input
          type="checkbox"
          checked={remindersEnabled}
          onChange={(e) => setRemindersEnabled(e.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
      </label>

      <RadioGroup
        legend="How early?"
        name="lead"
        value={lead}
        onChange={setLead}
        options={LEAD_OPTIONS}
      />

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={quiet}
            onChange={(e) => setQuiet(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          Quiet hours — hold reminders until later
        </label>
        {quiet && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            from
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className={timeClass}
              aria-label="Quiet hours start"
            />
            to
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className={timeClass}
              aria-label="Quiet hours end"
            />
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Where</legend>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked
            disabled
            className="size-4 accent-[var(--accent)]"
          />
          In-app (always on)
        </label>
        {settings.webPush.enabled && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={wantPush}
              onChange={(e) => setWantPush(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Browser notifications
          </label>
        )}
        {settings.telegram.enabled && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={wantTelegram}
              onChange={(e) => setWantTelegram(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Telegram
          </label>
        )}
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={cn(buttonClass("primary", "md"))}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-ok">Saved</span>}
      </div>
    </div>
  );
}
