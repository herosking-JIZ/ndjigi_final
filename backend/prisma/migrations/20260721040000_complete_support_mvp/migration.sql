ALTER TABLE "ticket"
ADD COLUMN "priorite" "ticket_priorite" NOT NULL DEFAULT 'normale',
ADD COLUMN "note_resolution" TEXT;

CREATE INDEX "idx_ticket_priorite" ON "ticket"("priorite");
