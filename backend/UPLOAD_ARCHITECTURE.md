# Upload System Architecture

## Overview

Production-ready file upload system for N-Djigi SaaS B2C platform. Handles user uploads with magic bytes validation, quota management, deduplication, and secure storage abstraction.

**Stack**: Express.js + Multer + Prisma + PostgreSQL + Local filesystem (S3-ready abstraction)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│              POST /documents (multipart/form-data)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │  Rate Limiter (20/15min per user)        │
        └──────────────────┬───────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │  Authentication Middleware (JWT/Keycloak)│
        └──────────────────┬───────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │  Multer diskStorage (temp folder)        │
        │  - UUID filename (no ext)                │
        │  - Whitelist MIME header check           │
        │  - Max 50MB per file                     │
        └──────────────────┬───────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                    │
         ▼                                    ▼
┌────────────────────┐         ┌──────────────────────┐
│  documentController│         │  Multer Middleware   │
│  .uploadDocument() │         │  (req.file ready)    │
│                    │         └──────────────────────┘
│ 1. Verify file     │
│ 2. Check quota     │
│ 3. Magic bytes     │─────────────────┐
│ 4. MIME match      │                  │
│ 5. SHA256 hash     │  file-type lib   │
│ 6. Dedup check     │                  │
│ 7. Construct key   │         ┌────────┴─────────┐
│ 8. DB create       │         │  fileTypeFromFile│
│ 9. Move file       │         └──────────────────┘
│ 10. DB update      │
│ 11. Return URL     │
└────────────────────┘
         │
         │ fileKey: YYYY-MM/{userId}/{uuid}{ext}
         │
         ▼
┌──────────────────────────────┐
│   StorageProvider Interface  │
│   - save(tempPath, key)      │
│   - delete(key)              │
│   - getReadStream(key)       │
│   - exists(key)              │
└────┬─────────────────────────┘
     │
     ├─────────────────┬─────────────────────┐
     │                 │                     │
     ▼                 ▼                     ▼
┌──────────────┐  ┌────────────┐  ┌──────────────┐
│LocalStorage  │  │  (S3 TBD)  │  │ (Others TBD) │
│Provider      │  │            │  │              │
│              │  │ (future)   │  │ (future)     │
│ uploads/     │  │            │  │              │
│ storage/     │  │            │  │              │
└──────────────┘  └────────────┘  └──────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Filesystem (local disk)     │
│  Permissions: 600 (files)    │
│  Permissions: 700 (dirs)     │
└──────────────────────────────┘


Download Flow:
──────────────
GET /documents/:id/fichier
        │
        ├─ Auth check
        ├─ Lookup doc in DB
        ├─ Verify status = READY
        ├─ Verify ownership
        ├─ Get read stream from storage
        ├─ Set secure headers (nosniff, CSP)
        │
        └─> Pipe to response
```

---

## File Organization

```
backend/
├── src/
│   ├── config/
│   │   └── multer.config.js          # Multer + whitelist MIME types
│   ├── controllers/
│   │   └── documentController.js     # Upload + serve logic
│   ├── routes/
│   │   └── documentRoute.js          # Endpoints + middlewares
│   ├── middlewares/
│   │   ├── documentUpload.middleware.js (legacy, kept for compat)
│   │   └── uploadRateLimit.js         # 20/15min limiter
│   ├── storage/
│   │   ├── StorageProvider.js        # Abstract interface
│   │   ├── LocalStorageProvider.js   # Local disk implementation
│   │   └── index.js                  # Factory (STORAGE_PROVIDER env)
│   └── jobs/
│       └── cleanupOrphans.js         # Cleanup PENDING >1h
├── prisma/
│   ├── schema.prisma                 # Extended document model
│   └── migrations/
│       └── 20260519222041_add_upload_system/
│           └── migration.sql         # DB schema changes
├── tests/
│   └── upload.test.js                # Smoke tests
└── .env.example                      # New upload env vars
```

---

## Required Environment Variables

```bash
# Storage Provider (required)
STORAGE_PROVIDER=local              # "local" (S3 TBD)
STORAGE_LOCAL_BASE_DIR=./uploads/storage

# Upload Configuration
UPLOAD_TEMP_DIR=./uploads/temp      # Temporary staging dir
MAX_FILE_SIZE_BYTES=52428800        # 50 MB per file
USER_QUOTA_BYTES=1073741824         # 1 GB per user

# Database (existing, must have these)
DATABASE_URL=postgresql://...       # PostgreSQL connection
JWT_SECRET=...                      # Auth token secret
```

---

## API Endpoints

### 1. Upload File (POST)

```
POST /documents
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

Body:
  fichier: <file>              # Required, up to 50 MB
  title: "My Document"         # Optional, sanitized to [a-zA-Z0-9 .\-_]{0,200}
  type: "general|permis|etc"   # Optional, default "general"

Response (201 Created):
{
  "success": true,
  "message": "File uploaded successfully.",
  "data": {
    "id_document": "uuid",
    "fileUrl": "/documents/uuid/fichier",
    "duplicate": false
  }
}

Response (200 OK - Duplicate):
{
  "success": true,
  "message": "File already exists (duplicate).",
  "data": {
    "id_document": "uuid",
    "fileUrl": "/documents/uuid/fichier",
    "duplicate": true
  }
}

Errors:
  400 - NO_FILE_UPLOADED
  400 - UNKNOWN_FILE_TYPE (can't detect magic bytes)
  400 - FILE_TYPE_NOT_ALLOWED (not in whitelist)
  400 - MIME_MISMATCH (client declared != detected)
  413 - QUOTA_EXCEEDED (user storage full)
  429 - RATE_LIMIT_EXCEEDED (20/15min per user)
  500 - STORAGE_ERROR (disk write failed)
```

### 2. Serve File (GET)

```
GET /documents/{id}/fichier
Authorization: Bearer {jwt_token}

Response (200 OK):
  - Content-Type: {document.mimeType}
  - Content-Length: {document.fileSize}
  - Content-Disposition: attachment; filename="..."
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy: default-src 'none'
  - Body: file stream

Errors:
  400 - INVALID_ID_FORMAT
  400 - DOCUMENT_NOT_READY (status != READY)
  403 - FORBIDDEN (not owner)
  404 - DOCUMENT_NOT_FOUND
  500 - FILE_READ_ERROR
```

---

## Key Security Features

### ✅ MIME Type Validation

- **Client MIME** checked at HTTP header level (reject early)
- **Magic Bytes** validated via `file-type` lib (reads file header)
- **Mismatch Detection** : Declared MIME must match detected MIME (spoof prevention)
- **Whitelist** : Only PDF, images (jpeg, png, webp, gif), video (mp4, webm), audio (mp3, wav)
- **No Archives** : Explicitly reject zip, rar, 7z, tar, etc.

### ✅ Quota Management

- Per-user storage quota: default 1 GB (configurable)
- Only counts non-soft-deleted documents
- Checked before file acceptance
- `fileSize` stored as `BigInt` for large files

### ✅ Deduplication

- SHA256 hash computed via streaming (no full file in RAM)
- Duplicate check : same hash + same userId + not soft-deleted = return existing
- Prevents accidental re-uploads
- Reduces storage bloat

### ✅ Path Traversal Protection

- Filename is UUID (no client input used)
- Storage key format: `YYYY-MM/{userId}/{uuid}{ext}`
- `LocalStorageProvider._resolvePath()` validates path resolution
- Rejects `../`, `..\\`, and attempts to escape baseDir
- All paths resolved and verified before operations

### ✅ File Permissions

- **Files** : 600 (owner read/write only, no world/group access)
- **Directories** : 700 (owner rwx only)
- Enforced at filesystem level

### ✅ Transaction Safety (DB ↔ Filesystem)

- Document created in DB with `status: PENDING` first
- File moved from temp to final location
- If storage move fails → DB document deleted (rollback)
- If move succeeds → `status` updated to `READY`
- No orphaned files or DB records

### ✅ Download Authorization

- Authentication required (`jwt_token`)
- Ownership verified (userId must match)
- Only `status: READY` documents served
- Soft-deleted documents rejected (404)
- Secure headers set (`nosniff`, `Content-Security-Policy`)

### ✅ Rate Limiting

- 20 uploads per 15 minutes per user
- Fallback to IP if not authenticated
- Returns JSON error (not plain text)

---

## Supported MIME Types & Extensions

| Category | MIME Type | Extension |
|----------|-----------|-----------|
| **Document** | `application/pdf` | `.pdf` |
| **Image** | `image/jpeg` | `.jpg` |
| **Image** | `image/png` | `.png` |
| **Image** | `image/webp` | `.webp` |
| **Image** | `image/gif` | `.gif` |
| **Video** | `video/mp4` | `.mp4` |
| **Video** | `video/webm` | `.webm` |
| **Audio** | `audio/mpeg` | `.mp3` |
| **Audio** | `audio/wav` | `.wav` |

**Explicitly Rejected** : zip, rar, 7z, tar, exe, dll, com, bat, cmd, sh, etc.

---

## Database Schema Changes

### Document Model (Extended)

```prisma
model document {
  id_document         String      // UUID primary key
  id_utilisateur      String      // FK to utilisateur
  type                String      // "permis", "assurance", "general", etc. (backward compat)
  
  // New fields for upload system
  title               String?     // Sanitized filename, max 200 chars
  fileKey             String?     // Unique: "YYYY-MM/{userId}/{uuid}{ext}"
  mimeType            String?     // Detected MIME type (immutable)
  fileSize            BigInt?     // File size in bytes
  storageHash         String?     // SHA256 hex (64 chars)
  status              String?     // PENDING | READY | FAILED (default READY for backward compat)
  
  // Timestamps & soft delete
  createdAt           DateTime    // Auto set on create
  updatedAt           DateTime    // Auto updated on each write
  deletedAt           DateTime?   // Soft delete flag (null = active)
  
  // Backward compat fields (still present)
  url_fichier         String      // File path (populated with fileKey)
  motif_rejet         String?     // Rejection reason
  statut_verification String      // en_attente, valide, rejete
  date_soumission     DateTime    // Auto set
  date_expiration     DateTime?   // Optional expiry date
}

Indexes:
  - [id_utilisateur, deletedAt] : Find user's active documents
  - [storageHash, id_utilisateur] : Deduplication check
  - [status, createdAt] : Cleanup job (find orphans)
```

### Migration

File: `prisma/migrations/20260519222041_add_upload_system/migration.sql`

To apply:
```bash
cd backend
npm prisma migrate deploy
```

---

## Testing

Run smoke tests:

```bash
cd backend
npm test -- tests/upload.test.js
```

### Test Coverage

- ✅ LocalStorageProvider file operations (save, delete, getReadStream, exists)
- ✅ Path traversal protection (reject `../`, `../../`, etc.)
- ✅ Directory & file permissions (700, 600)
- ✅ MIME type whitelist (has allowed, excludes archives)
- ✅ Environment configuration (quota, max file size)

### Manual Testing Checklist

- [ ] Upload valid PDF → 201, file on disk, DB ready, can download
- [ ] Upload with MIME spoof (PDF declared, JPEG magic) → 400
- [ ] Upload >50 MB → 413
- [ ] Upload 3 files then 17 more → 429 on upload 21
- [ ] Upload duplicate → 200 + `duplicate: true`
- [ ] GET `/documents/:id/fichier` as owner → 200 + stream
- [ ] GET `/documents/:id/fichier` as other user → 403
- [ ] GET soft-deleted document → 404
- [ ] Run cleanup job → orphans removed
- [ ] Fill user quota then upload → 413
- [ ] Check file permissions (600, 700) → `ls -la uploads/`

---

## Cleanup Job

### Orphan Cleanup (PENDING >1 hour)

File: `src/jobs/cleanupOrphans.js`

Export:
```javascript
const { cleanupOrphans } = require('./src/jobs/cleanupOrphans');
```

Usage:
```javascript
// Run once on startup
await cleanupOrphans(); // { deleted: 5 }

// Or schedule with cron (optional)
const cron = require('node-cron');
cron.schedule('0 * * * *', async () => {
  await cleanupOrphans();
});
```

Behavior:
- Finds documents with `status: PENDING` and `createdAt < now - 1 hour`
- Deletes file from storage (via `storage.delete()`)
- Deletes DB record
- Logs count deleted
- Handles failures gracefully (logs per orphan, continues)

---

## Future: Migrating to S3

### When to Migrate

Trigger migration when ANY of these thresholds is reached:

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Total storage used** | 100+ GB | Local disk becomes expensive, S3 is cost-effective |
| **Active users** | 5,000+ | Scale horizontal, reduce local I/O bottleneck |
| **Upload rate** | 1,000+/day | High concurrency, S3 handles better |
| **Redundancy requirement** | Critical | S3 provides replication, local needs manual backup |
| **Deployment model** | Multi-server | Can't shard files across servers, need shared storage |

### Migration Steps

1. **Create S3StorageProvider**
   ```javascript
   // src/storage/S3StorageProvider.js
   class S3StorageProvider extends StorageProvider {
     constructor(bucketName, region, credentials) { ... }
     async save(tempPath, finalKey) { ... }
     async delete(key) { ... }
     async getReadStream(key) { ... }
   }
   ```

2. **Update factory in `src/storage/index.js`**
   ```javascript
   if (STORAGE_PROVIDER === 's3') {
     storageInstance = new S3StorageProvider(...);
   }
   ```

3. **Env variables (new)**
   ```
   STORAGE_PROVIDER=s3
   S3_BUCKET_NAME=...
   S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```

4. **No changes needed** to:
   - documentController.uploadDocument()
   - documentController.serveFile()
   - Database schema
   - Tests (mock storage provider)

5. **Optional optimization**
   - Add CloudFront CDN for downloads
   - Add S3 presigned URLs to bypass app download endpoint
   - Add S3 lifecycle policies (archive old files)

---

## Troubleshooting

### 400 - UNKNOWN_FILE_TYPE
**Cause** : file-type lib could not detect magic bytes  
**Solution** : File may be corrupted or not a real document. Ask user to re-export.

### 400 - MIME_MISMATCH
**Cause** : Client declared one MIME, but magic bytes detected another  
**Solution** : File header doesn't match declared type (spoof attempt or extension mismatch). Re-save in correct format.

### 413 - QUOTA_EXCEEDED
**Cause** : User has already uploaded and reached 1 GB (or configured limit)  
**Solution** : User must delete older documents or upgrade plan. Admin can increase `USER_QUOTA_BYTES`.

### 429 - RATE_LIMIT_EXCEEDED
**Cause** : User uploaded 20 times in 15 minutes  
**Solution** : Wait 15 minutes, or ask admin to adjust `uploadRateLimiter` in `src/middlewares/uploadRateLimit.js`.

### 500 - STORAGE_ERROR
**Cause** : Disk full, permission denied, or drive unmounted  
**Solution** : Check disk space (`df -h /uploads`), permissions (`ls -la /uploads`), and permissions in code (mode 0o700).

### File exists but can't download (404)
**Cause** : Document status is not `READY` (might be `PENDING` or `FAILED`)  
**Solution** : Check DB: `SELECT id_document, status, fileKey FROM document WHERE id_document = '...'`. If stuck `PENDING`, run cleanup job.

### 403 - FORBIDDEN (can download own but not others)
**Cause** : OAuth scopes may be wrong, or userId mismatch  
**Solution** : Verify `req.user.id_utilisateur` is correctly set by auth middleware.

---

## Performance Tuning

### Reduce SHA256 Hash Time
- Already streaming (not loading full file in RAM)
- Use `crypto.createHash('sha256')` native implementation (fast)
- No further optimization needed for <50 MB files

### Reduce DB Queries on Upload
- `findMany()` for quota check : O(n) documents per user
- **Optimization (future)** : Add `totalStorageBytes` column to `utilisateur` table, update atomically
- For now, acceptable for <50k documents per user

### Reduce File Seek on Download
- Use `fs.createReadStream()` (no seeking, pure sequential)
- Already optimal for local disk
- **With S3** : Use streaming from S3 SDK (no local buffer)

### Reduce Rate Limit Calls
- express-rate-limit uses in-memory store (fast)
- Redis store optional if scaling to multi-server deployment
- For single-server MVP, in-memory is fine

---

## Changelog

### v1.0.0 (2026-05-19) - Initial Release

- ✅ MIME validation (magic bytes + client MIME match)
- ✅ User quota (1 GB default, configurable)
- ✅ SHA256 deduplication (streaming hash)
- ✅ Storage abstraction (Local, S3-ready)
- ✅ Rate limiting (20/15min)
- ✅ Path traversal protection
- ✅ File permissions (600, 700)
- ✅ Transaction safety (DB ↔ filesystem)
- ✅ Soft delete + cleanup job
- ✅ Smoke tests
- ✅ Production-ready error messages
