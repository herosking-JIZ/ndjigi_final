/*
  Warnings:

  - Added the required column `country_code` to the `contact_de_confiance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contact_de_confiance" ADD COLUMN     "country_code" VARCHAR(6) NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ALTER COLUMN "relation" DROP DEFAULT;

-- CreateTable
CREATE TABLE "trajet_partage" (
    "id_partage" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_trajet" UUID NOT NULL,
    "cree_par" UUID NOT NULL,
    "token" VARCHAR(12) NOT NULL,
    "expire_a" TIMESTAMP(6) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "nb_consultations" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trajet_partage_pkey" PRIMARY KEY ("id_partage")
);

-- CreateIndex
CREATE UNIQUE INDEX "trajet_partage_token_key" ON "trajet_partage"("token");

-- CreateIndex
CREATE INDEX "idx_trajet_partage_token" ON "trajet_partage"("token");

-- CreateIndex
CREATE INDEX "idx_trajet_partage_trajet" ON "trajet_partage"("id_trajet");

-- CreateIndex
CREATE INDEX "idx_trajet_partage_createur" ON "trajet_partage"("cree_par");

-- CreateIndex
CREATE INDEX "idx_contact_relation" ON "contact_de_confiance"("relation");

-- CreateIndex
CREATE INDEX "idx_contact_deletedat" ON "contact_de_confiance"("deletedAt");

-- AddForeignKey
ALTER TABLE "trajet_partage" ADD CONSTRAINT "trajet_partage_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE CASCADE ON UPDATE CASCADE;
