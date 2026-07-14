# Business Rules - N'DJIGI Platform

## Role Categorization and Mutual Exclusion

### Categories

**Internal Roles** (mutually exclusive with each other AND with CLIENT roles):
- `admin` — Full platform administration
- `gestionnaire` — Parking management

**Client Roles** (cumulable with each other ONLY):
- `passager` — Passenger/rider
- `chauffeur` — Driver
- `proprietaire` — Vehicle owner

### Mutual Exclusion Rules

1. **User with internal role → NO other roles allowed**
   - A user with `admin` cannot have any other role (not `gestionnaire`, not `passager`, etc.)
   - A user with `gestionnaire` cannot have any other role

2. **Internal roles are mutually exclusive with each other**
   - A user cannot be both `admin` AND `gestionnaire`

3. **Internal roles cannot be combined with client roles**
   - A user with `passager` (client role) cannot receive `admin` or `gestionnaire`
   - Example: ❌ FORBIDDEN `[passager, admin]`

4. **Client roles ARE cumulable with each other**
   - A user can be `passager` AND `chauffeur`
   - A user can be `passager` AND `chauffeur` AND `proprietaire`
   - Example: ✅ ALLOWED `[passager, chauffeur, proprietaire]`

## User Creation

**At creation time**:
- Exactly ONE role is assigned
- That role must conform to the rules above
- System validates before committing to Keycloak + PostgreSQL

**Examples**:
- ✅ New admin user with role `admin`
- ✅ New passenger user with role `passager`
- ✅ New driver-owner user with role `chauffeur`
- ❌ New user with roles `[admin, passager]` → REJECTED

## Role Addition (Future Enhancement)

**NOT YET IMPLEMENTED** in PHASE 3. To be designed in a dedicated phase after PHASE 5.

When implemented, will follow:
- Only client roles can be added to existing users
- User with internal role cannot receive any new role
- All mutual exclusion rules apply

## Implementation

### Code Location
- **Role categorization**: `backend/src/constants/roleCategories.js`
  - Functions: `isInternalRole()`, `isClientRole()`, `canAddRole()`
- **Role mapping**: `backend/src/constants/roles.js`
  - Keycloak ↔ local role mapping

### Validation Points

1. **During user provisioning** (`userProvisioningService.create()`):
   - Validate new role is valid
   - If user exists: check `canAddRole()` before adding role

2. **In controllers**:
   - `createUserByAdmin` — validated during provisioning
   - `createGestionnaire` — validated during provisioning
   - `otpVerify` — creates passager, validated during provisioning

## Current State (PHASE 2 End)

**Audit Results:**
- ✅ 16 active users
- ✅ 0 violations of mutual exclusion rules
- ✅ Role distribution:
  - admin: 1 user
  - gestionnaire: 2 users
  - passager: 4 users
  - chauffeur: 7 users
  - proprietaire: 2 users

**Status**: All users conform to business rules. No cleanup needed.

## Links

- PHASE_3_STEP0_INVESTIGATION_REPORT.md — Pre-PHASE 3 investigation results
- PHASE_3_CONTROLLER_ANALYSIS.md — Detailed analysis of user creation endpoints
