-- Conserve les informations de décision utilisées par les clients mobile et web.
ALTER TABLE "demande_extension"
ADD COLUMN "motif_rejet" TEXT,
ADD COLUMN "date_decision" TIMESTAMP(6),
ADD COLUMN "id_admin_decision" UUID,
ADD COLUMN "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "idx_demande_extension_user_type_statut"
ON "demande_extension"("id_utilisateur", "extension_type", "statut");
