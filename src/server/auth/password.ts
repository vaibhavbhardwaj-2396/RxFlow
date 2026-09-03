import { hash, verify } from "@node-rs/argon2";

// Argon2id parameters — OWASP "second recommended" configuration.
const params = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, params);
}

export function verifyPassword(
  digest: string,
  plain: string,
): Promise<boolean> {
  return verify(digest, plain);
}
