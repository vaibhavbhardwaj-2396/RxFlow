"use client";

import { cn } from "@/lib/cn";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<RadioOption<T>>;
  error?: string;
  columns?: 1 | 2;
}

/** An accessible radio-card group — native radios styled as selectable cards. */
export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  columns = 1,
}: RadioGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-ink">{legend}</legend>
      <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
        {options.map((opt) => {
          const checked = opt.value === value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                checked
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:bg-surface-sunken",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 size-4 accent-[var(--accent)]"
              />
              <span className="flex flex-col">
                <span className="font-medium text-ink">{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-ink-muted">
                    {opt.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
