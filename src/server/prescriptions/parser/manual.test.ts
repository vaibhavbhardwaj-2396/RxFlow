import { describe, expect, it } from "vitest";

import { availableParsers, parserByName } from "./index";
import { manualParser } from "./manual";
import { PrescriptionParserUnavailableError } from "./port";
import { ocrAiParser } from "./ocr-ai";

describe("prescription parsers", () => {
  it("the manual parser is always available and infers nothing from the file", async () => {
    expect(manualParser.available()).toBe(true);
    const result = await manualParser.parse({
      bytes: Buffer.from("anything"),
      mimeType: "image/png",
    });
    expect(result.items).toEqual([]);
    expect(result.notes).toBeTruthy();
  });

  it("the ocr_ai parser is a stub that is unavailable and throws", async () => {
    expect(ocrAiParser.available()).toBe(false);
    await expect(
      ocrAiParser.parse({ bytes: Buffer.alloc(0), mimeType: "image/png" }),
    ).rejects.toBeInstanceOf(PrescriptionParserUnavailableError);
  });

  it("only offers the manual parser today", () => {
    expect(availableParsers().map((p) => p.name)).toEqual(["manual"]);
    expect(parserByName("manual")).toBe(manualParser);
    expect(parserByName("nope")).toBeUndefined();
  });
});
