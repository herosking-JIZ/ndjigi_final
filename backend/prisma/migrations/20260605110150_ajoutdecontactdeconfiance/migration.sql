-- CreateEnum
CREATE TYPE "relation" AS ENUM ('parent', 'enfant', 'conjoint', 'frere', 'soeur', 'cousin', 'copain', 'copine', 'autre');

-- CreateTable
CREATE TABLE "contact_de_confiance" (
    "id_contact" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_user" UUID NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "relation" "relation" NOT NULL DEFAULT 'parent',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "contact_de_confiance_pkey" PRIMARY KEY ("id_contact")
);

-- CreateIndex
CREATE INDEX "idx_contact_user" ON "contact_de_confiance"("id_user");

-- AddForeignKey
ALTER TABLE "contact_de_confiance" ADD CONSTRAINT "contact_de_confiance_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;
