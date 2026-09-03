-- CreateEnum
CREATE TYPE "TreatmentCategory" AS ENUM ('medication', 'supplement', 'topical', 'therapy', 'other');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "PhaseKind" AS ENUM ('active', 'break');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('scheduled', 'reminder_sent', 'completed', 'skipped', 'missed');

-- CreateTable
CREATE TABLE "treatment_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TreatmentCategory" NOT NULL,
    "instructionsText" TEXT,
    "doseText" TEXT,
    "anchorDate" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "scheduleVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "TreatmentStatus" NOT NULL DEFAULT 'draft',
    "confirmedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "recurrenceAnchor" TEXT NOT NULL,
    "needsConfirmation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_cycles" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "repeatMode" TEXT NOT NULL,
    "repeatCount" INTEGER,
    "repeatUntil" TEXT,

    CONSTRAINT "phase_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_phases" (
    "id" TEXT NOT NULL,
    "phaseCycleId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "kind" "PhaseKind" NOT NULL,
    "durationKind" TEXT NOT NULL,
    "durationValue" INTEGER,
    "durationUntil" TEXT,
    "ruleOverride" JSONB,
    "label" TEXT,

    CONSTRAINT "treatment_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dose_times" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "clockValue" TEXT,
    "relativeAnchor" TEXT,
    "label" TEXT,

    CONSTRAINT "dose_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_occurrences" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "localDate" TEXT NOT NULL,
    "localTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "timeSpecSnapshot" JSONB NOT NULL,
    "phaseIndex" INTEGER NOT NULL,
    "scheduleVersion" INTEGER NOT NULL,
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_plans_userId_idx" ON "treatment_plans"("userId");

-- CreateIndex
CREATE INDEX "treatments_userId_status_idx" ON "treatments"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_rules_treatmentId_key" ON "recurrence_rules"("treatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "phase_cycles_treatmentId_key" ON "phase_cycles"("treatmentId");

-- CreateIndex
CREATE INDEX "treatment_phases_phaseCycleId_orderIndex_idx" ON "treatment_phases"("phaseCycleId", "orderIndex");

-- CreateIndex
CREATE INDEX "dose_times_treatmentId_orderIndex_idx" ON "dose_times"("treatmentId", "orderIndex");

-- CreateIndex
CREATE INDEX "scheduled_occurrences_userId_localDate_idx" ON "scheduled_occurrences"("userId", "localDate");

-- CreateIndex
CREATE INDEX "scheduled_occurrences_treatmentId_scheduleVersion_status_idx" ON "scheduled_occurrences"("treatmentId", "scheduleVersion", "status");

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_cycles" ADD CONSTRAINT "phase_cycles_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_phases" ADD CONSTRAINT "treatment_phases_phaseCycleId_fkey" FOREIGN KEY ("phaseCycleId") REFERENCES "phase_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dose_times" ADD CONSTRAINT "dose_times_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_occurrences" ADD CONSTRAINT "scheduled_occurrences_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_occurrences" ADD CONSTRAINT "scheduled_occurrences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
