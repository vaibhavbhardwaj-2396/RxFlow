import {
  type PrescriptionParser,
  PrescriptionParserUnavailableError,
} from "./port";
import type { ParsedPrescription } from "./types";

/**
 * AI/OCR prescription parser — NOT implemented in the MVP.
 *
 * It exists as a stub so the pipeline (upload → parse attempt → review →
 * confirm) and the {@link ./port PrescriptionParser} interface are already
 * shaped for it. Adding a real implementation must not touch the treatment or
 * scheduling domain.
 *
 * Contract for a future implementation:
 *  - `available()` is gated on an env var (e.g. `ANTHROPIC_API_KEY`); absent ⇒
 *    the manual path is the only one offered.
 *  - The vision/OCR call is opt-in per upload and retains nothing server-side
 *    beyond the `PrescriptionExtraction` audit row.
 *  - Every uncertain field is OMITTED and added to `ambiguities` — the parser
 *    never guesses a schedule, a frequency, or a start date.
 *  - `doseText` / `instructionsText` are copied VERBATIM, never normalised,
 *    expanded, or validated (the app's safety boundary).
 *  - Output is a {@link ./types ParsedPrescription}; the user still reviews and
 *    confirms every card before anything activates.
 */
export const ocrAiParser: PrescriptionParser = {
  name: "ocr_ai",
  version: "0-stub",
  available: () => false,
  async parse(): Promise<ParsedPrescription> {
    throw new PrescriptionParserUnavailableError("ocr_ai");
  },
};
