/**
 * Runs the background "tick" once, on demand — the same work a cron / Netlify
 * Scheduled Function will run on a timer.
 *
 * M7 fills this in:
 *   - sweep overdue `scheduled` occurrences to `missed` (past the grace window)
 *   - materialise + dispatch due reminders
 *   - extend the rolling occurrence horizon
 */
async function tick() {
  console.log("tick: nothing to do yet — background jobs arrive in M7.");
}

tick().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
