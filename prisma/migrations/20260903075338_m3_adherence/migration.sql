-- CreateEnum
CREATE TYPE "AdherenceEventType" AS ENUM ('completed', 'skipped', 'missed', 'reopened');

-- CreateTable
CREATE TABLE "adherence_events" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AdherenceEventType" NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adherence_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adherence_events_occurrenceId_idx" ON "adherence_events"("occurrenceId");

-- CreateIndex
CREATE INDEX "adherence_events_userId_idx" ON "adherence_events"("userId");

-- AddForeignKey
ALTER TABLE "adherence_events" ADD CONSTRAINT "adherence_events_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "scheduled_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adherence_events" ADD CONSTRAINT "adherence_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
