"use client";

import { cn } from "@/lib/cn";

interface ToggleOption {
  value: number;
  label: string;
}

interface ToggleGroupProps {
  legend: string;
  value: number[];
  onChange: (value: number[]) => void;
  options: ReadonlyArray<ToggleOption>;
  error?: string;
}

/** A multi-select button group (used for weekday pickers). */
export function ToggleGroup({
  legend,
  value,
  onChange,
  options,
  error,
}: ToggleGroupProps) {
  const toggle = (v: number) =>
    onChange(
      value.includes(v)
        ? value.filter((x) => x !== v)
        : [...value, v].sort((a, b) => a - b),
    );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(opt.value)}
              className={cn(
                "min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                on
                  ? "border-accent bg-accent text-accent-ink shadow-sm"
                  : "border-line bg-surface text-ink-muted hover:bg-surface-sunken",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
