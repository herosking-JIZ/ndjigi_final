# PHASE 3 - Controller Analysis & Refactoring Plan

## Controller 1: `createUserByAdmin` (Line 1070)

### Current Implementation
```
POST /api/v1/auth/admin/users
Method: createUserByAdmin
```

### What It Does
1. ❌ Creates user ONLY in PostgreSQL
2. ❌ No Keycloak user created (CRITICAL BUG)
3. ✅ Validates email/phone uniqueness
4. ✅ Hashes password with bcrypt (local auth, not Keycloak)
5. ✅ Creates satellites: passager, chauffeur, proprietaire, gestionnaire_parking
6. ✅ Creates portefeuille (wallet)
7. ✅ Atomic transaction (Prisma `$transaction`)
8. ❌ No rollback mechanism (only PG affected)

### Input Validation
```javascript
Required: nom, prenom, email, mot_de_passe, role, numero_telephone
Optional: adresse, parking_id (required if role='gestionnaire')
```

### Issues to Fix in Refactoring
1. **NO KEYCLOAK USER**: Must create in Keycloak first
2. **Password handling**: Currently uses bcrypt + local password. Must transition to Keycloak password management
3. **Portefeuille logic**: Currently creates for ALL roles. Should follow userProvisioningService logic (not for admin)
4. **Response format**: Must preserve current JSON structure for frontend compatibility

### Refactoring Strategy
```javascript
// Replace current logic with:
const result = await userProvisioningService.create({
  email,
  prenom,
  nom,
  role,
  numero_telephone,
  adresse,
  metadata: { id_parking: parking_id },
  sendInvitationEmail: false // Check if needed
});

// Return in same format as current implementation
```

### Questions Before Starting
- Q1: Should email invitation be sent to newly created users?
- Q2: Current frontend expects `role` as array `[string]`. Keep or change?
- Q3: What happens to the local password `mot_de_passe`? Should we ignore it and let Keycloak generate temp password?

---

## Controller 2: `createGestionnaire` (Line 1903)

### Current Implementation
```
POST /api/v1/admin/gestionnaires
Method: createGestionnaire
Routes: /api/v1/admin/gestionnaires and /admin/gestionnaires (both hit this)
```

### What It Does
1. ✅ Creates in Keycloak (with username field - fixed in PHASE 2)
2. ✅ Assigns realm role `ndjigi-gestionnaire` to Keycloak user
3. ✅ Creates in PostgreSQL
4. ✅ Creates gestionnaire_parking satellite
5. ❌ NO rollback if PG fails (Keycloak user remains orphaned)
6. ⚠️  Role assignment failure logged but ignored (CRITICAL GAP)

### Input Validation
```javascript
Required: email, nom, prenom, phone, parkings_assignes (array)
```

### Issues to Fix
1. **Duplicated logic**: Same as userProvisioningService (can be deleted)
2. **No rollback**: If PG fails, Keycloak user orphaned
3. **Role assignment error handling**: 403 errors are ignored
4. **Multiple parkings**: Uses `parkings_assignes: string[]` but only creates single gestionnaire_parking entry

### Current Bug: Multiple Parkings
```javascript
// Input: parkings_assignes: ['park-1', 'park-2']
// But code only processes first parking implicitly
// Should create multiple gestionnaire_parking rows!
```

### Refactoring Strategy
```javascript
// Replace with:
const result = await userProvisioningService.create({
  email,
  nom,
  prenom,
  role: 'gestionnaire',
  numero_telephone: phone,
  adresse: null,
  metadata: { id_parking: parkings_assignes[0] }, // QUESTION: handle multiple?
  sendInvitationEmail: false
});

// Loop for additional parkings if needed:
for (const parkingId of parkings_assignes.slice(1)) {
  await prisma.gestionnaire_parking.create({...});
}
```

### Questions Before Starting
- Q1: Should gestionnaire be assigned to MULTIPLE parkings? If yes, fix the current logic too
- Q2: Is `parkings_assignes` array supposed to be supported or is it always single parking?
- Q3: Role assignment failure should trigger rollback - agree?

---

## Controller 3: `otpVerify` (Line 1342)

### Current Implementation
```
POST /auth/otp/verify
Method: otpVerify
Scope: Creates OTP-authenticated passagers
```

### What It Does
1. ✅ Creates Keycloak user with `username: normalizedPhone`
2. ✅ Uses TECH PASSWORD (random, encrypted, not user-changeable)
3. ✅ Assigns CLIENT ROLE (not realm role): `ndjigi-passager`
4. ✅ Creates in PostgreSQL with `auth_method_otp: true`
5. ✅ Stores `tech_password_encrypted` for future auth
6. ❌ Does NOT create `passager` satellite! (BUG)
7. ❌ Does NOT create `portefeuille` (BUG - users can't pay)
8. ⚠️  Complex TOTP/2FA logic
9. ⚠️  No rollback if PG fails

### Special OTP Attributes
```javascript
auth_method_otp: true
tech_password_encrypted: encrypt(techPassword)
numero_telephone: normalizedPhone (username in KC)
email: null (not available in OTP flow)
prenom: null
nom: null
```

### TOTP/2FA Logic (Lines 1449-1515)
```javascript
1. Check if user has TOTP configured
2. If no TOTP: generate secret, return QR code + loginToken
3. If TOTP exists: user already setup
4. loginToken stored in Redis for 5 minutes
5. Returned to frontend for next step (verify TOTP code)
```

### Issues to Fix
1. **Missing `passager` satellite**: Users created without passager record (data inconsistency)
2. **Missing `portefeuille`**: Users can't use payment features
3. **CLIENT role vs REALM role**: Uses `addClientRoleMappings` instead of `addRealmRoleMappings` (different Keycloak scope)
4. **No rollback**: If PG creation fails after Keycloak creation
5. **Email + name are NULL**: Metadata incomplete initially

### Current Code Issues
```javascript
// Line 1366: Uses CLIENT role mapping
addClientRoleMappings({ ..., clientUniqueId, roles: [{ name: 'ndjigi-passager' }] })

// Should be realm role like other endpoints? Or intentional for OTP?
```

### Refactoring Complexity
This is the MOST COMPLEX because:
1. OTP has special password handling (tech_password, not user password)
2. Needs CLIENT role assignment instead of realm role
3. Has TOTP/2FA state management
4. Users created without email/name (async completion later?)
5. Must preserve all OTP-specific metadata

### Proposed Solution
Extend `userProvisioningService.create()` with OTP flag:
```javascript
const result = await userProvisioningService.create({
  email: null, // OTP users don't have email initially
  prenom: null,
  nom: null,
  role: 'passager',
  numero_telephone: normalizedPhone,
  metadata: {
    otpMode: true,
    techPassword: encryptedPassword
  },
  // New params:
  otpFlags: {
    useClientRoleMapping: true, // Use client role instead of realm
    techPasswordEncrypted: encryptedPassword,
    createSatellite: true // Ensure passager satellite created
  }
  // ... etc
});
```

### Questions Before Starting
- Q1: Should OTP users be created with satellite records (`passager`) immediately?
- Q2: Should OTP users have `portefeuille` created? (Payment feature)
- Q3: Why CLIENT role mapping instead of REALM role for passagers?
- Q4: Can userProvisioningService handle `null` email/name, or needs special handling?
- Q5: Should tech_password be generated by userProvisioningService or passed in?
- Q6: How to handle TOTP state in Redis - move to userProvisioningService or keep in controller?

---

## API Response Format (Must Preserve)

### Current `createUserByAdmin` Response
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès.",
  "data": {
    "id_utilisateur": "uuid",
    "nom": "...",
    "prenom": "...",
    "email": "...",
    "numero_telephone": "...",
    "adresse": "...",
    "statut_compte": "actif",
    "date_inscription": "timestamp",
    "photo_profil": "...",
    "note_moyenne": "...",
    "role": ["passager"], // ARRAY!
    "parking_id": null
  },
  "errors": null
}
```

### Current `createGestionnaire` Response (lines 1998-2010)
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "uuid",
    "email": "...",
    "tempPassword": "..." // DIFFERENT - returns temp password
  }
}
```

### Current `otpVerify` Response (successful without TOTP)
Returns JWT tokens: `{ access_token, refresh_token, user: {...} }`

**CRITICAL**: These 3 responses are DIFFERENT formats. Frontend expects these specific formats.

---

## Summary of Work Required

### `createUserByAdmin` Refactoring
- [ ] Refactor to use `userProvisioningService.create()`
- [ ] Handle local password deletion (use Keycloak password)
- [ ] Fix portefeuille logic (don't create for admin)
- [ ] Preserve response format (role as array)
- [ ] Test: happy path + rollback scenarios
- [ ] Test: frontend integration (utilisateursService.create)

### `createGestionnaire` Refactoring
- [ ] Delete duplicated Keycloak + PG logic
- [ ] Refactor to use `userProvisioningService.create()`
- [ ] Handle multiple parkings if applicable
- [ ] Fix role assignment error handling (trigger rollback)
- [ ] Preserve response format (include tempPassword if needed)
- [ ] Test: happy path + failure paths

### `otpVerify` Refactoring
- [ ] Create extended version of `userProvisioningService.create()` for OTP
- [ ] Handle null email/name fields
- [ ] Ensure `passager` satellite created (BUG FIX)
- [ ] Ensure `portefeuille` created (BUG FIX)
- [ ] Preserve tech_password_encrypted handling
- [ ] Handle CLIENT role mapping for Keycloak
- [ ] Keep TOTP state management in Redis
- [ ] Test: OTP user creation + TOTP flow
- [ ] Test: rollback on PG failure

### Cross-Cutting Issues
- [ ] Fix HTTP 403 role assignment error to trigger rollback
- [ ] Ensure ALL endpoints support proper failure paths
- [ ] Update integration tests
- [ ] Verify frontend compatibility

---

## Blockers / Clarifications Needed

Before starting PHASE 3, need answers to:
1. Role assignment (HTTP 403) - should trigger rollback or allow user without role?
2. createUserByAdmin - handle local password how?
3. createGestionnaire - support multiple parkings?
4. otpVerify - can userProvisioningService handle null email/name?

**Status**: AWAITING CLARIFICATION before implementation
