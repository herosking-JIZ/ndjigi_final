/*
  Warnings:

  - You are about to drop the column `tarif_base_location` on the `vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `tarif_par_jour_location` on the `vehicule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicule" DROP COLUMN "tarif_base_location",
DROP COLUMN "tarif_par_jour_location";

-- AlterTable
ALTER TABLE "vehicule_location" ADD COLUMN     "tarif_base_location" DECIMAL(10,2),
ADD COLUMN     "tarif_par_jour_location" DECIMAL(10,2);
