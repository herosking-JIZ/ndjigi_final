# Phase 5 Completion Summary: OTP SMS for Passengers/Drivers/Proprietors

**Completed on**: 2026-05-17  
**Overall Status**: ✅ FULLY IMPLEMENTED

---

## What Was Implemented

### Backend (Node.js/Express)

#### 1. **OTP Service** (`backend/src/services/otpService.js`)
- **Purpose**: Encapsulates OTP generation, storage, and verification
- **Functions**:
  - `generateOtp()` - Generates 6-digit OTP via `crypto.randomInt(100000, 999999)`
  - `storeOtp(phone, code)` - Stores in Redis with 5-minute TTL
  - `verifyOtp(phone, code)` - Validates code, manages attempts (max 3), enforces 15-minute block
  - `resendOtp(phone)` - Enforces 60-second cooldown
  - `isPhoneBlocked(phone)` - Checks if phone is temporarily blocked

**Redis Keys**:
```
otp:<phone>                  → { code, attempts, created_at }
otp:blocked:<phone>          → "1" (TTL: 15 min after 3 failures)
otp:cooldown:<phone>         → "1" (TTL: 60 sec between resends)
```

#### 2. **Phone Service** (`backend/src/services/phoneService.js`)
- **Purpose**: Phone number normalization and validation (Burkina Faso +226)
- **Functions**:
  - `normalize(phone)` - Accepts multiple formats, returns E.164 (+226XXXXXXXXXX)
  - `validateBurkinaFaso(phone)` - Validates format and country code
  - `mask(phone)` - Masks for display (+226 70 ** ** 56)

**Supported Input Formats**:
- `+226XXXXXXXXXX` (already normalized)
- `226XXXXXXXXXX` (with country code)
- `0XXXXXXXXXX` (local format, becomes +226)
- `XXXXXXXXXX` (10 digits, prepend +226)

#### 3. **Crypto Utility** (`backend/src/utils/crypto.js`)
- **Purpose**: Encrypt technical passwords with AES-256-GCM
- **Functions**:
  - `encrypt(plaintext)` - Returns "iv:encryptedData:authTag" (hex format)
  - `decrypt(encryptedString)` - Reverses encryption
  - `generateTechPassword()` - Generates random 32-char hex password

**Encryption Details**:
```
Algorithm: AES-256-GCM
Key: CRYPTO_SECRET (64 hex chars = 32 bytes)
IV: Random 16 bytes per encryption
Auth Tag: Ensures integrity
Format: "iv:encryptedData:authTag" (all hex)
```

#### 4. **Extended keycloakAuthController** with OTP endpoints:

**Endpoint: `POST /auth/otp/request`**
- **Rate Limited**: 1 req/60s per phone, max 5/24h per phone
- **Flow**:
  1. Normalize + validate phone
  2. Check if phone is blocked
  3. Generate OTP (6 digits)
  4. Store in Redis (5-min TTL)
  5. Send via SMS
  6. Log to auth_log table
- **Response**: `{ success: true, data: { phone_masked } }`

**Endpoint: `POST /auth/otp/verify`** (Most Complex)
- **Flow**:
  1. Normalize + validate phone
  2. Verify OTP (max 3 attempts, 15-min block after failure)
  3. **Search for user in Keycloak** by username=phone
  4. **If user NOT found**:
     - Generate random technical password (32 hex chars)
     - Create user in Keycloak with credentials
     - Assign `ndjigi-passager` role
     - Create local user with encrypted tech_password
  5. **If user EXISTS**:
     - Retrieve encrypted tech_password from DB
     - Decrypt it
  6. Call Keycloak Direct Access Grant with phone + tech_password
  7. Return tokens + user info
- **Response**: `{ access_token, refresh_token, expires_in, user }`

**Endpoint: `POST /auth/otp/resend`**
- **Rate Limited**: 60-second cooldown per phone
- **Flow**: Same as otp/request but skips attempts reset
- **Response**: `{ success: true }`

#### 5. **Database Changes**
**Prisma Schema Updates**:
```prisma
model utilisateur {
  // ... existing fields ...
  tech_password_encrypted  String?   @db.Text  // AES-256-GCM encrypted
  auth_method_otp          Boolean   @default(false)
}
```

**Migration**: `20260517191234_add_otp_auth_fields`
- Adds `tech_password_encrypted` column
- Adds `auth_method_otp` column

#### 6. **Environment Variables**
```bash
CRYPTO_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
# 64 hex characters (32 bytes) for AES-256 encryption key
```

---

### Frontend (Flutter Mobile)

#### 1. **AuthService** (`mobile/lib/services/auth_service.dart`)
- **Methods**:
  - `requestOtp(phone)` - POST /auth/otp/request
  - `verifyOtp(phone, otpCode)` - POST /auth/otp/verify
  - `resendOtp(phone)` - POST /auth/otp/resend
  - `refreshToken()` - POST /auth/refresh
  - `logout()` - POST /auth/logout
  - `getAccessToken()` - Retrieve from secure storage
  - `getRefreshToken()` - Retrieve from secure storage
  - `isAuthenticated()` - Check if logged in

**Token Storage**:
```dart
FlutterSecureStorage()
  'ndjigi_access_token'   → JWT access token
  'ndjigi_refresh_token'  → JWT refresh token
  'ndjigi_user'           → User object (serialized)
```

#### 2. **Phone Input Screen** (`mobile/lib/screens/phone_input_screen.dart`)
- **Features**:
  - +226 prefix forced (Burkina Faso)
  - Automatic formatting: "70 12 34 56"
  - Validation (9 digits after +226)
  - Error messages
  - Loading state
  - "Recevoir le code" button

#### 3. **OTP Verification Screen** (`mobile/lib/screens/otp_verification_screen.dart`)
- **Features**:
  - 6 digit input fields with custom formatting
  - Auto-focus between fields
  - Backspace navigation to previous field
  - Auto-submit when all 6 digits entered
  - 60-second countdown timer for resend button
  - "Vérifier" button
  - "Renvoyer le code" button (cooldown-aware)
  - Error display (attempts remaining, blocking, etc.)
  - Phone display (masked)

#### 4. **Dio Interceptor** (`mobile/lib/services/dio_interceptor.dart`)
- **Features**:
  - Adds Authorization header to all requests
  - Automatic token refresh on 401 responses
  - Retries original request with new token
  - Redirects to login on refresh failure

#### 5. **Flutter App Setup** (`mobile/lib/main.dart`)
- **Dio Configuration**:
  ```dart
  BaseOptions(
    baseUrl: 'http://localhost:8000/api/v1',
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 10)
  )
  ```
- **GoRouter Navigation**:
  - `/login` → PhoneInputScreen
  - `/otp-verify` → OtpVerificationScreen
  - `/dashboard` → DashboardScreen
- **Redirect Logic**: Requires authentication for dashboard

#### 6. **Dependencies** (`mobile/pubspec.yaml`)
```yaml
dependencies:
  dio: ^5.3.0
  flutter_secure_storage: ^9.0.0
  go_router: ^11.0.0
  provider: ^6.0.0
  libphonenumber: ^2.3.0
  intl: ^0.19.0
  logger: ^2.0.0
  flutter_dotenv: ^5.1.0
```

---

## Complete OTP Authentication Flow

### Passenger First-Time Login (New User)

```
Frontend (PhoneInputScreen)
    ↓ +226 70 12 34 56
Backend POST /auth/otp/request
    ├─ Normalize: "+226XXXXXXXXXX"
    ├─ Validate: ✓ Burkina Faso
    ├─ Generate OTP: "458732"
    ├─ Store Redis: otp:<phone> (5 min TTL)
    ├─ Send SMS: smsService.send()
    └─ Return: { phone_masked: "+226 70 ** ** 56" }

Frontend navigates to OtpVerificationScreen
    ↓ User enters: 4 5 8 7 3 2
Backend POST /auth/otp/verify
    ├─ Verify OTP: ✓ Match
    ├─ Search Keycloak: user@phone → NOT FOUND
    ├─ Create Keycloak user:
    │   ├─ username: "+226XXXXXXXXXX"
    │   ├─ password: "a1b2c3d4e5f6...32chars" (random)
    │   ├─ assign role: ndjigi-passager
    │   └─ keycloak_id: "uuid"
    ├─ Create local user:
    │   ├─ keycloak_id: "uuid"
    │   ├─ phone: "+226XXXXXXXXXX"
    │   ├─ tech_password_encrypted: "iv:encryptedData:authTag"
    │   └─ auth_method_otp: true
    ├─ Call Direct Access Grant:
    │   └─ username: "+226XXXXXXXXXX", password: "a1b2c3d..."
    └─ Return: { access_token, refresh_token, user }

Frontend (AuthService)
    ├─ Store tokens in FlutterSecureStorage
    ├─ Store user object
    └─ Navigate to /dashboard
```

### Passenger Subsequent Login

```
Frontend (PhoneInputScreen)
    ↓ +226 70 12 34 56
Backend POST /auth/otp/request
    └─ Same as above (generate + send OTP)

Frontend (OtpVerificationScreen)
    ↓ 4 5 8 7 3 2
Backend POST /auth/otp/verify
    ├─ Verify OTP: ✓
    ├─ Search Keycloak: user@phone → FOUND
    ├─ Decrypt tech_password_encrypted
    ├─ Call Direct Access Grant with retrieved password
    └─ Return: tokens
```

---

## API Contract (Phase 5)

### **POST /auth/otp/request**

**Request**:
```json
{
  "phone": "+226701234567" or "701234567" or "0701234567"
}
```

**Success (200)**:
```json
{
  "success": true,
  "message": "Code OTP envoyé par SMS.",
  "data": {
    "phone_masked": "+226 70 ** ** 56"
  }
}
```

**Rate Limit (429)**:
```json
{
  "success": false,
  "message": "Attendez 60 secondes avant de renvoyer.",
  "code": "OTP_RATE_LIMIT"
}
```

**Daily Limit (429)**:
```json
{
  "success": false,
  "message": "Limite quotidienne atteinte. Réessayez demain.",
  "code": "OTP_DAILY_LIMIT"
}
```

---

### **POST /auth/otp/verify**

**Request**:
```json
{
  "phone": "+226701234567",
  "otp_code": "458732"
}
```

**Success (200)**:
```json
{
  "success": true,
  "message": "Authentification réussie.",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 300,
    "token_type": "Bearer",
    "user": {
      "id_utilisateur": "uuid",
      "keycloak_id": "uuid",
      "numero_telephone": "+226701234567",
      "roles": ["passager"],
      "auth_provider": "keycloak",
      "auth_method_otp": true
    }
  }
}
```

**Invalid OTP (400)**:
```json
{
  "success": false,
  "message": "Code OTP incorrect.",
  "code": "INVALID_OTP",
  "data": {
    "attempts_remaining": 2
  }
}
```

**Blocked (429)**:
```json
{
  "success": false,
  "message": "Trop de tentatives. Réessayez dans 15 minutes.",
  "code": "OTP_BLOCKED"
}
```

---

### **POST /auth/otp/resend**

**Request**:
```json
{
  "phone": "+226701234567"
}
```

**Success (200)**:
```json
{
  "success": true,
  "message": "Nouveau code OTP envoyé."
}
```

**Cooldown (429)**:
```json
{
  "success": false,
  "message": "Attendez 45 secondes avant de renvoyer.",
  "code": "RESEND_COOLDOWN",
  "data": {
    "retry_after": 45
  }
}
```

---

## Key Features

| Feature | Implementation |
|---------|-----------------|
| **OTP Generation** | `crypto.randomInt(100000, 999999)` - 6 digits |
| **Phone Normalization** | `libphonenumber-js` → E.164 (+226XXXXXXXXXX) |
| **Encryption** | AES-256-GCM with CRYPTO_SECRET |
| **Session Storage** | Redis with configurable TTLs |
| **Max Attempts** | 3 failures → 15-minute block |
| **Resend Cooldown** | 60 seconds, enforced server-side |
| **Rate Limiting** | 1/min per phone + 5/day per phone |
| **Phone Masking** | Show first 3 and last 2 digits (+226 70 ** ** 56) |
| **User Creation** | Auto-provisioning on first OTP login |
| **Tech Password** | Random 32-char hex, encrypted AES-256-GCM |
| **Token Exchange** | Direct Access Grant with tech password |

---

## Testing Scenarios

### Scenario 1: New Passenger Registration & Login
1. Request OTP with phone: +226 70 12 34 56
2. Receive SMS with 6-digit code
3. Enter code → OTP verification
4. On success:
   - New user created in Keycloak
   - New user created in local DB
   - Tokens returned
5. User logged in, navigated to dashboard

### Scenario 2: Existing Passenger Login
1. Request OTP with same phone
2. Receive SMS
3. Enter code → OTP verification
4. Backend finds existing user in Keycloak
5. Decrypts stored tech_password
6. Returns tokens

### Scenario 3: Wrong Code (3 attempts)
1. Request OTP
2. Enter wrong code → "attempts_remaining: 2"
3. Enter wrong code → "attempts_remaining: 1"
4. Enter wrong code → "OTP_BLOCKED" (429), 15-minute block

### Scenario 4: Rate Limiting
1. Request OTP: OK (1st req)
2. Immediate resend: Blocked with "RESEND_COOLDOWN" (60s)
3. Wait 60s → Resend OK
4. 5th request in 24h: OK
5. 6th request in 24h: Blocked with "OTP_DAILY_LIMIT"

---

## Files Created/Modified

### Backend
- ✅ `backend/src/services/otpService.js` (NEW)
- ✅ `backend/src/services/phoneService.js` (NEW)
- ✅ `backend/src/utils/crypto.js` (NEW)
- ✅ `backend/src/controllers/keycloakAuthController.js` (UPDATED - 3 endpoints)
- ✅ `backend/src/routes/keycloakAuthRoutes.js` (UPDATED - registered OTP endpoints)
- ✅ `backend/prisma/schema.prisma` (UPDATED - added OTP fields)
- ✅ `backend/prisma/migrations/20260517191234_add_otp_auth_fields/migration.sql` (NEW)
- ✅ `backend/.env` (UPDATED - added CRYPTO_SECRET)

### Frontend (Flutter)
- ✅ `mobile/lib/services/auth_service.dart` (NEW)
- ✅ `mobile/lib/services/dio_interceptor.dart` (NEW)
- ✅ `mobile/lib/screens/phone_input_screen.dart` (NEW)
- ✅ `mobile/lib/screens/otp_verification_screen.dart` (NEW)
- ✅ `mobile/lib/main.dart` (NEW)
- ✅ `mobile/pubspec.yaml` (NEW)

### Documentation
- ✅ `docs/auth-migration-plan.md` (UPDATED - Phase 5 marked complete)
- ✅ `docs/PHASE-5-COMPLETION-SUMMARY.md` (THIS FILE - NEW)

---

## Dependencies Added

### Backend
- `libphonenumber-js` (already in Phase 0)

### Frontend (Flutter)
- `dio: ^5.3.0` - HTTP client with interceptors
- `flutter_secure_storage: ^9.0.0` - Secure token storage
- `go_router: ^11.0.0` - Navigation & routing
- `provider: ^6.0.0` - State management
- `libphonenumber: ^2.3.0` - Phone validation (optional, can use validation on backend)

---

## Environment Variables

```bash
# AES-256-GCM encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CRYPTO_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Brute Force OTP | Max 3 attempts → 15-min block per phone |
| Resend Spam | 60-sec cooldown server-side + 5/day limit |
| Daily Limit Bypass | Daily limit tracked per phone in Redis |
| Phone Enumeration | Phone masked in response (+226 70 ** ** 56) |
| Tech Password Leakage | Encrypted AES-256-GCM in DB, never in logs |
| Token Theft | Secure storage on mobile, HTTPOnly not applicable (native) |
| OTP Interception | SMS interception risk (inherent to SMS), mitigated by short expiry (5min) |
| Session Hijacking | Access token expiry (5 min), refresh token rotation |

---

## Summary

Phase 5 successfully implements OTP SMS authentication for passengers, drivers, and proprietors. The flow is:

1. **Request OTP** → Phone validated → OTP generated → SMS sent
2. **Verify OTP** → Code checked (max 3 attempts) → User created/found in Keycloak → Tech password used for token exchange
3. **Return Tokens** → User logged in with access & refresh tokens
4. **Auto-Refresh** → Dio interceptor handles expired tokens automatically

The implementation uses:
- **Phone Normalization** with `libphonenumber-js` for +226 (Burkina Faso)
- **Encryption** (AES-256-GCM) for sensitive data
- **Redis-based Rate Limiting** (1/min + 5/day per phone)
- **Flutter Mobile UI** with 6-digit OTP entry and automatic refresh
- **Keycloak Integration** for user creation and token management

Phase 6 (TOTP 2FA) can now proceed to add optional second factor for passengers.

---

## Next Phases

- **Phase 6**: TOTP 2FA setup screen (QR code) + TOTP verification
- **Phase 7**: Password reset + Admin gestionnaire creation
- **Phase 8**: Full E2E testing + documentation

---

**Implementation completed successfully on 2026-05-17**
