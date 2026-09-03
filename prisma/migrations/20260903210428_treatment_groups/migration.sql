-- CreateEnum
CREATE TYPE "GroupKind" AS ENUM ('ongoing', 'course');

-- DropIndex
DROP INDEX "treatment_plans_userId_idx";

-- AlterTable
ALTER TABLE "treatment_plans" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "color" TEXT,
ADD COLUMN     "kind" "GroupKind" NOT NULL DEFAULT 'ongoing';

-- CreateIndex
CREATE INDEX "treatment_plans_userId_archivedAt_idx" ON "treatment_plans"("userId", "archivedAt");

