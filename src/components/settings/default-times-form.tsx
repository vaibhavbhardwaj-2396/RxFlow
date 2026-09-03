"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";

import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClass } from "@/components/ui/button";
import { humaniseAnchor } from "@/lib/schedule-summary";
import type { AccountSettings } from "@/server/settings/queries";
import { updateDefaultTimesAction } from "@/server/settings/actions";

const timeClass =
  "h-10 rounded-lg border border-line bg-surface px-2 text-[0.95rem] text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
const SLUG_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,23}$/;

interface Row {
  slug: string;
  time: string;
}

export function DefaultTimesForm({ settings }: { settings: AccountSettings }) {
  const [rows, setRows] = useState<Row[]>(() =>
    Object.entries(settings.defaultTimes)
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([slug, time]) => ({ slug, time })),
  );
  const [newSlug, setNewSlug] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = () => {
    setSaved(false);
    setError(null);
  };

  const addRow = () => {
    const slug = newSlug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      setError("Use letters, digits and underscores (max 24 characters).");
      return;
    }
    if (rows.some((r) => r.slug === slug)) {
      setError("You already have a time with that name.");
      return;
    }
    setRows((r) => [...r, { slug, time: "12:00" }]);
    setNewSlug("");
    dirty();
  };

  const save = () => {
    dirty();
    startTransition(async () => {
      const map = Object.fromEntries(rows.map((r) => [r.slug, r.time]));
      const result = await updateDefaultTimesAction(map);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  };

  return (
    <SettingsSection
      title="Default times"
      description="Your routine times. When a dose is scheduled for “Dinner” instead of a fixed clock time, it uses the time you set here — change one and upcoming doses that use it move with it. Doses you’ve already taken, skipped or missed stay as they are."
    >
      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={row.slug} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-ink">
              {humaniseAnchor(row.slug)}
            </span>
            <input
              type="time"
              value={row.time}
              aria-label={`${humaniseAnchor(row.slug)} time`}
              onChange={(e) => {
                setRows((r) =>
                  r.map((x, j) =>
                    j === i ? { ...x, time: e.target.value } : x,
                  ),
                );
                dirty();
              }}
              className={timeClass}
            />
            <button
              type="button"
              onClick={() => {
                setRows((r) => r.filter((_, j) => j !== i));
                dirty();
              }}
              disabled={rows.length === 1}
              aria-label={`Remove ${humaniseAnchor(row.slug)}`}
              className="rounded-md p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-danger disabled:opacity-40"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <input
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="add a name, e.g. midday"
          aria-label="New default-time name"
          className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <button
          type="button"
          onClick={addRow}
          className={buttonClass("secondary", "md")}
        >
          <Plus className="size-4" aria-hidden />
          Add
        </button>
      </div>

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
          {pending ? "Saving…" : "Save times"}
        </button>
        {saved && (
          <span role="status" className="text-sm text-ok">
            Saved — future doses updated.
          </span>
        )}
      </div>
    </SettingsSection>
  );
}
