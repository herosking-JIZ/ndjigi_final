-- CreateEnum
CREATE TYPE "ProvisioningIncidentType" AS ENUM ('orphan_keycloak', 'orphan_postgres', 'rollback_failed', 'email_failed', 'sync_failed');

-- CreateEnum
CREATE TYPE "ProvisioningIncidentStatus" AS ENUM ('pending', 'resolved', 'manual_intervention_required');

-- DropForeignKey
ALTER TABLE "password_reset_token" DROP CONSTRAINT "password_reset_token_id_utilisateur_fkey";

-- AlterTable
ALTER TABLE "document" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "password_reset_token" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "provisioning_incidents" (
    "id_incident" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ProvisioningIncidentType" NOT NULL,
    "status" "ProvisioningIncidentStatus" NOT NULL DEFAULT 'pending',
    "user_email" VARCHAR(255),
    "keycloak_id" UUID,
    "id_utilisateur" UUID,
    "error_message" TEXT,
    "error_details" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),
    "resolved_by" VARCHAR(255),
    "resolution_notes" TEXT,

    CONSTRAINT "provisioning_incidents_pkey" PRIMARY KEY ("id_incident")
);

-- CreateIndex
CREATE INDEX "idx_provisioning_incidents_type" ON "provisioning_incidents"("type");

-- CreateIndex
CREATE INDEX "idx_provisioning_incidents_status" ON "provisioning_incidents"("status");

-- CreateIndex
CREATE INDEX "idx_provisioning_incidents_created_at" ON "provisioning_incidents"("created_at");

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_incidents" ADD CONSTRAINT "provisioning_incidents_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;
