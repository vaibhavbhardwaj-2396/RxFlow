import type { AdherenceSummary } from "@/domain/adherence";

export function AdherenceSummaryBar({
  summary,
}: {
  summary: AdherenceSummary;
}) {
  const { total, completed, skipped, missed, pending } = summary;
  if (total === 0) return null;

  const width = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">
          {completed} of {total} done today
        </p>
        {pending > 0 && (
          <p className="text-xs text-ink-faint">{pending} to go</p>
        )}
      </div>
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-line"
        role="presentation"
      >
        <div style={{ width: width(completed) }} className="bg-accent" />
        <div style={{ width: width(skipped) }} className="bg-ink-faint" />
        <div style={{ width: width(missed) }} className="bg-danger/60" />
      </div>
    </div>
  );
}
