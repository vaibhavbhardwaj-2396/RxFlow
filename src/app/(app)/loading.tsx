/** Shown instantly on every navigation under (app) while the page's data
 * loads on the server. Keeps the shell (header + nav) put and avoids a blank
 * screen. */
export default function AppLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-16 rounded bg-surface-sunken" />
        <div className="h-7 w-2/3 rounded bg-surface-sunken" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-line bg-surface"
          >
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 w-1/3 rounded bg-surface-sunken" />
              <div className="h-3 w-1/2 rounded bg-surface-sunken" />
              <div className="h-3 w-2/5 rounded bg-surface-sunken" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading…
      </span>
    </div>
  );
}
