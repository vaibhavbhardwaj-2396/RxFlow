import { PrismaClient } from "@prisma/client";

import {
  DEMO_DISPLAY_NAME,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  reseedAccount,
} from "../src/server/seed/section30";

const prisma = new PrismaClient();

/**
 * Local dev seed.
 *
 * The demo account carries the Section 30 example domain. Its anchor stays fixed
 * (`SEED_ANCHOR`, default Mon 7 Sep 2026) so time-travel (`?now=`) in dev lands
 * on predictable dates. The live demo uses `/api/internal/demo-reset` instead,
 * which re-anchors to the current week. The plain dev account is left empty to
 * show the fresh-registration experience.
 */
const ANCHOR = process.env.SEED_ANCHOR ?? "2026-09-07";

async function main() {
  const demo = await reseedAccount(prisma, {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    displayName: DEMO_DISPLAY_NAME,
    isDemo: true,
    withSection30: true,
    anchorDate: ANCHOR,
  });
  console.log(`seeded ${demo.email} (demo) — ${demo.treatments} treatments`);

  const dev = await reseedAccount(prisma, {
    email: "dev@regimen.test",
    password: "password123",
    displayName: "Dev",
    anchorDate: ANCHOR,
  });
  console.log(`seeded ${dev.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
