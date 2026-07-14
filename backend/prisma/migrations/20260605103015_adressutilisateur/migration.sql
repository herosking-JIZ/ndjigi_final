-- CreateTable
CREATE TABLE "address" (
    "id_address" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_user" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "isfavorite" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id_address")
);

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;
