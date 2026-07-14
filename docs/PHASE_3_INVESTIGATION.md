# PHASE 3 Investigation & Blockers

## Critical Issue: Keycloak Role Assignment Failure

### Problem
In `userProvisioningService.create()` (line 238-244), if role assignment fails with HTTP 403:
```javascript
} catch (roleErr) {
  logger.warn({...}); // Logs warning
  // Process continues - NO rollback triggered
}
```

**Impact**: User is created in Keycloak WITHOUT assigned role. This is a security/authorization gap.

### Current Behavior
1. User created in Keycloak ✅
2. Role assignment attempted 
3. If 403 Forbidden → logged but ignored
4. User exists but has no role → authorization issues downstream
5. PostgreSQL user still created
6. **Result: User can login but has no permissions**

### Root Cause
Keycloak service account may not have `manage-roles` permission in the realm, or role doesn't exist.

### Solution for PHASE 3
**Decision needed**: Should role assignment failure:
- (A) Trigger full rollback (Keycloak delete + abort PG creation)? 
- (B) Allow user creation but mark as "role_assignment_failed" in provisioning_incidents?
- (C) Retry with exponential backoff?

**Recommendation**: Option (A) - Role assignment is NOT optional. No user without proper role.

### Investigation Steps Required
1. Check Keycloak service account permissions (manage-roles, manage-users)
2. Verify all required roles exist in realm (ndjigi-admin, ndjigi-gestionnaire, etc.)
3. Test role assignment directly via Keycloak Admin Console
4. Update userProvisioningService to fail & rollback on role assignment error

---

## PHASE 3 Controllers to Refactor

### 1. `POST /auth/admin/users` - createUserByAdmin
**File**: `keycloakAuthController.js` (line ~1069)
**Current Issue**: Creates ONLY in PostgreSQL - no Keycloak user created
**Target**: Use `userProvisioningService.create()`
**Complexity**: Low (straightforward refactor)
**Status**: Need to read full implementation

### 2. `POST /auth/admin/gestionnaires` - createGestionnaire  
**File**: `keycloakAuthController.js` (line ~1903)
**Current Issue**: Duplicated logic, no rollback on PG failure
**Target**: Use `userProvisioningService.create()` with metadata.id_parking
**Complexity**: Medium (remove duplication)
**Status**: Need to read full implementation

### 3. `POST /auth/otp/verify` - otpVerify
**File**: `keycloakAuthController.js` (line ~1342)
**Current Issue**: Custom passager creation logic, not using service
**Target**: Use `userProvisioningService.create()` with OTP flags
**Complexity**: HIGH (preserve TOTP, tech_password, auth_method_otp logic)
**Sensitive**: Modifying OTP flow can break authentication
**Status**: Need thorough code review before touching

---

## API Contract Preservation

### Frontend Dependencies
Frontend uses: `utilisateursService.create()` → calls `POST /api/v1/auth/admin/users`

**Requirement**: Response format must remain compatible
**Test**: Run frontend create-user flow after refactoring

### Expected Response Format
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "uuid",
    "email": "...",
    "role": "...",
    "keycloak_id": "uuid"
  }
}
```

---

## Test Plan for PHASE 3

### Happy Path (for each endpoint)
- [ ] User created in Keycloak ✅
- [ ] User created in PostgreSQL ✅
- [ ] keycloak_id synced ✅
- [ ] Role assigned in Keycloak ✅
- [ ] Role assigned in PostgreSQL ✅
- [ ] Role-specific satellites created ✅
- [ ] Wallet created correctly (rules apply) ✅

### Failure Paths (for each endpoint)
- [ ] Keycloak creation fails → rollback PG ✅
- [ ] Role assignment fails → full rollback (TO BE DECIDED)
- [ ] PostgreSQL creation fails → rollback Keycloak ✅
- [ ] Satellite creation fails → full rollback ✅
- [ ] Email send fails → non-blocking ✅

### Regression Tests
- [ ] Frontend create-user still works (HTTP 200, correct fields)
- [ ] Admin endpoints require proper auth/roles
- [ ] No duplicate code remains in controllers
- [ ] All 3 endpoints respond with consistent format

---

## Commit Strategy for PHASE 3

One commit per endpoint, with tests:

1. `refactor: centralize POST /auth/admin/users via userProvisioningService`
2. `refactor: centralize POST /auth/admin/gestionnaires via userProvisioningService`
3. `refactor: centralize POST /auth/otp/verify passager creation via userProvisioningService`
4. `fix: ensure role assignment failure triggers rollback`
5. `test: add integration tests for all user provisioning endpoints`

---

## Status
- [ ] Keycloak role assignment issue resolved
- [ ] All 3 controllers read and analyzed
- [ ] Refactoring plan finalized
- [ ] PHASE 3 ready to execute
