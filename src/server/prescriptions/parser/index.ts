import { manualParser } from "./manual";
import { ocrAiParser } from "./ocr-ai";
import type { PrescriptionParser } from "./port";

export { PrescriptionParserUnavailableError } from "./port";
export type { PrescriptionParser } from "./port";
export type { ParsedItem, ParsedPrescription, ParserInput } from "./types";

const ALL: PrescriptionParser[] = [manualParser, ocrAiParser];

/** The parsers offered for a new upload in this environment. */
export function availableParsers(): PrescriptionParser[] {
  return ALL.filter((p) => p.available());
}

export function parserByName(name: string): PrescriptionParser | undefined {
  return ALL.find((p) => p.name === name);
}

export { manualParser, ocrAiParser };
