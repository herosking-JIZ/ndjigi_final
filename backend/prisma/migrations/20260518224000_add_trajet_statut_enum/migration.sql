-- CreateEnum for trajet_statut
CREATE TYPE "trajet_statut" AS ENUM ('en_attente', 'en_cours', 'termine', 'annule');

-- AlterTable: Migrate trajet.statut from VARCHAR to enum
-- First drop the existing default if any
ALTER TABLE "trajet" ALTER COLUMN "statut" DROP DEFAULT;

-- Convert the column type with USING clause
ALTER TABLE "trajet" ALTER COLUMN "statut" TYPE "trajet_statut" USING CASE
  WHEN "statut" = 'en_attente' THEN 'en_attente'::"trajet_statut"
  WHEN "statut" = 'en_cours' THEN 'en_cours'::"trajet_statut"
  WHEN "statut" = 'termine' THEN 'termine'::"trajet_statut"
  WHEN "statut" = 'annule' THEN 'annule'::"trajet_statut"
  ELSE 'en_attente'::"trajet_statut"
END;

-- Set new default
ALTER TABLE "trajet" ALTER COLUMN "statut" SET DEFAULT 'en_attente'::"trajet_statut";
