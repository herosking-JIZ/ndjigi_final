-- AlterTable
ALTER TABLE "paiement" ALTER COLUMN "type" SET DEFAULT 'en_attente';

-- CreateIndex
CREATE INDEX "idx_paiement_type" ON "paiement"("type");
