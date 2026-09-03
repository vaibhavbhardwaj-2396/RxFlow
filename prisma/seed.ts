import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();

/**
 * Seed data for local development.
 *
 * M0: the demo account and a plain dev account.
 * M2+: this grows to load the brief's Section 30 example domain (Shampoo A/B,
 * Multivitamin A/B, Ointment A/B) anchored to Monday 7 September 2026.
 */
interface SeedAccount {
  email: string;
  password: string;
  displayName: string;
  isDemo?: boolean;
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: "demo@regimen.test",
    password: "regimen-demo",
    displayName: "Demo",
    isDemo: true,
  },
  { email: "dev@regimen.test", password: "password123", displayName: "Dev" },
];

async function main() {
  for (const account of ACCOUNTS) {
    await prisma.user.deleteMany({ where: { email: account.email } });
    const user = await prisma.user.create({
      data: {
        email: account.email,
        passwordHash: await hashPassword(account.password),
        displayName: account.displayName,
        isDemo: account.isDemo ?? false,
        emailVerified: new Date(),
        settings: { create: {} },
      },
    });
    console.log(`seeded ${user.email}${user.isDemo ? " (demo)" : ""}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
