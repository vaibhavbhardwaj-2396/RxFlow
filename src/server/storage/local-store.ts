import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/env";

import { decryptBytes, deriveKey, encryptBytes } from "./crypto";
import type { FileStore, StoredFile } from "./file-store";

/**
 * Files land under `<repo>/storage/prescriptions/` (gitignored), each written as
 * two files: `<key>` holds the AES-256-GCM blob, `<key>.meta` holds the MIME
 * type. The directory is created on demand.
 */
export class EncryptedLocalFileStore implements FileStore {
  private readonly root: string;
  private readonly key: Buffer;

  constructor(root?: string) {
    this.root = root ?? path.join(process.cwd(), "storage", "prescriptions");
    this.key = deriveKey(env.PRESCRIPTION_ENCRYPTION_KEY);
  }

  private resolve(key: string): string {
    // Guard against traversal — keys are caller-built but never trust them.
    const target = path.resolve(this.root, key);
    if (target !== this.root && !target.startsWith(this.root + path.sep)) {
      throw new Error("Refusing a storage key outside the store root.");
    }
    return target;
  }

  async put(key: string, bytes: Buffer, mimeType: string): Promise<void> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, encryptBytes(bytes, this.key));
    await writeFile(`${target}.meta`, mimeType, "utf8");
  }

  async get(key: string): Promise<StoredFile> {
    const target = this.resolve(key);
    const [blob, mimeType] = await Promise.all([
      readFile(target),
      readFile(`${target}.meta`, "utf8").catch(
        () => "application/octet-stream",
      ),
    ]);
    return { bytes: decryptBytes(blob, this.key), mimeType: mimeType.trim() };
  }

  async delete(key: string): Promise<void> {
    const target = this.resolve(key);
    await Promise.all([
      rm(target, { force: true }),
      rm(`${target}.meta`, { force: true }),
    ]);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await readFile(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
