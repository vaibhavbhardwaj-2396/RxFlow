/**
 * An even-ish spread of `count` weekdays across the week (1 = Mon … 7 = Sun),
 * offered when a "N times a week" treatment needs the user to pick days. Bounded
 * to 2–7 — the wizard never asks for fewer or more.
 */
const SPREAD: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 3, 5, 7],
  5: [1, 2, 4, 5, 7],
  6: [1, 2, 3, 5, 6, 7],
  7: [1, 2, 3, 4, 5, 6, 7],
};

export function suggestWeekdays(count: number): number[] {
  const clamped = Math.min(7, Math.max(2, Math.round(count)));
  return SPREAD[clamped] ?? [1, 3, 5];
}
