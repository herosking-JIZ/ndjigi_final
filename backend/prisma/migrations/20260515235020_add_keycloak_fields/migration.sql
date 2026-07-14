-- AddColumn
ALTER TABLE "utilisateur" ADD COLUMN "keycloak_id" UUID;

-- AddColumn
ALTER TABLE "utilisateur" ADD COLUMN "phone" VARCHAR(20);

-- AddColumn
ALTER TABLE "utilisateur" ADD COLUMN "active_role" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_keycloak_id_key" ON "utilisateur"("keycloak_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_phone_key" ON "utilisateur"("phone");

-- CreateTable
CREATE TABLE "auth_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_auth_log_user" ON "auth_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_auth_log_event_type" ON "auth_log"("event_type");

-- CreateIndex
CREATE INDEX "idx_auth_log_created_at" ON "auth_log"("created_at");
