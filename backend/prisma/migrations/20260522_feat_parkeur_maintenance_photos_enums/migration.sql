-- Enums and maintenance table created in migration 20260521_create_maintenance_table
-- This migration only handles the step tracking and photo tables

-- AlterTable journal_parking - Add commentaire
ALTER TABLE "journal_parking" ADD COLUMN "commentaire" TEXT;

-- CreateIndex for journal_parking
CREATE INDEX "idx_journal_parking_parking_date" ON "journal_parking"("id_parking", "date_mouvement");

-- CreateTable maintenance_step
CREATE TABLE "maintenance_step" (
    "id_step" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_maintenance" UUID NOT NULL,
    "statut_ancien" "maintenance_statut",
    "statut_nouveau" "maintenance_statut" NOT NULL,
    "commentaire" TEXT,
    "date_transition" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_step_pkey" PRIMARY KEY ("id_step")
);

-- CreateTable mouvement_photo
CREATE TABLE "mouvement_photo" (
    "id_photo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_mouvement" UUID,
    "id_maintenance" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "fileKey" TEXT NOT NULL,
    "filepath" TEXT,
    "mimeType" VARCHAR(50) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "uploadedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvement_photo_pkey" PRIMARY KEY ("id_photo")
);

-- CreateIndex for maintenance_step
CREATE INDEX "idx_maintenance_step_maintenance_date" ON "maintenance_step"("id_maintenance", "date_transition");

-- CreateIndex for mouvement_photo
CREATE UNIQUE INDEX "mouvement_photo_fileKey_key" ON "mouvement_photo"("fileKey");
CREATE INDEX "idx_mouvement_photo_mouvement" ON "mouvement_photo"("id_mouvement");
CREATE INDEX "idx_mouvement_photo_maintenance" ON "mouvement_photo"("id_maintenance");

-- AddForeignKey maintenance_step -> maintenance
ALTER TABLE "maintenance_step" ADD CONSTRAINT "maintenance_step_id_maintenance_fkey" FOREIGN KEY ("id_maintenance") REFERENCES "maintenance"("id_maintenance") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey mouvement_photo -> journal_parking
ALTER TABLE "mouvement_photo" ADD CONSTRAINT "mouvement_photo_id_mouvement_fkey" FOREIGN KEY ("id_mouvement") REFERENCES "journal_parking"("id_log") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey mouvement_photo -> maintenance
ALTER TABLE "mouvement_photo" ADD CONSTRAINT "mouvement_photo_id_maintenance_fkey" FOREIGN KEY ("id_maintenance") REFERENCES "maintenance"("id_maintenance") ON DELETE CASCADE ON UPDATE CASCADE;
