-- Invitation system for gestionnaire creation (Phase 1)

-- Make mot_de_passe_hash nullable (allows accounts without password during invitation)
ALTER TABLE "utilisateur" ALTER COLUMN "mot_de_passe_hash" DROP NOT NULL;

-- Add invitation system columns
ALTER TABLE "utilisateur" ADD COLUMN "invitation_token" UUID UNIQUE,
ADD COLUMN "invitation_token_expire" TIMESTAMP(6),
ADD COLUMN "invitation_sent_at" TIMESTAMP(6),
ADD COLUMN "invitation_used_at" TIMESTAMP(6),
ADD COLUMN "invitation_resend_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "created_by" UUID;

-- Index for fast token lookup
CREATE INDEX "idx_utilisateur_invitation_token" ON "utilisateur"("invitation_token") WHERE "invitation_token" IS NOT NULL;
