# N'DJIGI Authentication System - Complete Guide

**Version:** 1.0.0  
**Last Updated:** 2026-05-17  
**Status:** Production Ready ✅

---

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [Development Setup](#development-setup)
3. [Architecture](#architecture)
4. [Authentication Flows](#authentication-flows)
5. [Admin Operations](#admin-operations)
6. [Troubleshooting](#troubleshooting)
7. [API Documentation](#api-documentation)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

1. **Clone and setup environment:**
   ```bash
   git clone <repo-url>
   cd ndjigiv1
   cp backend/.env.example backend/.env
   cp web/n-djigi/.env.example web/n-djigi/.env
   ```

2. **Start infrastructure:**
   ```bash
   docker-compose up -d
   ```
   This starts:
   - PostgreSQL (port 5432)
   - Keycloak (port 8080)
   - Redis (port 6379)
   - Mailhog (port 1025)

3. **Initialize database:**
   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   npm run seed
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```
   Backend running on `http://localhost:8000`

5. **Start frontend:**
   ```bash
   cd web/n-djigi
   npm install
   npm run dev
   ```
   Frontend running on `http://localhost:3000`

6. **Access the platform:**
   - Admin: `http://localhost:3000/login`
   - Keycloak: `http://localhost:8080/admin` (admin/admin)
   - Mailhog: `http://localhost:1025`
   - API Docs: `http://localhost:8000/api/v1/docs`

---

## 🔧 Development Setup

### Create Admin User for Testing

```bash
# Run Keycloak setup script
cd scripts/keycloak
./setup-realm.sh

# Or manually create via Keycloak Admin Console
# Email: admin@ndjigi.local
# Password: admin123
# Realm Role: ndjigi-admin
```

### View OTP Codes in Development

OTP codes are sent via SMS service in production, but logged in development:

```bash
# Watch backend logs for OTP codes
docker-compose logs -f backend | grep OTP

# Output example:
# ✅ OTP sent to +226 70 12 34 56: 123456
```

**Note:** In development, use the logged OTP code to test the flow.

### Monitor Redis

Redis stores OTP codes, sessions, and token blacklist:

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Useful commands:
KEYS *                          # List all keys
KEYS otp:*                      # OTP codes
KEYS login:*                    # Login sessions
KEYS blacklist:*                # Revoked tokens
GET <key>                       # Get value
TTL <key>                       # Time to live
DEL <key>                       # Delete key
FLUSHALL                        # Clear all (CAREFUL!)

# Monitor in real-time
MONITOR

# Example: Check OTP for phone
GET otp:+226701234567
# Result: "123456"
```

### Configure Keycloak for Development

#### Export Current Configuration
```bash
# Backup realm
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh \
  export -r ndjigi > keycloak-exports/ndjigi-realm.json
```

#### Import Realm Configuration
```bash
# Restore from backup
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh \
  import -r ndjigi -f keycloak-exports/ndjigi-realm.json

# Or restart with volume mount (automatic)
docker-compose restart keycloak
```

#### Create Test User
```bash
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh \
  create users \
  -r ndjigi \
  -s username=testuser \
  -s email=test@example.com \
  -s emailVerified=true \
  -s enabled=true

# Set password
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh \
  set-password \
  -r ndjigi \
  --username testuser \
  --new-password Test123!
```

### Test Email Delivery

Mailhog receives all emails in development without sending:

1. **Access Mailhog:** `http://localhost:1025`
2. **View sent emails:** All emails appear in the interface
3. **Click reset link:** Directly test password reset flow
4. **Debug SMTP:** Mailhog shows full email details

---

## 🏗️ Architecture

### Authentication System

```
User Input
    ↓
Keycloak OIDC/OAuth2
    ↓
JWT Tokens (access + refresh)
    ↓
Redis Session Cache
    ↓
Protected Resources
```

### Components

**Keycloak (OIDC Provider)**
- Manages users and roles
- Issues JWT tokens
- Handles password resets
- Stores TOTP credentials

**Redis (Session Store)**
- Caches OTP codes (TTL: 5 min)
- Stores login sessions (TTL: 5 min)
- Blacklist for revoked tokens (TTL: token expiry)
- Rate limit counters

**PostgreSQL (Database)**
- User records
- Gestionnaire parking assignments
- Authentication logs
- Technical password storage (encrypted)

### Authentication Methods

#### 1. **Keycloak Email/Password (Admin)**
```
Email → Password → [Optional: 2FA SMS] → Tokens → Dashboard
```

#### 2. **OTP SMS (Mobile Users)**
```
Phone → OTP SMS → Verify Code → [Optional: TOTP Setup] → Tokens
```

#### 3. **TOTP 2FA (After OTP)**
```
OTP Verified → Check TOTP Status
  ├─ New User: Generate QR → Scan → Setup → Verify
  └─ Existing: Enter Code → Verify → Tokens
```

### Token Management

**Access Token**
- Lifespan: 5 minutes
- Used for API requests
- Sent in Authorization header

**Refresh Token**
- Lifespan: 30 minutes
- Used to get new access token
- Stored securely (httpOnly cookie)

**Token Refresh Flow**
```
Access Token Expires
    ↓
Interceptor detects 401
    ↓
POST /auth/refresh with refresh_token
    ↓
Get new access_token
    ↓
Retry original request
    ↓
Success (user never sees login)
```

---

## 🔐 Authentication Flows

### OTP SMS Flow (Passengers/Drivers)

**Request OTP:**
```bash
POST /auth/otp/request
Content-Type: application/json

{
  "phone": "+226 70 12 34 56"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phone_masked": "+226 70 ** ** 56"
  }
}
```

**Verify OTP:**
```bash
POST /auth/otp/verify
Content-Type: application/json

{
  "phone": "+226 70 12 34 56",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "expires_in": 300,
    "token_type": "Bearer",
    "user": {
      "id_utilisateur": "uuid",
      "email": "user@example.com"
    }
  }
}
```

### TOTP 2FA Setup

**After OTP verification (if new user):**

1. Backend returns: `requires_totp_setup: true`
2. Frontend gets QR code URL
3. User scans with Google Authenticator
4. User enters 6-digit code

```bash
POST /auth/totp/setup
Authorization: Bearer <login_token>
Content-Type: application/json

{
  "login_token": "temp-session-token",
  "totp_code": "123456"
}
```

### Password Reset Flow

**Request Reset:**
```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (always 200 for security):**
```json
{
  "success": true,
  "message": "Si cette adresse existe, un email a été envoyé."
}
```

**User receives email → clicks link → Keycloak handles password reset**

---

## 👨‍💼 Admin Operations

### Create Gestionnaire

**Endpoint:**
```bash
POST /api/v1/admin/gestionnaires
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "gestionnaire@example.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "phone": "+226 70 12 34 56",
  "parkings_assignes": ["parking-uuid-1", "parking-uuid-2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "user-uuid",
    "keycloak_id": "kc-uuid",
    "email": "gestionnaire@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "phone": "+226 70 12 34 56",
    "parkings": [
      {
        "id_parking": "uuid",
        "nom": "Parking Central",
        "adresse": "123 Avenue..."
      }
    ]
  }
}
```

**What happens:**
1. ✅ Keycloak user created with temporary password
2. ✅ Role `ndjigi-gestionnaire` assigned
3. ✅ Local database entry created
4. ✅ Parkings assigned
5. ✅ Welcome email sent with temp password
6. ✅ Auth log entry created

### View Authentication Logs

**Query auth logs:**
```sql
SELECT * FROM auth_log
WHERE event_type = 'GESTIONNAIRE_CREATED_BY_ADMIN'
ORDER BY created_at DESC
LIMIT 10;
```

**Event types:**
- `GESTIONNAIRE_CREATED_BY_ADMIN`
- `USER_LOGGED_IN`
- `OTP_VERIFIED`
- `TOTP_VERIFIED`
- `TOKEN_REFRESHED`
- `USER_LOGGED_OUT`

### Revoke User Session

**Block a specific token immediately:**
```bash
# Via Redis CLI
redis-cli SET blacklist:jti 1 EX <ttl_remaining>

# Example: Block for 1 hour
redis-cli SET blacklist:abc123def456 1 EX 3600
```

**Effect:** User's current session becomes invalid. They must log in again.

---

## 🐛 Troubleshooting

### ❌ Problem 1: "Invalid client" Error at Login

**Symptoms:**
- Keycloak login fails with "invalid_client"
- Backend logs show client authentication error

**Causes:**
1. Wrong `KEYCLOAK_CLIENT_SECRET`
2. Client secret changed in Keycloak
3. Client not properly configured

**Solutions:**
```bash
# 1. Verify secret matches
echo $KEYCLOAK_CLIENT_SECRET  # Should be 32+ chars

# 2. Check Keycloak client settings
# Admin Console → Realm → Clients → ndjigi-backend
# Copy "Client Secret" exactly

# 3. Update .env
KEYCLOAK_CLIENT_SECRET=<copied_secret>

# 4. Restart backend
docker-compose restart backend

# 5. Test with curl
curl -X POST http://localhost:8080/realms/ndjigi/protocol/openid-connect/token \
  -d "client_id=ndjigi-backend" \
  -d "client_secret=<secret>" \
  -d "grant_type=client_credentials"
```

### ❌ Problem 2: SMS OTP Never Arrives

**Symptoms:**
- OTP request succeeds
- No SMS received
- Code not in logs

**Causes:**
1. SMS provider not configured
2. Phone number format invalid
3. Rate limiting blocking request

**Solutions:**
```bash
# 1. Check SMS provider configuration
cat backend/.env | grep SMS_

# 2. Check phone format validation
POST /auth/otp/request
{
  "phone": "+226 70 12 34 56"  // Correct format
}

# 3. Check Redis for OTP code
redis-cli GET otp:+226701234567  // Should return "123456"

# 4. Verify rate limiting isn't blocking
redis-cli KEYS "otp:*"  // See all OTP codes
redis-cli TTL otp:+226701234567  // Check TTL

# 5. Check logs
docker-compose logs backend | grep -i otp
docker-compose logs backend | grep -i rate

# 6. If SMS provider not configured, use development logs
docker-compose logs backend | grep OTP
```

### ❌ Problem 3: Token Refresh Fails (Infinite Redirect Loop)

**Symptoms:**
- Stuck redirecting to login
- "Cannot refresh token" error
- Infinite redirect loop

**Causes:**
1. Refresh token expired
2. Token blacklisted (user logged out elsewhere)
3. Redis connection lost
4. Refresh token invalid format

**Solutions:**
```bash
# 1. Clear browser storage and login again
# Dev Tools → Application → LocalStorage → Clear All

# 2. Check refresh token in Redis
redis-cli KEYS "refresh_token:*"

# 3. Verify token not blacklisted
redis-cli KEYS "blacklist:*" | grep <jti>

# 4. Check Redis connection
redis-cli ping  # Should respond with PONG

# 5. Verify refresh endpoint works
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"<token>\"}"

# 6. Logout everywhere and login again
# (Clears all sessions)
```

### ❌ Problem 4: Email (Gestionnaire Invitation) Not Sent

**Symptoms:**
- Gestionnaire created successfully
- No email received
- No error in logs

**Causes:**
1. SMTP not configured
2. Email service crashed
3. Mailhog not accessible
4. Email address invalid

**Solutions:**
```bash
# 1. Verify SMTP configuration
cat backend/.env | grep SMTP_

# 2. Test SMTP connection
telnet localhost 1025  # For Mailhog
# Or for Gmail:
telnet smtp.gmail.com 587

# 3. Check Mailhog interface
open http://localhost:1025

# 4. Check backend logs for email errors
docker-compose logs backend | grep -i email

# 5. Verify email service is loaded
docker-compose logs backend | grep "Email service ready"

# 6. Test send manually via API
curl -X POST http://localhost:8000/api/v1/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\"}"

# 7. Check email template files exist
ls -la backend/src/services/emails/templates/
```

### ❌ Problem 5: OTP Blocked After 3 Failures

**Symptoms:**
- "Too many attempts" error
- Cannot request new OTP
- Must wait 15 minutes

**Causes:**
- 3 incorrect OTP codes entered
- Rate limiting triggered
- Phone number temporarily blocked

**Solutions:**
```bash
# 1. Wait 15 minutes (automatic unblock)

# 2. Or manually unblock via Redis (dev only)
redis-cli DEL otp:blocked:+226701234567

# 3. Resend OTP with new request
POST /auth/otp/request

# 4. Prevent in future:
# - Double-check OTP code before entering
# - Copy exactly from logs (if development)
# - Wait for SMS to arrive completely

# 5. Check remaining attempts via API
# Error response includes: "attempts_remaining": 2
```

### ✅ Verification Checklist

Before reporting issues, verify:

- [ ] Backend running: `curl http://localhost:8000/api/v1/health`
- [ ] PostgreSQL connected: `psql postgresql://...`
- [ ] Redis running: `redis-cli ping`
- [ ] Keycloak accessible: `curl http://localhost:8080`
- [ ] Frontend running: `curl http://localhost:3000`
- [ ] Network connectivity: `ping google.com`
- [ ] Port conflicts: `lsof -i :8000` (should be empty)
- [ ] Environment variables set: `echo $KEYCLOAK_CLIENT_SECRET`
- [ ] Recent logs checked: `docker-compose logs --tail=50`

---

## 📚 API Documentation

### Access Swagger UI

**URL:** `http://localhost:8000/api/v1/docs`

**Features:**
- ✅ All endpoints documented with examples
- ✅ Try it out feature to test endpoints
- ✅ Request/response schema examples
- ✅ Authentication instructions
- ✅ Rate limit information

### Key Endpoints

#### Authentication
```
POST   /auth/login               # Keycloak email/password login
POST   /auth/refresh             # Refresh access token
POST   /auth/logout              # Logout (revoke tokens)
POST   /auth/forgot-password     # Trigger password reset email
```

#### OTP (SMS)
```
POST   /auth/otp/request         # Request OTP code
POST   /auth/otp/verify          # Verify OTP and login
POST   /auth/otp/resend          # Resend OTP (60s cooldown)
```

#### TOTP (2FA)
```
POST   /auth/totp/setup          # Register TOTP credential
POST   /auth/totp/verify         # Verify TOTP code
```

#### Admin
```
POST   /api/v1/admin/gestionnaires  # Create gestionnaire
GET    /api/v1/admin/gestionnaires  # List gestionnaires
PUT    /api/v1/admin/gestionnaires/:id # Update gestionnaire
DELETE /api/v1/admin/gestionnaires/:id # Delete gestionnaire
```

### Rate Limits

| Endpoint | Limit | Window | Code |
|----------|-------|--------|------|
| `/auth/otp/request` | 1 per 60s, 5 per 24h | 60s / 24h | OTP_RATE_LIMIT |
| `/auth/otp/resend` | Cooldown 60s | 60s | RESEND_COOLDOWN |
| `/auth/login` | 10 per 15min | 15min | RATE_LIMIT |
| `/auth/forgot-password` | 5 per 1h | 1h | RATE_LIMIT |
| `/auth/totp/setup` | 10 per 15min | 15min | TOTP_RATE_LIMIT |
| `/auth/totp/verify` | 10 per 15min | 15min | TOTP_RATE_LIMIT |

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* endpoint-specific */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| VALIDATION_ERROR | 400 | Missing/invalid fields | Check request body |
| INVALID_OTP | 400 | Wrong OTP code | Try again (max 3 attempts) |
| OTP_BLOCKED | 429 | Too many attempts | Wait 15 minutes |
| RESEND_COOLDOWN | 429 | Too soon to resend | Wait 60 seconds |
| RATE_LIMIT | 429 | Rate limit exceeded | Wait until window resets |
| TOKEN_REVOKED | 401 | Token in blacklist | Login again |
| INVALID_TOKEN | 401 | Token expired/invalid | Refresh or login |
| UNAUTHORIZED | 401 | No authentication | Login first |
| FORBIDDEN | 403 | Insufficient permissions | Check user role |

---

## 🔍 Monitoring & Maintenance

### Daily Checks

```bash
# 1. Check backend health
curl http://localhost:8000/api/v1/health

# 2. Monitor Redis memory
redis-cli INFO memory

# 3. Check for failed logins
docker-compose logs backend | grep "invalid\|failed\|error"

# 4. Verify email delivery
open http://localhost:1025  # Check Mailhog

# 5. Monitor active sessions
redis-cli KEYS "login:*" | wc -l  # Should be low
```

### Weekly Tasks

```bash
# 1. Review authentication logs
SELECT COUNT(*) FROM auth_log 
WHERE created_at > NOW() - INTERVAL '7 days';

# 2. Check OTP success rate
SELECT 
  COUNT(CASE WHEN event_type = 'OTP_VERIFIED' THEN 1 END) as verified,
  COUNT(CASE WHEN event_type LIKE '%OTP%' THEN 1 END) as total
FROM auth_log
WHERE created_at > NOW() - INTERVAL '7 days';

# 3. Verify gestionnaire activity
SELECT COUNT(*) FROM auth_log 
WHERE event_type = 'GESTIONNAIRE_CREATED_BY_ADMIN'
AND created_at > NOW() - INTERVAL '7 days';

# 4. Audit role assignments
SELECT user_id, COUNT(*) as role_count 
FROM utilisateur_role 
WHERE actif = true
GROUP BY user_id;

# 5. Backup Keycloak realm
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh \
  export -r ndjigi > keycloak-exports/ndjigi-realm-$(date +%Y%m%d).json
```

### Monthly Tasks

```bash
# 1. Security audit
# Review all changes to auth code
git log --since="30 days ago" --oneline -- src/

# 2. Token blacklist cleanup
redis-cli KEYS "blacklist:*" | wc -l  # Should be manageable

# 3. Database optimization
VACUUM ANALYZE;
REINDEX;

# 4. Update dependencies
npm outdated
npm update

# 5. Review error logs
grep -i "error\|exception\|fatal" backend.log | tail -100
```

### Performance Tuning

```bash
# Monitor slow queries
# In PostgreSQL:
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Monitor Redis
redis-cli --stat

# Check Keycloak performance
# Admin Console → Realm → Metrics

# Monitor Docker resources
docker stats
```

---

## 📞 Support

### Getting Help

1. **Check documentation:** Start with this guide
2. **Review logs:** `docker-compose logs -f backend`
3. **Check Swagger:** `http://localhost:8000/api/v1/docs`
4. **Contact team:** Open issue in GitHub

### Common Commands

```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend
docker-compose logs -f keycloak

# Reset development environment
docker-compose down -v
docker-compose up -d
npm run seed

# Connect to database
psql postgresql://ndjigi_user:1234567890@localhost:5432/ndjigi_db

# Clear Redis
redis-cli FLUSHALL

# Run tests
npm test
npm run test:e2e
```

---

## 📋 Checklist for Production

Before deploying to production:

- [ ] All environment variables configured
- [ ] HTTPS enabled on all endpoints
- [ ] Keycloak configured for production domain
- [ ] Database backups configured
- [ ] Redis memory/persistence configured
- [ ] SMTP configured with real email service
- [ ] SMS provider integrated
- [ ] Logging and monitoring enabled
- [ ] Rate limiting tested and tuned
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Database indexes created
- [ ] Performance tested under load
- [ ] Disaster recovery plan documented
- [ ] Team trained on operations

---

**For detailed API documentation, visit:** `http://localhost:8000/api/v1/docs`

**For architecture overview, see:** `/docs/AUTH_ARCHITECTURE.md`

**For migration plan, see:** `/docs/auth-migration-plan.md`
