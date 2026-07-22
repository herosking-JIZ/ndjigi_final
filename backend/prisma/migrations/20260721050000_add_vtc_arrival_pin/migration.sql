ALTER TABLE "trajet"
  ADD COLUMN "chauffeur_arrive_a" TIMESTAMP(6),
  ADD COLUMN "pin_tentatives" SMALLINT NOT NULL DEFAULT 0;

-- Une partie ne peut noter une course qu'une seule fois. PostgreSQL autorise
-- toujours plusieurs avis sans trajet (NULL), utiles aux autres modules.
CREATE UNIQUE INDEX "uq_avis_evaluateur_trajet"
  ON "avis"("id_evaluateur", "id_trajet");
