/**
 * A `TreatmentPlan` row is either a real, user-meaningful **group** or a
 * "shadow" plan that just holds one loose treatment (what manual creation makes
 * by default). Only named groups get a header on the treatments list; shadow
 * plans render their treatment flat under "Ungrouped", and are cleaned up when
 * emptied.
 */
export interface GroupShapeInput {
  title: string;
  kind: "ongoing" | "course";
  color: string | null;
  archivedAt: Date | string | null;
  hasPrescription: boolean;
  /** Names of the treatments currently in the plan. */
  treatmentNames: string[];
}

export function isNamedGroup(plan: GroupShapeInput): boolean {
  if (plan.hasPrescription) return true;
  if (plan.treatmentNames.length !== 1) return true; // 0 = user-made empty, 2+ = grouped
  if (plan.kind === "course") return true;
  if (plan.color != null) return true;
  if (plan.archivedAt != null) return true;
  // A solo plan whose title still matches its one treatment is a shadow.
  return plan.treatmentNames[0] !== plan.title;
}
