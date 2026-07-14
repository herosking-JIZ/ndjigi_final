/*
  Warnings:

  - You are about to drop the column `id_gestionnaire` on the `journal_parking` table. All the data in the column will be lost.
  - Added the required column `type_mouvement` to the `journal_parking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `etat_vehicule` to the `journal_parking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "statut_validation" AS ENUM ('en_attente', 'valide', 'refuse', 'suspendu');

-- CreateEnum
CREATE TYPE "etat_vehicule" AS ENUM ('bon_etat', 'besoin_maintenance', 'en_maintenance', 'retire');

-- CreateEnum
CREATE TYPE "type_mouvement_parking" AS ENUM ('entree', 'sortie', 'reprise', 'maintenance');

-- DropForeignKey
ALTER TABLE "journal_parking" DROP CONSTRAINT "journal_parking_id_gestionnaire_fkey";

-- DropForeignKey
ALTER TABLE "maintenance" DROP CONSTRAINT "maintenance_id_parking_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_step" DROP CONSTRAINT "maintenance_step_id_maintenance_fkey";

-- DropForeignKey
ALTER TABLE "mouvement_photo" DROP CONSTRAINT "mouvement_photo_id_maintenance_fkey";

-- DropForeignKey
ALTER TABLE "mouvement_photo" DROP CONSTRAINT "mouvement_photo_id_mouvement_fkey";

-- DropIndex
DROP INDEX "idx_journal_parking_utilisateur";

-- DropIndex
DROP INDEX "idx_utilisateur_invitation_token";

-- DropIndex
DROP INDEX "idx_vehicule_parking";

-- AlterTable
ALTER TABLE "journal_parking" DROP COLUMN "id_gestionnaire",
DROP COLUMN "type_mouvement",
ADD COLUMN     "type_mouvement" "type_mouvement_parking" NOT NULL,
DROP COLUMN "etat_vehicule",
ADD COLUMN     "etat_vehicule" "etat_vehicule" NOT NULL,
ALTER COLUMN "id_utilisateur" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "mouvement_photo" ADD CONSTRAINT "mouvement_photo_id_mouvement_fkey" FOREIGN KEY ("id_mouvement") REFERENCES "journal_parking"("id_log") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mouvement_photo" ADD CONSTRAINT "mouvement_photo_id_maintenance_fkey" FOREIGN KEY ("id_maintenance") REFERENCES "maintenance"("id_maintenance") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_id_parking_fkey" FOREIGN KEY ("id_parking") REFERENCES "parking"("id_parking") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_step" ADD CONSTRAINT "maintenance_step_id_maintenance_fkey" FOREIGN KEY ("id_maintenance") REFERENCES "maintenance"("id_maintenance") ON DELETE CASCADE ON UPDATE NO ACTION;
