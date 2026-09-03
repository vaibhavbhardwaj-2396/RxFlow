"use client";

import { useMemo, useState, useTransition } from "react";

import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClass } from "@/components/ui/button";
import type { AccountSettings } from "@/server/settings/queries";
import { updateProfileAction } from "@/server/settings/actions";

const fieldClass =
  "h-11 rounded-lg border border-line bg-surface px-3 text-[0.95rem] text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function timezoneOptions(current: string): string[] {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [current, "UTC"];
  return supported.includes(current) ? supported : [current, ...supported];
}

export function ProfileForm({ settings }: { settings: AccountSettings }) {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zones = useMemo(
    () => timezoneOptions(settings.timezone),
    [settings.timezone],
  );
  const tzChanged = timezone !== settings.timezone;

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction({ displayName, timezone });
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  };

  return (
    <SettingsSection
      title="Profile"
      description="Your name and the timezone all doses are scheduled in."
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Display name</span>
        <input
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setSaved(false);
          }}
          maxLength={80}
          className={fieldClass}
          placeholder="Optional"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          value={settings.email}
          readOnly
          className={`${fieldClass} text-ink-muted`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Timezone</span>
        <select
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        {tzChanged && (
          <span className="text-xs text-warn">
            Future, un-taken doses will be re-timed to this zone. Past doses
            stay as they were.
          </span>
        )}
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={buttonClass("primary", "md")}
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {saved && (
          <span role="status" className="text-sm text-ok">
            Saved.
          </span>
        )}
      </div>
    </SettingsSection>
  );
}
