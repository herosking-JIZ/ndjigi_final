-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "trajet_statut" ADD VALUE 'chauffeur_trouve';
ALTER TYPE "trajet_statut" ADD VALUE 'confirme';

-- AlterTable
ALTER TABLE "trajet" ADD COLUMN     "confirmation_chauffeur" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmation_passager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matching_candidats" JSONB,
ADD COLUMN     "matching_demarre_a" TIMESTAMP(6),
ADD COLUMN     "matching_expire_a" TIMESTAMP(6);
