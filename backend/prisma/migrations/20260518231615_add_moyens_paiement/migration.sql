-- CreateEnum for TypeMoyenPaiement
CREATE TYPE "TypeMoyenPaiement" AS ENUM ('CARTE_BANCAIRE', 'MOBILE_MONEY', 'PORTEFEUILLE');

-- CreateTable moyens_paiement
CREATE TABLE "moyens_paiement" (
    "id_moyen_paiement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "type" "TypeMoyenPaiement" NOT NULL,
    "details" JSONB NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_ajout" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_desactivation" TIMESTAMP(6),

    CONSTRAINT "moyens_paiement_pkey" PRIMARY KEY ("id_moyen_paiement")
);

-- AddForeignKey for moyens_paiement to utilisateur
ALTER TABLE "moyens_paiement" ADD CONSTRAINT "moyens_paiement_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddColumn id_moyen_paiement to paiement
ALTER TABLE "paiement" ADD COLUMN "id_moyen_paiement" UUID;

-- AddForeignKey for paiement.id_moyen_paiement
ALTER TABLE "paiement" ADD CONSTRAINT "paiement_id_moyen_paiement_fkey" FOREIGN KEY ("id_moyen_paiement") REFERENCES "moyens_paiement"("id_moyen_paiement") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CreateIndex for moyens_paiement
CREATE INDEX "idx_moyens_paiement_utilisateur" ON "moyens_paiement"("id_utilisateur");

-- CreateIndex for paiement
CREATE INDEX "idx_paiement_moyen" ON "paiement"("id_moyen_paiement");
