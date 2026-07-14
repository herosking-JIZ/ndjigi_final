-- AlterTable
ALTER TABLE "trajet" ADD COLUMN     "identite_confirmee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motif_annulation" TEXT;
