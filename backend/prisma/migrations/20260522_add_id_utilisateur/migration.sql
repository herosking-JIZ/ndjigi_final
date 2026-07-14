-- AlterTable journal_parking: Add id_utilisateur column and FK
ALTER TABLE "public"."journal_parking"
ADD COLUMN "id_utilisateur" UUID NOT NULL DEFAULT gen_random_uuid();

-- Add foreign key constraint
ALTER TABLE "public"."journal_parking"
ADD CONSTRAINT "journal_parking_id_utilisateur_fkey"
FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur")
ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Add index for performance
CREATE INDEX "idx_journal_parking_utilisateur" ON "public"."journal_parking"("id_utilisateur");
