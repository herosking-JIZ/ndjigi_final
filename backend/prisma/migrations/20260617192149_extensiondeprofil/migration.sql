/*
  Warnings:

  - The `statut` column on the `remboursement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `id_agent` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `note_interne` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `priorite` on the `ticket` table. All the data in the column will be lost.
  - The `statut` column on the `ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `faq` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sujet` on the `ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "sujet_ticket" AS ENUM ('probleme_technique', 'question_sur_une_course', 'reclamation', 'autre');

-- CreateEnum
CREATE TYPE "type_extension" AS ENUM ('chauffeur', 'proprietaire');

-- CreateEnum
CREATE TYPE "ticket_statut" AS ENUM ('ouvert', 'en_cours', 'resolu', 'ferme');

-- CreateEnum
CREATE TYPE "ticket_priorite" AS ENUM ('faible', 'normale', 'haute', 'urgente');

-- CreateEnum
CREATE TYPE "remboursement_statut" AS ENUM ('en_attente', 'traite', 'rejete');

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_id_agent_fkey";

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "id_demande_extension" UUID;

-- AlterTable
ALTER TABLE "faq" ADD COLUMN     "categorie" VARCHAR(50),
ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "remboursement" DROP COLUMN "statut",
ADD COLUMN     "statut" "remboursement_statut" NOT NULL DEFAULT 'en_attente';

-- AlterTable
ALTER TABLE "ticket" DROP COLUMN "id_agent",
DROP COLUMN "note_interne",
DROP COLUMN "priorite",
ADD COLUMN     "id_location" UUID,
DROP COLUMN "sujet",
ADD COLUMN     "sujet" "sujet_ticket" NOT NULL,
DROP COLUMN "statut",
ADD COLUMN     "statut" "ticket_statut" NOT NULL DEFAULT 'ouvert';

-- CreateTable
CREATE TABLE "demande_extension" (
    "id_demande_extension" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extension_type" "type_extension" NOT NULL,
    "id_utilisateur" UUID NOT NULL,

    CONSTRAINT "demande_extension_pkey" PRIMARY KEY ("id_demande_extension")
);

-- CreateIndex
CREATE INDEX "idx_faq_ordre" ON "faq"("ordre");

-- CreateIndex
CREATE INDEX "idx_faq_categorie" ON "faq"("categorie");

-- CreateIndex
CREATE INDEX "idx_faq_active" ON "faq"("isActive");

-- CreateIndex
CREATE INDEX "idx_faq_deletedat" ON "faq"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_ticket_statut" ON "ticket"("statut");

-- AddForeignKey
ALTER TABLE "demande_extension" ADD CONSTRAINT "demande_extension_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_demande_extension_fkey" FOREIGN KEY ("id_demande_extension") REFERENCES "demande_extension"("id_demande_extension") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_location_fkey" FOREIGN KEY ("id_location") REFERENCES "location"("id_location") ON DELETE NO ACTION ON UPDATE NO ACTION;
