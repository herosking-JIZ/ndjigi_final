-- Phase 4: Drop session table (no longer needed with Keycloak token management)
-- Sessions are now managed by Keycloak, and token blacklist uses Redis instead

-- Drop the foreign key constraint first
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_id_utilisateur_fkey";

-- Drop the index
DROP INDEX IF EXISTS "idx_session_utilisateur";

-- Drop the table
DROP TABLE IF EXISTS "session";
