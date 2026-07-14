# Emergency Contact Management API - Documentation

## Base URL
```
/contacts-confiance
```

## Overview
Complete REST API for managing user emergency contacts with relation types and country codes.

---

## Endpoints

### 1. Create Emergency Contact
```
POST /contacts-confiance
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "nom": "Dupont",
  "prenom": "Marie",
  "country_code": "+221",
  "phone": "775551234",
  "relation": "parent"
}
```

**Validation**:
- `nom`: Required, 1-100 chars
- `prenom`: Required, 1-100 chars
- `country_code`: Required, valid country code (+221, +33, +1, etc)
- `phone`: Required, 7-20 chars, digits/spaces/dashes/parentheses only
- `relation`: Required, one of: parent, enfant, conjoint, frere, soeur, cousin, copain, copine, autre

**Limit**: Max 20 contacts per user

**Success Response** (201):
```json
{
  "success": true,
  "message": "Emergency contact created successfully.",
  "data": {
    "id_contact": "uuid-1",
    "id_user": "user-uuid",
    "nom": "Dupont",
    "prenom": "Marie",
    "country_code": "+221",
    "phone": "775551234",
    "relation": "parent",
    "createdAt": "2026-06-05T10:30:00Z",
    "updatedAt": "2026-06-05T10:30:00Z",
    "deletedAt": null
  },
  "errors": null
}
```

**Error Responses**:
- 400: Validation error, contact limit exceeded
- 500: Server error

---

### 2. List Emergency Contacts
```
GET /contacts-confiance?relation=parent&search=Marie&page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters**:
- `relation` (string, optional): Filter by relation type (parent, enfant, etc)
- `search` (string, optional): Search in nom, prenom, or phone
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example Requests**:
```bash
# Get all contacts
curl http://localhost:3000/contacts-confiance \
  -H "Authorization: Bearer {token}"

# Get only parent contacts
curl http://localhost:3000/contacts-confiance?relation=parent \
  -H "Authorization: Bearer {token}"

# Search for contacts with "Marie"
curl "http://localhost:3000/contacts-confiance?search=Marie" \
  -H "Authorization: Bearer {token}"

# Get parents containing "Dupont"
curl "http://localhost:3000/contacts-confiance?relation=parent&search=Dupont" \
  -H "Authorization: Bearer {token}"
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Emergency contacts retrieved.",
  "data": {
    "contacts": [
      {
        "id_contact": "uuid-1",
        "id_user": "user-uuid",
        "nom": "Dupont",
        "prenom": "Marie",
        "country_code": "+221",
        "phone": "775551234",
        "relation": "parent",
        "createdAt": "2026-06-05T10:30:00Z",
        "updatedAt": "2026-06-05T10:30:00Z",
        "deletedAt": null
      }
    ],
    "total": 1,
    "pages": 1
  },
  "errors": null
}
```

---

### 3. Get Single Emergency Contact
```
GET /contacts-confiance/:id
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Contact ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Emergency contact retrieved.",
  "data": {
    "id_contact": "uuid-1",
    "id_user": "user-uuid",
    "nom": "Dupont",
    "prenom": "Marie",
    "country_code": "+221",
    "phone": "775551234",
    "relation": "parent",
    "createdAt": "2026-06-05T10:30:00Z",
    "updatedAt": "2026-06-05T10:30:00Z",
    "deletedAt": null
  },
  "errors": null
}
```

**Error Responses**:
- 403: Contact belongs to another user
- 404: Contact not found or deleted
- 500: Server error

---

### 4. Update Emergency Contact
```
PATCH /contacts-confiance/:id
Content-Type: application/json
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Contact ID

**Request Body** (at least one field):
```json
{
  "nom": "Dupont-Smith",
  "phone": "776661234",
  "relation": "conjoint"
}
```

**Validation**:
- `nom`: Optional, 1-100 chars
- `prenom`: Optional, 1-100 chars
- `country_code`: Optional, valid country code
- `phone`: Optional, 7-20 chars
- `relation`: Optional, valid relation type

**Success Response** (200):
```json
{
  "success": true,
  "message": "Emergency contact updated successfully.",
  "data": {
    "id_contact": "uuid-1",
    "nom": "Dupont-Smith",
    "phone": "776661234",
    "relation": "conjoint",
    "updatedAt": "2026-06-05T10:45:00Z"
  },
  "errors": null
}
```

**Error Responses**:
- 400: Validation error
- 403: Access denied
- 404: Contact not found
- 500: Server error

---

### 5. Delete Emergency Contact
```
DELETE /contacts-confiance/:id
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Contact ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Emergency contact deleted successfully.",
  "data": null,
  "errors": null
}
```

**Notes**:
- Soft delete (sets `deletedAt`)
- Contact is hidden from listings
- Can be permanently deleted from database

**Error Responses**:
- 403: Access denied
- 404: Contact not found
- 500: Server error

---

### 6. Get Contacts by Relation Type
```
GET /contacts-confiance/by-relation/:relation?limit=10
Authorization: Bearer {token}
```

**Path Parameters**:
- `relation` (string): Relation type (parent, enfant, conjoint, frere, soeur, cousin, copain, copine, autre)

**Query Parameters**:
- `limit` (number, optional): Max results to return (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Emergency contacts with relation 'parent' retrieved.",
  "data": {
    "relation": "parent",
    "contacts": [
      {
        "id_contact": "uuid-1",
        "nom": "Dupont",
        "prenom": "Marie",
        "country_code": "+221",
        "phone": "775551234",
        "relation": "parent",
        "createdAt": "2026-06-05T10:30:00Z"
      }
    ],
    "count": 1
  },
  "errors": null
}
```

---

### 7. Get Contact Statistics
```
GET /contacts-confiance/stats
Authorization: Bearer {token}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Emergency contact statistics retrieved.",
  "data": {
    "total": 5,
    "maxPerUser": 20,
    "remaining": 15,
    "byRelation": {
      "parent": 2,
      "enfant": 0,
      "conjoint": 1,
      "frere": 1,
      "soeur": 1,
      "cousin": 0,
      "copain": 0,
      "copine": 0,
      "autre": 0
    }
  },
  "errors": null
}
```

---

## Authentication

All endpoints require authentication:
```
Authorization: Bearer {token}
```

Current user ID is extracted from `req.user.id_utilisateur`.

---

## Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| CONTACT_NOT_FOUND | Contact doesn't exist or deleted | 404 |
| CONTACT_LIMIT_EXCEEDED | User has max 20 contacts | 400 |
| FORBIDDEN | User doesn't own the contact | 403 |
| INTERNAL_ERROR | Server error | 500 |

---

## Relation Types

```
parent      Parent
enfant      Child
conjoint    Spouse
frere       Brother
soeur       Sister
cousin      Cousin
copain      Male friend
copine      Female friend
autre       Other
```

---

## Country Codes (Examples)

```
+1      USA, Canada
+33     France
+44     United Kingdom
+49     Germany
+221    Senegal
+212    Morocco
+213    Algeria
+216    Tunisia
+234    Nigeria
+254    Kenya
... (100+ supported)
```

Full list available in validator.

---

## Data Types

### Contact Object
```typescript
{
  id_contact: string (UUID),          // PK
  id_user: string (UUID),             // FK to utilisateur
  nom: string (1-100),                // Last name
  prenom: string (1-100),             // First name
  country_code: string (+XXX),        // Country code
  phone: string (7-20),               // Phone number (normalized)
  relation: enum (9 options),         // Relation type
  createdAt: DateTime,                // ISO 8601
  updatedAt: DateTime,                // ISO 8601
  deletedAt: DateTime | null          // Soft delete
}
```

---

## Limits & Constraints

- **Max contacts per user**: 20
- **Name length**: 1-100 characters
- **Phone length**: 7-20 characters
- **Soft delete**: Yes (with `deletedAt`)
- **Auto-normalization**: Yes (trim + remove spaces from phone)

---

## Complete Examples

### Create contact with country code
```bash
curl -X POST http://localhost:3000/contacts-confiance \
  -H "Authorization: Bearer eyJhb..." \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Marie",
    "country_code": "+221",
    "phone": "775551234",
    "relation": "parent"
  }'
```

### List all parent contacts
```bash
curl "http://localhost:3000/contacts-confiance?relation=parent" \
  -H "Authorization: Bearer eyJhb..."
```

### Search contacts
```bash
curl "http://localhost:3000/contacts-confiance?search=Marie&page=1&limit=10" \
  -H "Authorization: Bearer eyJhb..."
```

### Update contact
```bash
curl -X PATCH http://localhost:3000/contacts-confiance/uuid-1 \
  -H "Authorization: Bearer eyJhb..." \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "776661234",
    "relation": "conjoint"
  }'
```

### Get contact statistics
```bash
curl http://localhost:3000/contacts-confiance/stats \
  -H "Authorization: Bearer eyJhb..."
```

### Get contacts by relation
```bash
curl "http://localhost:3000/contacts-confiance/by-relation/parent?limit=5" \
  -H "Authorization: Bearer eyJhb..."
```

### Delete contact
```bash
curl -X DELETE http://localhost:3000/contacts-confiance/uuid-1 \
  -H "Authorization: Bearer eyJhb..."
```
