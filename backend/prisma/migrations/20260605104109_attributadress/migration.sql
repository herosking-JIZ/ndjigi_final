/*
  Warnings:

  - Added the required column `updatedAt` to the `address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "address" ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(6) NOT NULL;

-- CreateIndex
CREATE INDEX "idx_address_user" ON "address"("id_user");

-- CreateIndex
CREATE INDEX "idx_address_favorite" ON "address"("isfavorite");
