/*
  Warnings:

  - You are about to drop the column `invitation_resend_count` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_sent_at` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_token` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_token_expire` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_used_at` on the `utilisateur` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_utilisateur_invitation_token";

-- DropConstraint (unique constraint)
ALTER TABLE "utilisateur" DROP CONSTRAINT "utilisateur_invitation_token_key";

-- AlterTable
ALTER TABLE "utilisateur" DROP COLUMN "invitation_resend_count",
DROP COLUMN "invitation_sent_at",
DROP COLUMN "invitation_token",
DROP COLUMN "invitation_token_expire",
DROP COLUMN "invitation_used_at",
ADD COLUMN     "mot_de_passe_temporaire" BOOLEAN NOT NULL DEFAULT false;
