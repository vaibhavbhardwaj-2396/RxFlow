/**
 * A place to keep uploaded prescription files. The only implementation today is
 * an encrypted local directory ({@link ./local-store}); an S3-compatible driver
 * would implement the same interface for a hosted deployment.
 *
 * A `key` is opaque and caller-chosen (`"<userId>/<cuid>"`). It is never a URL
 * and never reachable from the browser — files are streamed back only through
 * an authenticated route.
 */
export interface StoredFile {
  bytes: Buffer;
  mimeType: string;
}

export interface FileStore {
  put(key: string, bytes: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
