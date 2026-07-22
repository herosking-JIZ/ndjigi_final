-- CreateEnum
CREATE TYPE "location_statut" AS ENUM ('en_attente', 'active', 'terminee', 'annulee', 'refusee');

-- AlterTable
ALTER TABLE "location" ALTER COLUMN "statut" DROP DEFAULT,
ALTER COLUMN "statut" TYPE "location_statut" USING ("statut"::"location_statut"),
ALTER COLUMN "statut" SET DEFAULT 'en_attente';

-- CreateIndex
CREATE UNIQUE INDEX "uq_avis_evaluateur_location" ON "avis"("id_evaluateur", "id_location");
