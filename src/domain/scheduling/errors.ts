// Named errors the scheduling engine throws. Each maps to a distinct thing the
// caller (or the user) has to resolve — never a silent guess.

/**
 * A `times_per_week` rule with no chosen weekdays. The treatment stays
 * `pending_confirmation` and generates nothing until the user picks days.
 */
export class RecurrenceNeedsConfirmationError extends Error {
  constructor() {
    super(
      "This recurrence needs specific weekdays to be chosen before any " +
        "occurrences can be generated.",
    );
    this.name = "RecurrenceNeedsConfirmationError";
  }
}

/** A relative dose time ("after dinner") with no matching entry in defaultTimes. */
export class UnknownDoseAnchorError extends Error {
  constructor(anchor: string) {
    super(`No default time is configured for the dose anchor "${anchor}".`);
    this.name = "UnknownDoseAnchorError";
  }
}

/** A wall-clock time that does not exist in the target zone on that date. */
export class InvalidWallTimeError extends Error {
  constructor(detail: string) {
    super(`Could not resolve a wall-clock time to an instant: ${detail}`);
    this.name = "InvalidWallTimeError";
  }
}

/** A duration that is missing, zero, negative, or not a whole count. */
export class InvalidDurationError extends Error {
  constructor(detail: string) {
    super(`Invalid duration: ${detail}`);
    this.name = "InvalidDurationError";
  }
}

/** A phase cycle that is empty, repeats a non-positive number of times, or has
 * a step whose duration would not advance the cursor. */
export class InvalidPhaseCycleError extends Error {
  constructor(detail: string) {
    super(`Invalid phase cycle: ${detail}`);
    this.name = "InvalidPhaseCycleError";
  }
}
