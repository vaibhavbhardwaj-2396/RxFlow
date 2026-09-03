/**
 * The shape a prescription parser produces. A parser turns raw file bytes into
 * a set of *proposed* treatments for the user to review — it never creates a
 * treatment or a schedule directly.
 *
 * `fields` is a loose, partial view of the treatment wizard's draft (name,
 * category, doseText, instructionsText, recurrence, window, doseTimes). It is
 * deliberately untyped here so the parser layer stays decoupled from the wizard
 * component; the review UI maps whatever it recognises into a draft and leaves
 * the rest blank.
 */
export interface ParsedItem {
  fields: Record<string, unknown>;
  /** 0..1 per field, when the parser can estimate it. Absent for manual entry. */
  confidence?: Record<string, number>;
  /** Things the parser could not resolve — shown to the user, never guessed. */
  ambiguities: string[];
}

export interface ParsedPrescription {
  items: ParsedItem[];
  notes?: string;
  overallConfidence?: number;
}

export interface ParserInput {
  bytes: Buffer;
  mimeType: string;
}
