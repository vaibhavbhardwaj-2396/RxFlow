import { cookies } from "next/headers";

import { type Clock, fixedClock, systemClock } from "@/domain/time";
import { isProd } from "@/env";

export const SIM_COOKIE = "regimen_sim_now";

/**
 * The `Clock` for the current request.
 *
 * In production this is always the real system clock. In development it can be
 * frozen to any instant via the `?now=` query param (takes precedence) or the
 * `regimen_sim_now` cookie that the dev toolbar sets — so every date-driven
 * screen can be viewed as if it were any day.
 */
export async function getRequestClock(
  paramNow?: string | string[],
): Promise<Clock> {
  if (isProd) return systemClock;

  const fromParam = Array.isArray(paramNow) ? paramNow[0] : paramNow;
  const raw = fromParam ?? (await cookies()).get(SIM_COOKIE)?.value;
  if (!raw) return systemClock;

  try {
    return fixedClock(normaliseSimInstant(raw));
  } catch {
    return systemClock;
  }
}

/** Whether a simulated clock is currently active (dev only). */
export async function getSimNow(): Promise<string | null> {
  if (isProd) return null;
  return (await cookies()).get(SIM_COOKIE)?.value ?? null;
}

function normaliseSimInstant(raw: string): string {
  // A bare "YYYY-MM-DD" becomes noon UTC that day — the same calendar date in
  // every timezone the product realistically runs in.
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00.000Z` : raw;
}
