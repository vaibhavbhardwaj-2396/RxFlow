// Scheduling engine — the heart of RxFlow.
//
// Recurrence and phase availability are modelled as independent concepts and
// intersected to produce occurrences. Interval recurrence keeps a fixed anchor
// across breaks. Everything here is pure: plain inputs, plain data out, no
// `Date.now()`, no I/O. See the assessment (section 04) and
// ~/.claude/plans/hidden-jumping-ullman.md.

export {
  type RecurrenceRule,
  type Weekday,
  isOn,
  needsConfirmation,
} from "./recurrence";
export { type Duration, windowEndExclusive } from "./duration";
export {
  type PhaseCycle,
  type PhaseKind,
  type PhaseTemplate,
  type PhaseWindow,
  type Repeat,
  expandPhaseCycle,
} from "./phase-cycle";
export {
  type DoseTimeSpec,
  type HhMm,
  type ResolvedDoseTime,
  type TimeSpecSnapshot,
  resolveDoseTime,
} from "./dose-time";
export { type QuietHours, inQuietHours, reminderFireAt } from "./reminders";
export { wallTimeToInstant } from "./wall-time";
export {
  type OccurrenceSlot,
  type TimeCluster,
  findTimeConflicts,
} from "./conflicts";
export {
  type GeneratedOccurrence,
  type GenerateInput,
  generateOccurrences,
} from "./generate-occurrences";
export {
  InvalidDurationError,
  InvalidPhaseCycleError,
  InvalidWallTimeError,
  RecurrenceNeedsConfirmationError,
  UnknownDoseAnchorError,
} from "./errors";
