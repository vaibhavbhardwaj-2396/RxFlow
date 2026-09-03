import type { Prisma } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/client";

export interface NewUserInput {
  email: string;
  password: string;
  displayName?: string;
  timezone?: string;
  isDemo?: boolean;
  emailVerified?: Date | null;
}

/**
 * Create a user together with a default `UserSettings` row, in one transaction.
 * Used by registration and by the seed script.
 */
export async function provisionUser(
  input: NewUserInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const passwordHash = await hashPassword(input.password);
  return client.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      timezone: input.timezone ?? "Asia/Kolkata",
      isDemo: input.isDemo ?? false,
      emailVerified: input.emailVerified ?? null,
      settings: { create: {} },
    },
    include: { settings: true },
  });
}
