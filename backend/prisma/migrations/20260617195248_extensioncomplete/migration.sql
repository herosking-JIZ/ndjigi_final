-- CreateEnum
CREATE TYPE "statut_extension" AS ENUM ('en_attente', 'accepte', 'refuse');

-- AlterTable
ALTER TABLE "demande_extension" ADD COLUMN     "statut" "statut_extension" NOT NULL DEFAULT 'en_attente';
