import { PrismaClient } from "@prisma/client";

import { isDev } from "@/env";

// Reuse a single PrismaClient across hot-reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ["warn", "error"] : ["error"],
  });

if (isDev) globalForPrisma.prisma = prisma;
