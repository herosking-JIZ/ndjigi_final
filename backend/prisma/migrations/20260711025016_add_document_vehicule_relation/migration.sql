-- AlterTable
ALTER TABLE "document" ADD COLUMN     "id_vehicule" UUID;

-- CreateIndex
CREATE INDEX "idx_document_vehicule" ON "document"("id_vehicule");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE CASCADE ON UPDATE NO ACTION;
