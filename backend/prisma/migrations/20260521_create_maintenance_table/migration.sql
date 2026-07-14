-- CreateEnum type_maintenance
CREATE TYPE "type_maintenance" AS ENUM ('mecanique', 'electricite', 'carrosserie');

-- CreateEnum maintenance_statut
CREATE TYPE "maintenance_statut" AS ENUM ('en_attente', 'confirmee', 'en_reparation', 'terminee', 'bon_etat');

-- CreateEnum maintenance_urgence
CREATE TYPE "maintenance_urgence" AS ENUM ('basse', 'normale', 'haute');

-- CreateTable maintenance
CREATE TABLE "maintenance" (
    "id_maintenance" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_vehicule" UUID NOT NULL,
    "id_parking" UUID NOT NULL,
    "id_gestionnaire" UUID NOT NULL,
    "type" "type_maintenance" NOT NULL,
    "statut" "maintenance_statut" NOT NULL DEFAULT 'en_attente',
    "urgence" "maintenance_urgence" NOT NULL DEFAULT 'normale',
    "description" TEXT NOT NULL,
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_resolution" TIMESTAMP(6),

    CONSTRAINT "maintenance_pkey" PRIMARY KEY ("id_maintenance")
);

-- CreateIndex
CREATE INDEX "idx_maintenance_vehicule" ON "maintenance"("id_vehicule");
CREATE INDEX "idx_maintenance_parking" ON "maintenance"("id_parking");
CREATE INDEX "idx_maintenance_statut" ON "maintenance"("statut");

-- AddForeignKey
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_id_parking_fkey" FOREIGN KEY ("id_parking") REFERENCES "parking"("id_parking") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_id_gestionnaire_fkey" FOREIGN KEY ("id_gestionnaire") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;
