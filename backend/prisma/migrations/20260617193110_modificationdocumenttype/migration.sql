/*
  Warnings:

  - The values [photos,documents_administratifs] on the enum `typeDocument` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "typeDocument_new" AS ENUM ('permis_conduire', 'carte_grise', 'assurance', 'piece_identite', 'justificatif_domicile', 'contrat_ndjigi');
ALTER TABLE "document" ALTER COLUMN "type_document" TYPE "typeDocument_new" USING ("type_document"::text::"typeDocument_new");
ALTER TYPE "typeDocument" RENAME TO "typeDocument_old";
ALTER TYPE "typeDocument_new" RENAME TO "typeDocument";
DROP TYPE "public"."typeDocument_old";
COMMIT;
