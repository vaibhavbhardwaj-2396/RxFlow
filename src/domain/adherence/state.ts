// The occurrence state machine. Pure: given a status and a user action, what is
// the new status and what event gets appended to the (immutable) log.

/** Where an occurrence sits. Mirrors the Prisma `OccurrenceStatus` enum. */
export type OccurrenceStatus =
  "scheduled" | "reminder_sent" | "completed" | "skipped" | "missed";

/** What the user did. */
export type AdherenceAction = "complete" | "skip" | "reopen";

/** What gets written to the log. Mirrors Prisma `AdherenceEventType`. */
export type AdherenceEventType =
  "completed" | "skipped" | "missed" | "reopened";

export class InvalidAdherenceActionError extends Error {
  constructor(status: OccurrenceStatus, action: AdherenceAction) {
    super(`Cannot "${action}" an occurrence that is "${status}".`);
    this.name = "InvalidAdherenceActionError";
  }
}

interface Transition {
  from: readonly OccurrenceStatus[];
  to: OccurrenceStatus;
  event: AdherenceEventType;
}

const TRANSITIONS: Record<AdherenceAction, Transition> = {
  complete: {
    from: ["scheduled", "reminder_sent", "skipped", "missed"],
    to: "completed",
    event: "completed",
  },
  skip: {
    from: ["scheduled", "reminder_sent", "completed", "missed"],
    to: "skipped",
    event: "skipped",
  },
  reopen: {
    from: ["completed", "skipped", "missed"],
    to: "scheduled",
    event: "reopened",
  },
};

/** An occurrence still waiting on the user. */
export function isPending(status: OccurrenceStatus): boolean {
  return status === "scheduled" || status === "reminder_sent";
}

/** An occurrence the user has settled (done or deliberately skipped). */
export function isSettled(status: OccurrenceStatus): boolean {
  return status === "completed" || status === "skipped";
}

/**
 * Apply a user action. Returns the new status and the event to append. Throws
 * {@link InvalidAdherenceActionError} when the action doesn't apply to the
 * current status (e.g. reopening something already scheduled).
 */
export function applyAdherenceAction(
  current: OccurrenceStatus,
  action: AdherenceAction,
): { status: OccurrenceStatus; event: AdherenceEventType } {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(current)) {
    throw new InvalidAdherenceActionError(current, action);
  }
  return { status: transition.to, event: transition.event };
}
