/*
  Warnings:

  - The `statut_validation` column on the `chauffeur` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `statut_disponibilite` column on the `chauffeur` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `id_utilisateur` on the `moyens_paiement` table. All the data in the column will be lost.
  - The `statut` column on the `portefeuille` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `statut_validation` column on the `proprietaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `statut_compte` column on the `utilisateur` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `photos` on the `vehicule` table. All the data in the column will be lost.
  - The `statut` column on the `vehicule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `nom` on the `categorie_vehicule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type_service` on the `chauffeur` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type_reduction` on the `code_promo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "photo_owner_type" AS ENUM ('vehicule', 'utilisateur', 'journal_parking', 'maintenance');

-- CreateEnum
CREATE TYPE "NomCategorie" AS ENUM ('Economique', 'Confort', 'Premium');

-- CreateEnum
CREATE TYPE "typeDocument" AS ENUM ('photos', 'documents_administratifs');

-- CreateEnum
CREATE TYPE "TypeService" AS ENUM ('covoiturage', 'course_plein_temps');

-- CreateEnum
CREATE TYPE "StatutVehicule" AS ENUM ('disponible', 'en_course', 'en_location', 'maintenance', 'retire');

-- CreateEnum
CREATE TYPE "statutvalidation" AS ENUM ('en_attente', 'valide', 'refuse', 'suspendu');

-- CreateEnum
CREATE TYPE "StatutPortefeuille" AS ENUM ('actif', 'bloque');

-- CreateEnum
CREATE TYPE "type_reduction" AS ENUM ('fixe', 'pourcentage');

-- CreateEnum
CREATE TYPE "statut_compte" AS ENUM ('actif', 'inactif', 'suspendu');

-- CreateEnum
CREATE TYPE "StatutDisponibilite" AS ENUM ('en_ligne', 'hors_ligne', 'en_course');

-- DropForeignKey
ALTER TABLE "affectation_vehicule" DROP CONSTRAINT "affectation_vehicule_id_chauffeur_fkey";

-- DropForeignKey
ALTER TABLE "affectation_vehicule" DROP CONSTRAINT "affectation_vehicule_id_vehicule_fkey";

-- DropForeignKey
ALTER TABLE "location" DROP CONSTRAINT "location_id_vehicule_fkey";

-- DropForeignKey
ALTER TABLE "moyens_paiement" DROP CONSTRAINT "moyens_paiement_id_utilisateur_fkey";

-- DropForeignKey
ALTER TABLE "vehicule" DROP CONSTRAINT "vehicule_id_categorie_fkey";

-- DropForeignKey
ALTER TABLE "vehicule" DROP CONSTRAINT "vehicule_id_parking_fkey";

-- DropForeignKey
ALTER TABLE "vehicule" DROP CONSTRAINT "vehicule_id_proprietaire_fkey";

-- DropIndex
DROP INDEX "categorie_vehicule_nom_key";

-- DropIndex
DROP INDEX "idx_moyens_paiement_utilisateur";

-- AlterTable
ALTER TABLE "avis" ADD COLUMN     "id_location" UUID;

-- AlterTable
ALTER TABLE "categorie_vehicule" DROP COLUMN "nom",
ADD COLUMN     "nom" "NomCategorie" NOT NULL;

-- AlterTable
ALTER TABLE "chauffeur" DROP COLUMN "statut_validation",
ADD COLUMN     "statut_validation" "statutvalidation" NOT NULL DEFAULT 'en_attente',
DROP COLUMN "type_service",
ADD COLUMN     "type_service" "TypeService" NOT NULL,
DROP COLUMN "statut_disponibilite",
ADD COLUMN     "statut_disponibilite" "StatutDisponibilite" NOT NULL DEFAULT 'hors_ligne';

-- AlterTable
ALTER TABLE "code_promo" DROP COLUMN "type_reduction",
ADD COLUMN     "type_reduction" "type_reduction" NOT NULL;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "type_document" "typeDocument";

-- AlterTable
ALTER TABLE "incident_securite" ADD COLUMN     "id_location" UUID;

-- AlterTable
ALTER TABLE "moyens_paiement" DROP COLUMN "id_utilisateur";

-- AlterTable
ALTER TABLE "portefeuille" DROP COLUMN "statut",
ADD COLUMN     "statut" "StatutPortefeuille" NOT NULL DEFAULT 'actif';

-- AlterTable
ALTER TABLE "proprietaire" DROP COLUMN "statut_validation",
ADD COLUMN     "statut_validation" "statutvalidation" NOT NULL DEFAULT 'en_attente';

-- AlterTable
ALTER TABLE "utilisateur" DROP COLUMN "statut_compte",
ADD COLUMN     "statut_compte" "statut_compte" NOT NULL DEFAULT 'actif';

-- AlterTable
ALTER TABLE "vehicule" DROP COLUMN "photos",
ADD COLUMN     "fonds_genere" DECIMAL(12,2),
ADD COLUMN     "tarif_base_location" DECIMAL(10,2),
ADD COLUMN     "tarif_par_jour_location" DECIMAL(10,2),
DROP COLUMN "statut",
ADD COLUMN     "statut" "StatutVehicule" NOT NULL DEFAULT 'disponible';

-- DropEnum
DROP TYPE "statut_validation";

-- CreateTable
CREATE TABLE "vehicule_course" (
    "id_vehicule" UUID NOT NULL,
    "type_service" VARCHAR(20) NOT NULL,
    "id_chauffeur" UUID NOT NULL,

    CONSTRAINT "vehicule_course_pkey" PRIMARY KEY ("id_vehicule")
);

-- CreateTable
CREATE TABLE "vehicule_location" (
    "id_vehicule" UUID NOT NULL,

    CONSTRAINT "vehicule_location_pkey" PRIMARY KEY ("id_vehicule")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id_conversation" UUID NOT NULL,
    "id_trajet" UUID,
    "id_location" UUID,
    "id_ticket" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id_conversation")
);

-- CreateTable
CREATE TABLE "conversation_participant" (
    "id_conversation" UUID NOT NULL,
    "id_utilisateur" UUID NOT NULL,

    CONSTRAINT "conversation_participant_pkey" PRIMARY KEY ("id_conversation","id_utilisateur")
);

-- CreateTable
CREATE TABLE "message" (
    "id_message" UUID NOT NULL,
    "id_conversation" UUID NOT NULL,
    "id_expediteur" UUID NOT NULL,
    "nom_expediteur" VARCHAR(100) NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "date_envoi" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_lecture" TIMESTAMP(6),

    CONSTRAINT "message_pkey" PRIMARY KEY ("id_message")
);

-- CreateTable
CREATE TABLE "photo" (
    "id_photo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_type" "photo_owner_type" NOT NULL,
    "id_vehicule" UUID,
    "id_utilisateur" UUID,
    "id_mouvement" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "fileKey" TEXT NOT NULL,
    "filepath" TEXT,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "storageHash" VARCHAR(64),
    "is_principale" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "legende" VARCHAR(255),
    "uploadedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "photo_pkey" PRIMARY KEY ("id_photo")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_id_trajet_key" ON "conversation"("id_trajet");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_id_location_key" ON "conversation"("id_location");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_id_ticket_key" ON "conversation"("id_ticket");

-- CreateIndex
CREATE INDEX "conversation_id_trajet_idx" ON "conversation"("id_trajet");

-- CreateIndex
CREATE INDEX "conversation_id_location_idx" ON "conversation"("id_location");

-- CreateIndex
CREATE INDEX "conversation_id_ticket_idx" ON "conversation"("id_ticket");

-- CreateIndex
CREATE INDEX "conversation_participant_id_utilisateur_idx" ON "conversation_participant"("id_utilisateur");

-- CreateIndex
CREATE INDEX "message_id_conversation_idx" ON "message"("id_conversation");

-- CreateIndex
CREATE INDEX "message_id_expediteur_idx" ON "message"("id_expediteur");

-- CreateIndex
CREATE UNIQUE INDEX "photo_fileKey_key" ON "photo"("fileKey");

-- CreateIndex
CREATE INDEX "photo_owner_type_idx" ON "photo"("owner_type");

-- CreateIndex
CREATE INDEX "idx_photo_vehicule" ON "photo"("id_vehicule");

-- CreateIndex
CREATE INDEX "idx_photo_utilisateur" ON "photo"("id_utilisateur");

-- CreateIndex
CREATE INDEX "idx_avis_evaluateur" ON "avis"("id_evaluateur");

-- CreateIndex
CREATE INDEX "idx_avis_evalue" ON "avis"("id_evalue");

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_id_location_fkey" FOREIGN KEY ("id_location") REFERENCES "location"("id_location") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "incident_securite" ADD CONSTRAINT "incident_securite_id_location_fkey" FOREIGN KEY ("id_location") REFERENCES "location"("id_location") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule_location"("id_vehicule") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_id_proprietaire_fkey" FOREIGN KEY ("id_proprietaire") REFERENCES "proprietaire"("id_proprietaire") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_id_categorie_fkey" FOREIGN KEY ("id_categorie") REFERENCES "categorie_vehicule"("id_categorie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_id_parking_fkey" FOREIGN KEY ("id_parking") REFERENCES "parking"("id_parking") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule_course" ADD CONSTRAINT "vehicule_course_id_chauffeur_fkey" FOREIGN KEY ("id_chauffeur") REFERENCES "chauffeur"("id_chauffeur") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule_course" ADD CONSTRAINT "vehicule_course_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule_location" ADD CONSTRAINT "vehicule_location_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectation_vehicule" ADD CONSTRAINT "affectation_vehicule_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule_course"("id_vehicule") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectation_vehicule" ADD CONSTRAINT "affectation_vehicule_id_chauffeur_fkey" FOREIGN KEY ("id_chauffeur") REFERENCES "chauffeur"("id_chauffeur") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_id_location_fkey" FOREIGN KEY ("id_location") REFERENCES "location"("id_location") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket"("id_ticket") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "conversation"("id_conversation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "conversation"("id_conversation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_id_mouvement_fkey" FOREIGN KEY ("id_mouvement") REFERENCES "journal_parking"("id_log") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_vehicule_chauffeur_actif" RENAME TO "affectation_vehicule_id_vehicule_key";
