// Adherence — the occurrence state machine and neutral day/period stats. Pure:
// plain inputs, plain data out, no I/O. See the assessment (section 03/04).

export {
  type AdherenceAction,
  type AdherenceEventType,
  type OccurrenceStatus,
  InvalidAdherenceActionError,
  applyAdherenceAction,
  isPending,
  isSettled,
} from "./state";
export { type AdherenceSummary, summariseStatuses } from "./stats";
