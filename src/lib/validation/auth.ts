import { z } from "zod";

/** Shared email + password shape for sign-in and registration. */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "That password is too long."),
});

export const registerSchema = credentialsSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
