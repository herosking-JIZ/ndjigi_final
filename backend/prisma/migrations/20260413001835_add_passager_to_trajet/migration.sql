-- CreateTable
CREATE TABLE "detail_trajet_passager" (
    "id_trajet" UUID NOT NULL,
    "id_passager" UUID NOT NULL,
    "date_embarquement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prix_paye" DECIMAL(10,2) NOT NULL,
    "nb_places_reservees" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "detail_trajet_passager_pkey" PRIMARY KEY ("id_trajet","id_passager")
);

-- AddForeignKey
ALTER TABLE "detail_trajet_passager" ADD CONSTRAINT "detail_trajet_passager_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_trajet_passager" ADD CONSTRAINT "detail_trajet_passager_id_passager_fkey" FOREIGN KEY ("id_passager") REFERENCES "passager"("id_passager") ON DELETE CASCADE ON UPDATE CASCADE;
