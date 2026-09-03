import type { PhaseProgress } from "@/lib/phase-progress";

export function PhaseProgressBar({ progress }: { progress: PhaseProgress }) {
  const daysLeft =
    progress.phaseLength !== null && progress.dayOfPhase !== null
      ? Math.max(0, progress.phaseLength - progress.dayOfPhase)
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">{progress.label}</p>
        {daysLeft !== null && daysLeft > 0 && (
          <p className="text-xs text-ink-faint">
            {daysLeft} day{daysLeft === 1 ? "" : "s"} left
          </p>
        )}
      </div>
      {progress.fraction !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${progress.fraction * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
