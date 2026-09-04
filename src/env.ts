import { z } from "zod";

/**
 * Validated environment access. Import `env` from here instead of reading
 * `process.env` directly, so a missing or malformed variable fails loudly at
 * startup rather than as `undefined` deep in a request.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  // Direct (unpooled) connection for Prisma Migrate. Referenced by
  // schema.prisma; optional here because it is only needed by the CLI.
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16),
  PRESCRIPTION_ENCRYPTION_KEY: z.string().min(16),
  TICK_SECRET: z.string().min(8),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  // URL prefix when RxFlow is mounted under a subpath (e.g. "/rxflow"). Empty =
  // domain root. Must match `basePath` in next.config.ts. NEXT_PUBLIC_APP_URL
  // above is expected to already include this suffix.
  NEXT_PUBLIC_BASE_PATH: z
    .string()
    .default("")
    .refine(
      (v) => v === "" || (/^\/[^/].*$/.test(v) && !v.endsWith("/")),
      'Use "" or a leading-slash path with no trailing slash, e.g. "/rxflow".',
    ),
  FEATURE_PRESCRIPTION_UPLOAD: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // Shows the "Try the demo" button and enables the demo-login action.
  NEXT_PUBLIC_DEMO_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  RESEND_API_KEY: z.string().optional(),

  // Web Push — optional. Generate with `npx web-push generate-vapid-keys`.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(), // "mailto:you@example.com"
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),

  // Telegram bot — optional. Create one with @BotFather.
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),

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

/** Web Push is available only when all its VAPID keys are configured. */
export const webPushEnabled = Boolean(
  env.VAPID_PUBLIC_KEY &&
  env.VAPID_PRIVATE_KEY &&
  env.VAPID_SUBJECT &&
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
);

/** The Telegram channel is available only when a bot token is configured. */
export const telegramEnabled = Boolean(
  env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME,
);

/** The one-click demo account is offered (public showcase deploys). */
export const demoEnabled = env.NEXT_PUBLIC_DEMO_ENABLED;
