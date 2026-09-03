// Scheduling engine — the heart of Regimen.
//
// M1 fills this in: RecurrenceRule + `isOn(date)`, duration arithmetic, and
// single-window occurrence generation, all pure and exhaustively tested.
// M6 adds the PhaseCycle expansion and the recurrence x availability
// intersection. See the assessment (section 04) and
// ~/.claude/plans/okay-before-we-start-greedy-pearl.md.

export {};
