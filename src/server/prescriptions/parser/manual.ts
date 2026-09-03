import type { PrescriptionParser } from "./port";
import type { ParsedPrescription } from "./types";

/**
 * The default path: nothing is read from the file. The user structures each
 * treatment by hand from what their doctor told them, using the uploaded
 * document only as a reference they can look at.
 *
 * This is deliberately not "empty OCR" — it is the product's foundation. An
 * AI parser, when added, becomes a convenience that pre-fills these same cards
 * for the user to confirm.
 */
export const manualParser: PrescriptionParser = {
  name: "manual",
  version: "1",
  available: () => true,
  async parse(): Promise<ParsedPrescription> {
    return {
      items: [],
      notes:
        "Add each treatment your prescription lists, then review every card.",
    };
  },
};
