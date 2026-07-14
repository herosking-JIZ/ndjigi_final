-- Add missing utilisateur columns (invitation system, created_by, auth_method_otp)

-- Add invitation system columns if they don't exist
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "invitation_token" UUID UNIQUE;
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "invitation_token_expire" TIMESTAMP(6);
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "invitation_sent_at" TIMESTAMP(6);
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "invitation_used_at" TIMESTAMP(6);
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "invitation_resend_count" INTEGER NOT NULL DEFAULT 0;

-- Add created_by column if it doesn't exist
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "created_by" UUID;

-- Add auth_method_otp column if it doesn't exist
ALTER TABLE "utilisateur" ADD COLUMN IF NOT EXISTS "auth_method_otp" BOOLEAN NOT NULL DEFAULT false;

-- Create index for invitation token lookup
CREATE INDEX IF NOT EXISTS "idx_utilisateur_invitation_token" ON "utilisateur"("invitation_token") WHERE "invitation_token" IS NOT NULL;
