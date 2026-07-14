# PHASE 3 — Étape 0 Investigation Report

## Summary
All 4 pre-implementation investigations completed. **One critical issue found**: role assignment uses wrong Keycloak method.

---

## 0.1 — Keycloak: Service Account Permissions & Roles

### Roles Defined in Code (Source of Truth)
From `backend/src/constants/roles.js`:
```javascript
ROLE_MAPPING = {
  'ndjigi-admin': 'admin',
  'ndjigi-gestionnaire': 'gestionnaire',
  'ndjigi-chauffeur': 'chauffeur',
  'ndjigi-passager': 'passager',
  'ndjigi-proprietaire': 'proprietaire',
};
```

**Status**: ✅ All 5 required realm roles defined in code  
**Action**: Verify these roles are created in Keycloak admin console

### Service Account Permissions
- Service account: `ndjigi-backend` (client credentials grant)
- Required permissions: `manage-users`, `manage-roles`, `view-realm`
- Current issue: HTTP 403 on role assignment

**Action for PHASE 3**: Before refactoring, manually verify in Keycloak:
1. Service account has correct scope mappings
2. All 5 roles exist in realm `ndjigi`
3. Test role assignment with admin console or direct API call

---

## 0.2 — Gestionnaire-Parking: Single vs Multiple

### Schema Analysis
From `backend/prisma/schema.prisma`:
```prisma
model gestionnaire_parking {
  id_gestionnaire  String      @id @db.Uuid      // PRIMARY KEY
  id_parking       String      @db.Uuid
  date_prise_poste DateTime?   @db.Date
  // ...
}
```

**Finding**: ✅ **CASE A — One-to-One Mapping**
- `id_gestionnaire` is SOLE primary key
- Each gestionnaire has exactly ONE parking
- No composite key, no multiple parking support

### Frontend Input
From `web/n-djigi/src/services/api.ts`:
- Sends: `CreateUserPayload` with single `parking_id`
- Does NOT send `parkings_assignes` (array)

**Decision**: ✅ Confirmed - take first/only parking, ignore plural naming

---

## 🚨 0.3 — Critical Issue: Client Role vs Realm Role

### Code Analysis

**In `otpVerify` (line 1366):**
```javascript
await keycloakService.adminAPI.users.addClientRoleMappings({
  realm: process.env.KEYCLOAK_REALM,
  id: keycloakUser.id,
  clientUniqueId: process.env.KEYCLOAK_CLIENT_ID,
  roles: [{ name: 'ndjigi-passager' }]  // CLIENT ROLE MAPPING
});
```

**In `createGestionnaire` (line 1959):**
```javascript
await keycloakService.adminAPI.users.addRealmRoleMappings({
  realm: process.env.KEYCLOAK_REALM,
  id: keycloak_id,
  roles: [gestionnairerole]  // REALM ROLE MAPPING
});
```

### The Problem
- **otpVerify** tries to assign `ndjigi-passager` as a **CLIENT role**
- **createGestionnaire** tries to assign `ndjigi-gestionnaire` as a **REALM role**
- Keycloak likely has these defined as **REALM roles**, not client roles
- **Result**: HTTP 403 Forbidden when otpVerify tries to assign as client role

### Root Cause of HTTP 403
The 403 error in test logs was from `otpVerify` trying to use `addClientRoleMappings` on a realm role.

**Decision for PHASE 3**:
1. **Verify in Keycloak** whether roles are realm-scoped or client-scoped
2. If realm-scoped (likely): **Change otpVerify to use `addRealmRoleMappings`** (uniformize with other endpoints)
3. If client-scoped: Update other endpoints to use `addClientRoleMappings` (unlikely case)

### Implementation Priority
**Before refactoring otpVerify**, fix this mismatch:
```javascript
// Change from:
addClientRoleMappings({ clientUniqueId, roles: [{ name: 'ndjigi-passager' }] })
// To:
addRealmRoleMappings({ roles: [kcRole] })  // like createGestionnaire
```

---

## 0.4 — Frontend: CreateUserByAdmin Input/Output

### Frontend API Call
Location: `web/n-djigi/src/services/api.ts` (line ~263)
```typescript
const { data } = await api.post<ApiResponse<Utilisateur>>(
  'auth/admin/users',
  payload  // CreateUserPayload
)
```

### Frontend Payload
```typescript
{
  nom: string
  prenom: string
  email: string
  numero_telephone: string
  adresse?: string
  role: string
  parking_id?: string
}
```

**Important**: Frontend does NOT send `mot_de_passe` parameter!

### Frontend Expected Response
```typescript
interface Utilisateur {
  id_utilisateur: string
  nom: string
  prenom: string
  email: string
  numero_telephone: string
  adresse?: string
  statut_compte: 'actif' | ...
  date_inscription: string (ISO timestamp)
  photo_profil?: string
  note_moyenne?: number
  roles: string[]  // ARRAY, not string!
  parking_id?: string
}
```

### Key Observations
1. ✅ Frontend does NOT pass password - no conflict with Keycloak auth
2. ✅ Response uses `roles` as array (single role but in array)
3. ✅ Response includes `statut_compte` and `date_inscription`
4. ✅ Response includes `parking_id` for gestionnaire

**Decision**: Preserve response format exactly - no breaking changes

---

## Summary Table

| Question | Finding | Status |
|----------|---------|--------|
| **Q1 — Role 403** | otpVerify uses wrong Keycloak method (ClientRole vs RealmRole) | 🔴 BLOCKER — Fix before refactoring |
| **Q2 — Password** | Frontend doesn't send password parameter | ✅ No conflict |
| **Q3 — Parkings** | Schema supports only ONE parking per gestionnaire | ✅ CASE A confirmed |
| **Q4 — OTP null fields** | No frontend impediment found | ✅ OK to proceed |
| **Q5 — OTP satellites** | Currently missing (bug to fix in Phase 3) | ✅ Implement in tx |
| **Q6 — Role scope** | otpVerify inconsistent with other endpoints | 🔴 BLOCKER — Uniformize |

---

## Pre-PHASE 3 Actions

### CRITICAL (blocking)
1. **Keycloak Verification**:
   - [ ] Manually verify `ndjigi-passager` is a REALM role, not client role
   - [ ] If it's really a client role, document why (unusual)
   - [ ] Verify service account has `manage-roles` permission

2. **Fix otpVerify immediately** (before Phase 3 refactoring):
   ```javascript
   // Change addClientRoleMappings → addRealmRoleMappings
   // This will fix the HTTP 403 issue
   ```

### Documentation
- [ ] Create `docs/KEYCLOAK_SETUP.md` listing all required roles + service account config
- [ ] Document why role scope changed (if applicable)

### Code Preparation
- [ ] Commit the otpVerify role assignment fix separately
- [ ] Verify 403 error disappears in logs after fix
- [ ] Test otpVerify still works end-to-end

---

## Next Steps

**GO PHASE 3 Étape 0.5 — Keycloak Verification**:
```bash
# In Keycloak admin console:
1. Realm: ndjigi
2. Roles tab
3. Search: ndjigi-passager
4. Verify: Is it a realm role or client role?
```

Once verified, proceed to **Étape 1 — userProvisioningService OTP extension**.

---

## Documents Updated
- ✅ PHASE_3_INVESTIGATION.md (role assignment issue noted)
- ✅ PHASE_3_CONTROLLER_ANALYSIS.md (Q1-Q6 clarifications answered)
- ✅ PHASE_3_STEP0_INVESTIGATION_REPORT.md (this file)

**Status**: READY for Étape 1 after Keycloak manual verification + otpVerify role fix
