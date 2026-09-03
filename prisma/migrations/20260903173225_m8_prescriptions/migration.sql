-- CreateEnum
CREATE TYPE "PrescriptionSourceType" AS ENUM ('image', 'pdf');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('uploaded', 'in_review', 'confirmed', 'archived');

-- CreateEnum
CREATE TYPE "PrescriptionItemStatus" AS ENUM ('proposed', 'accepted', 'dismissed');

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "sourceType" "PrescriptionSourceType" NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'uploaded',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "originalName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_extractions" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "parserName" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL,
    "rawResponse" JSONB,
    "structured" JSONB NOT NULL,
    "overallConfidence" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "extractionId" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "extractedFields" JSONB NOT NULL,
    "fieldConfidence" JSONB,
    "ambiguityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PrescriptionItemStatus" NOT NULL DEFAULT 'proposed',
    "treatmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_planId_key" ON "prescriptions"("planId");

-- CreateIndex
CREATE INDEX "prescriptions_userId_createdAt_idx" ON "prescriptions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_extractions_prescriptionId_attempt_key" ON "prescription_extractions"("prescriptionId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_items_treatmentId_key" ON "prescription_items"("treatmentId");

-- CreateIndex
CREATE INDEX "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_extractions" ADD CONSTRAINT "prescription_extractions_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

