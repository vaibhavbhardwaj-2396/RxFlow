import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Symmetric encryption for prescription files at rest.
 *
 * Pure and env-free so it can be unit-tested directly — the storage layer
 * derives the key from `PRESCRIPTION_ENCRYPTION_KEY` and passes it in.
 *
 * Blob layout: [12-byte IV][16-byte GCM auth tag][ciphertext]. Any tampering
 * (or a wrong key) fails the auth-tag check and throws on decrypt.
 */

const IV_BYTES = 12;
const TAG_BYTES = 16;
const ALGORITHM = "aes-256-gcm";

/** Stretch an arbitrary-length secret to a 32-byte AES-256 key. */
export function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptBytes(plain: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptBytes(blob: Buffer, key: Buffer): Buffer {
  if (blob.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted blob is too short to be valid.");
  }
  const iv = blob.subarray(0, IV_BYTES);
  const tag = blob.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = blob.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
