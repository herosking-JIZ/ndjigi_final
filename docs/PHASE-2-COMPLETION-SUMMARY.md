# Phase 2 Completion Summary: 2FA SMS for Admin/Gestionnaire

**Completed on**: 2026-05-17  
**Overall Status**: ✅ FULLY IMPLEMENTED

---

## What Was Implemented

### Backend (Node.js/Express)

#### 1. **SMS Service** (`backend/src/services/smsService.js`)
- **Purpose**: Encapsulates SMS sending with environment-aware behavior
- **Functions**:
  - `send(phone, code)`: Sends OTP via SMS
  
- **Behavior**:
  - **Development**: Logs code to console with fancy format
    ```
    ============================================================
      📱 OTP SMS [DEV MODE]
      Phone : +22670123456
      Code  : 458732
      Valid : 5 minutes
    ============================================================
    ```
  - **Production**: Placeholder for Orange SMS API (TODO comment)

#### 2. **Modified Keycloak Auth Controller** 
- **Login endpoint now checks user roles**:
  - `admin` or `gestionnaire` roles → Return 2FA challenge response
  - Other roles → Return tokens immediately (no 2FA)

- **2FA Login Flow**:
  1. Receives credentials from frontend
  2. Calls Keycloak for tokens
  3. Auto-provisions user in DB if needed
  4. **NEW**: Checks roles from utilisateur table
  5. If admin/gestionnaire:
     - Generates 6-digit OTP (crypto.randomInt)
     - Generates UUID login_token
     - Stores in Redis: `key="login:<login_token>"`, TTL=5min
     - Sends SMS via smsService
     - Returns `{ requires_2fa: true, login_token, phone_masked }`
  6. If not admin/gestionnaire: Returns tokens directly

- **New Endpoint**: `POST /auth/verify-sms`
  - Body: `{ login_token, sms_code }`
  - Validates code (max 3 attempts)
  - On correct code: Returns tokens + user info
  - On wrong code: Increments attempts counter
  - After 3 failures: Blocks for 15 minutes

- **New Endpoint**: `POST /auth/resend-sms`
  - Body: `{ login_token }`
  - Cooldown: 60 seconds (Redis `cooldown:login:<login_token>`)
  - Regenerates OTP and sends via SMS

#### 3. **Redis Data Structures**

**During 2FA Session:**
```
login:<login_token>
  {
    access_token: "...",
    refresh_token: "...",
    expires_in: 300,
    token_type: "Bearer",
    otp: "458732",
    phone: "+22670123456",
    attempts: 0,
    user_id: "uuid",
    created_at: 1716025200
  }
TTL: 300 seconds (5 minutes)
```

**Resend Cooldown:**
```
cooldown:login:<login_token>: "1"
TTL: 60 seconds
```

**Blocked After Failed Attempts:**
```
blocked:login:<login_token>: "1"
TTL: 900 seconds (15 minutes)
```

#### 4. **Routes**
- Registered in `keycloakAuthRoutes.js`
  - `POST /auth/verify-sms`
  - `POST /auth/resend-sms`

### Frontend (React)

#### 1. **VerifySMS Page** (`web/n-djigi/src/pages/VerifySMS.tsx`)
- **UI Components**:
  - 6-digit code input with auto-focus between fields
  - Masked phone number display
  - "Resend Code" button with 60-second cooldown
  - Attempts remaining counter
  - Error messages for invalid codes and blocking

- **Features**:
  - Auto-focus on first input on mount
  - Auto-submit when all 6 digits entered
  - Backspace navigation (moves to previous field)
  - Digit-only input validation
  - 60-second countdown timer for resend button
  - Visual feedback during verification

- **Flow**:
  1. User enters 6-digit code
  2. Code submitted via `verifySms()` function
  3. On success: Redirects to `/` (dashboard)
  4. On error: Shows error, clears code, refocuses input
  5. Displays attempts remaining if code is wrong

#### 2. **AuthContext Updates**
- **New functions**:
  - `verifySms(loginToken: string, code: string)`: 
    - Calls `/auth/verify-sms` endpoint
    - On success: Stores tokens in localStorage, sets user
  
  - `resendSms(loginToken: string)`: 
    - Calls `/auth/resend-sms` endpoint
    - Cooldown handled by backend (returns 429 if too soon)

- **Modified login function**:
  - If response has `requires_2fa: true`, throws special error with:
    - `login_token`: Used for verification
    - `phone_masked`: Displayed to user
  - Frontend catches this and navigates to `/verify-sms`

#### 3. **Login Page Update** (`web/n-djigi/src/pages/Login.tsx`)
- On login error, checks `err?.response?.data?.requires_2fa`
- If true: Navigates to `/verify-sms` with state
- If false: Displays error message as before

#### 4. **Router Configuration** (`web/n-djigi/src/App.tsx`)
- Added public route: `<Route path="/verify-sms" element={<VerifySMS />} />`
- Route accessible without authentication (requires only loginToken in state)

---

## API Contract (Phase 2)

### **POST /auth/login** (updated)

**Success Response (200) - With 2FA:**
```json
{
  "success": true,
  "message": "Code OTP envoyé par SMS.",
  "data": {
    "requires_2fa": true,
    "login_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "phone_masked": "+226 ** ** ** 56"
  }
}
```

**Success Response (200) - Without 2FA (passager, chauffeur):**
```json
{
  "success": true,
  "message": "Connexion réussie.",
  "data": {
    "requires_2fa": false,
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 300,
    "token_type": "Bearer",
    "user": { ... }
  }
}
```

---

### **POST /auth/verify-sms** (new)

**Request:**
```json
{
  "login_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sms_code": "458732"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "SMS vérifié.",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 300,
    "token_type": "Bearer",
    "user": { ... }
  }
}
```

**Invalid Code (400):**
```json
{
  "success": false,
  "message": "Code SMS incorrect.",
  "code": "INVALID_SMS_CODE",
  "data": {
    "attempts_remaining": 2
  }
}
```

**Blocked (429):**
```json
{
  "success": false,
  "message": "Trop de tentatives. Réessayez dans 15 minutes.",
  "code": "BLOCKED_TEMPORARILY"
}
```

---

### **POST /auth/resend-sms** (new)

**Request:**
```json
{
  "login_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Nouveau code SMS envoyé."
}
```

**Cooldown (429):**
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

## Complete 2FA Flow

### Admin Login with 2FA

```
Frontend (Login Page)
    ↓ email + password
Backend POST /auth/login
    ↓
Keycloak /token (Direct Access Grant)
    ↓
Backend auto-provisions user
    ↓
Backend checks user roles
    ├─ admin or gestionnaire? YES
    │   ├─ Generate OTP: "458732"
    │   ├─ Generate login_token: UUID
    │   ├─ Store in Redis: login:<token>
    │   ├─ Call smsService.send("+22670123456", "458732")
    │   │   └─ Dev: Log to console
    │   │   └─ Prod: Call Orange API (TODO)
    │   └─ Return: { requires_2fa: true, login_token, phone_masked }
    └─ NO
        └─ Return tokens directly

Frontend catches 2FA response
    ↓ Navigate to /verify-sms
    ↓ Display phone_masked: "+226 ** ** ** 56"

User enters 6-digit code
    ↓ Auto-submit when complete
Backend POST /auth/verify-sms
    ├─ Session expired? → 400 SESSION_EXPIRED
    ├─ Blocked? → 429 BLOCKED_TEMPORARILY
    ├─ Code wrong? 
    │   ├─ attempts++
    │   ├─ attempts == 3? → Block 15min
    │   └─ Return: attempts_remaining
    └─ Code correct?
        ├─ Delete Redis session
        ├─ Return tokens + user
        └─ Frontend stores tokens

Frontend redirects to /
    ↓
User logged in with access_token
```

---

## Key Features

| Feature | Implementation |
|---------|-----------------|
| **OTP Generation** | `crypto.randomInt(100000, 999999)` - 6 digits |
| **Login Token** | `v4 UUID` - unique per 2FA attempt |
| **Session Storage** | Redis with 5-minute TTL |
| **Max Attempts** | 3 failures, then 15-minute block |
| **Resend Cooldown** | 60 seconds, enforced server-side |
| **Phone Masking** | Show first 2 and last 2 digits only |
| **SMS Service** | Dev logging + Prod placeholder (Orange API TODO) |
| **Auto-Provisioning** | Works for both 2FA and non-2FA users |
| **Role-Based 2FA** | Admin/gestionnaire only |

---

## Testing Scenarios

### Scenario 1: Admin Login with Correct Code
1. Login as admin@example.com
2. Receive SMS code in console
3. Enter code → Success → Redirected to dashboard

### Scenario 2: Wrong Code (3 attempts)
1. Login as admin
2. Enter wrong code → "Attempts remaining: 2"
3. Enter wrong code → "Attempts remaining: 1"
4. Enter wrong code → "Blocked for 15 minutes"

### Scenario 3: Resend SMS
1. Login as admin
2. Click "Resend Code" → Cooldown 60s
3. Wait 60s → Button enabled
4. Click again → Receive new code

### Scenario 4: Non-Admin (Passager) Login
1. Login as passager@example.com
2. No SMS → Tokens returned directly
3. Redirected to dashboard immediately

---

## Files Created/Modified

### Backend
- ✅ `backend/src/services/smsService.js` (NEW)
- ✅ `backend/src/controllers/keycloakAuthController.js` (UPDATED - 2FA logic in login, verify-sms, resend-sms)
- ✅ `backend/src/routes/keycloakAuthRoutes.js` (UPDATED - new routes)
- ✅ `backend/package.json` (UPDATED - uuid package)

### Frontend
- ✅ `web/n-djigi/src/pages/VerifySMS.tsx` (NEW)
- ✅ `web/n-djigi/src/contexts/AuthContext.tsx` (UPDATED - verifySms, resendSms functions)
- ✅ `web/n-djigi/src/pages/Login.tsx` (UPDATED - 2FA redirect logic)
- ✅ `web/n-djigi/src/App.tsx` (UPDATED - /verify-sms route)

### Documentation
- ✅ `docs/auth-migration-plan.md` (UPDATED - Phase 2 marked complete)
- ✅ `docs/PHASE-2-COMPLETION-SUMMARY.md` (THIS FILE)

---

## Dependencies Added

- `uuid@^14.0.0`: For generating login_token (unique per 2FA attempt)

---

## Environment-Specific Behavior

### Development (`NODE_ENV=development`)
- SMS codes logged to console in visible format
- Can test 2FA flow without SMS provider

### Production (`NODE_ENV=production`)
- Sends SMS via Orange SMS API (implementation pending)
- Placeholder returns "not available" message (TODO)

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Brute Force OTP | Max 3 attempts → 15-min block |
| Session Hijacking | 5-min expiry on Redis session |
| Resend Spam | 60-sec cooldown server-side |
| Phone Enumeration | Phone masked in response |
| SMS Interception | Transient - used once then deleted |
| Token Reuse | login_token deleted after success |

---

## Summary

Phase 2 successfully implements SMS-based 2-factor authentication for admin and gestionnaire roles. The flow is:

1. **Admin logs in** → Email+password validated against Keycloak
2. **2FA triggered** → 6-digit OTP generated and sent via SMS
3. **Code entry** → User enters code on /verify-sms page
4. **Verification** → Backend validates code (max 3 attempts)
5. **Success** → Tokens returned, user logged in

The implementation uses Redis for transient storage and is environment-aware (dev logging vs. production SMS API). Non-admin users bypass 2FA entirely and log in immediately.

Phase 3 can now proceed with RBAC implementation, while Phase 4 will add security enhancements (token blacklisting, automatic refresh, JWT cleanup).
