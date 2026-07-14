-- Add upload system columns to document table
ALTER TABLE "document" ADD COLUMN "title" VARCHAR(200),
ADD COLUMN "fileKey" TEXT,
ADD COLUMN "mimeType" VARCHAR(100),
ADD COLUMN "fileSize" BIGINT,
ADD COLUMN "storageHash" VARCHAR(64),
ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'READY',
ADD COLUMN "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedAt" TIMESTAMP(6);

-- Create unique index on fileKey
CREATE UNIQUE INDEX "document_fileKey_key" ON "document"("fileKey");

-- Create indexes for performance
CREATE INDEX "idx_document_userid_deletedat" ON "document"("id_utilisateur", "deletedAt");
CREATE INDEX "idx_document_hash_userid" ON "document"("storageHash", "id_utilisateur");
CREATE INDEX "idx_document_status_createdat" ON "document"("status", "createdAt");
