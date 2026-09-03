import type { FileStore } from "./file-store";
import { EncryptedLocalFileStore } from "./local-store";

export type { FileStore, StoredFile } from "./file-store";

/** The process-wide file store. Swap the implementation here for a hosted deploy. */
export const fileStore: FileStore = new EncryptedLocalFileStore();
