-- CreateTable
CREATE TABLE "ticket" (
    "id_ticket" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "sujet" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'ouvert',
    "priorite" VARCHAR(20) NOT NULL DEFAULT 'normale',
    "eligible_remboursement" BOOLEAN NOT NULL DEFAULT false,
    "id_trajet" UUID,
    "id_paiement" UUID,
    "id_agent" UUID,
    "note_interne" TEXT,
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_resolution" TIMESTAMP(6),

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id_ticket")
);

-- CreateTable
CREATE TABLE "remboursement" (
    "id_remboursement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_ticket" UUID NOT NULL,
    "id_utilisateur" UUID NOT NULL,
    "id_idempotence" UUID NOT NULL DEFAULT gen_random_uuid(),
    "montant" DECIMAL(12,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "id_agent" UUID,
    "date_demande" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_traitement" TIMESTAMP(6),

    CONSTRAINT "remboursement_pkey" PRIMARY KEY ("id_remboursement")
);

-- CreateIndex
CREATE INDEX "idx_ticket_utilisateur" ON "ticket"("id_utilisateur");

-- CreateIndex
CREATE INDEX "idx_ticket_statut" ON "ticket"("statut");

-- CreateIndex
CREATE INDEX "idx_ticket_trajet" ON "ticket"("id_trajet");

-- CreateIndex
CREATE UNIQUE INDEX "remboursement_id_idempotence_key" ON "remboursement"("id_idempotence");

-- CreateIndex
CREATE INDEX "idx_remboursement_ticket" ON "remboursement"("id_ticket");

-- CreateIndex
CREATE INDEX "idx_remboursement_utilisateur" ON "remboursement"("id_utilisateur");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_agent_fkey" FOREIGN KEY ("id_agent") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "remboursement" ADD CONSTRAINT "remboursement_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket"("id_ticket") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "remboursement" ADD CONSTRAINT "remboursement_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "remboursement" ADD CONSTRAINT "remboursement_id_agent_fkey" FOREIGN KEY ("id_agent") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;
