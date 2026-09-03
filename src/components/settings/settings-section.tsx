export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div>
        <h2 className="font-display text-base font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
