-- Add id_parking column to vehicule table
ALTER TABLE "vehicule" ADD COLUMN IF NOT EXISTS "id_parking" UUID;

-- Add foreign key constraint
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_id_parking_fkey" FOREIGN KEY ("id_parking") REFERENCES "parking"("id_parking") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Add index for parking lookups
CREATE INDEX IF NOT EXISTS "idx_vehicule_parking" ON "vehicule"("id_parking");
