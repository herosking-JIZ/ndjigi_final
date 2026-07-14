# Database Migrations - N'DJIGI Platform

## Overview

This document describes the migration strategy for managing Prisma schema changes safely across environments.

## Migration Types

### Development (`prisma migrate dev`)
- Used ONLY in local development
- Automatically:
  1. Creates a new migration file
  2. Applies migration to local database
  3. Regenerates Prisma Client
- **DANGEROUS**: Can reset database if schema drift is detected
- Resets the database only if absolutely necessary to resolve conflicts
- Generates migration files under `prisma/migrations/`

### Production (`prisma migrate deploy`)
- Used in staging, production, and CI/CD
- Applies pending migrations sequentially
- **NEVER resets the database** - strictly additive
- Safe for running against live databases with data
- Fails if there are pending migrations (forces explicit deployment)

## Correct Procedures

### Local Development Workflow
```bash
# After schema changes in schema.prisma:
npx prisma migrate dev --name descriptive_name

# Review the generated migration file in prisma/migrations/
# Test locally
```

### Deployment to Staging/Production
```bash
# Apply all pending migrations (never reset)
npx prisma migrate deploy

# DO NOT use:
# - npx prisma migrate reset (destroys data)
# - npx prisma migrate dev (can reset unexpectedly)
```

## Safety Guards

### What triggers a reset?
- `prisma migrate reset --force` (explicit)
- `prisma migrate dev` if schema drift is unresolvable (rare)

### Prevention
- CI/CD pipelines must use `prisma migrate deploy` exclusively for non-dev environments
- Never run `prisma migrate dev` in staging/production
- Git pre-commit hooks can warn before dangerous commands
- Code review must catch any `migrate reset` or `migrate dev` in production CI configs

## Migration Naming Conventions

Use clear, descriptive migration names:
```
✅ Good:
- add_provisioning_incidents_table
- add_keycloak_fields_to_utilisateur
- add_unique_constraint_email

❌ Bad:
- update1
- fix_schema
- changes
```

## Rollback Strategy

Prisma does not support automatic rollbacks. If a migration causes issues:

1. Create a NEW migration that undoes the changes
2. Apply the new migration
3. Document the incident in commit message

Example:
```bash
# If migration added a column that breaks the app:
npx prisma migrate dev --name remove_problematic_column
# Then edit the .sql file to DROP the column
```

## Current Status

- **Environment**: Development
- **Total Migrations**: 17
- **Status**: All migrations applied and in sync
- **Last Migration**: `20260522002056_add_provisioning_incidents_table`

## Post-Phase-2 Notes

- Atomic transaction wrapping was added to `userProvisioningService.create()`
- All user provisioning operations now use `prisma.$transaction()` to ensure atomicity
- See `backend/src/services/userProvisioningService.js` for implementation
