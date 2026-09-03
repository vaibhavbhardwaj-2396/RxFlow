import type { ParsedPrescription, ParserInput } from "./types";

/**
 * A swappable prescription parser. The MVP ships only {@link ./manual}; an
 * AI/OCR parser ({@link ./ocr-ai}) implements the same interface later without
 * any change to the treatment or scheduling domain.
 */
export interface PrescriptionParser {
  readonly name: string;
  readonly version: string;
  /** Whether this parser can run in the current environment. */
  available(): boolean;
  parse(input: ParserInput): Promise<ParsedPrescription>;
}

/** Thrown when a parser is selected but not configured in this environment. */
export class PrescriptionParserUnavailableError extends Error {
  constructor(parserName: string) {
    super(`The "${parserName}" prescription parser is not available here.`);
    this.name = "PrescriptionParserUnavailableError";
  }
}
