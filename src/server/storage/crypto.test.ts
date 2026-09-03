import { describe, expect, it } from "vitest";

import { decryptBytes, deriveKey, encryptBytes } from "./crypto";

const key = deriveKey("test-only-key-material-0000000000");

describe("prescription file crypto", () => {
  it("round-trips arbitrary bytes", () => {
    const plain = Buffer.from("a prescription image's bytes 📄", "utf8");
    const blob = encryptBytes(plain, key);
    expect(blob.equals(plain)).toBe(false);
    expect(decryptBytes(blob, key).equals(plain)).toBe(true);
  });

  it("round-trips an empty buffer", () => {
    const blob = encryptBytes(Buffer.alloc(0), key);
    expect(decryptBytes(blob, key).length).toBe(0);
  });

  it("uses a fresh IV each time (ciphertext differs for the same input)", () => {
    const plain = Buffer.from("same input");
    expect(encryptBytes(plain, key).equals(encryptBytes(plain, key))).toBe(
      false,
    );
  });

  it("rejects a tampered blob", () => {
    const blob = encryptBytes(Buffer.from("secret"), key);
    blob[blob.length - 1] ^= 0x01;
    expect(() => decryptBytes(blob, key)).toThrow();
  });

  it("rejects the wrong key", () => {
    const blob = encryptBytes(Buffer.from("secret"), key);
    expect(() => decryptBytes(blob, deriveKey("a different secret"))).toThrow();
  });

  it("rejects a truncated blob", () => {
    expect(() => decryptBytes(Buffer.alloc(4), key)).toThrow();
  });
});
