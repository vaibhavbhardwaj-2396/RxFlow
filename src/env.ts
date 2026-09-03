import { z } from "zod";

/**
 * Validated environment access. Import `env` from here instead of reading
 * `process.env` directly, so a missing or malformed variable fails loudly at
 * startup rather than as `undefined` deep in a request.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  PRESCRIPTION_ENCRYPTION_KEY: z.string().min(16),
  TICK_SECRET: z.string().min(8),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  FEATURE_PRESCRIPTION_UPLOAD: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  RESEND_API_KEY: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
