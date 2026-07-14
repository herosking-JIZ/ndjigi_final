# Address Management API - Documentation

## Base URL
```
/addresses
```

## Overview
Complete REST API for managing user saved addresses with favorites support.

---

## Endpoints

### 1. Create Address
```
POST /addresses
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "label": "Domicile",
  "address": "123 Rue de la Paix, Dakar, Senegal",
  "latitude": 14.7167,
  "longitude": -17.4674,
  "isfavorite": true
}
```

**Validation**:
- `label`: Required, 1-100 chars
- `address`: Required, 5-500 chars
- `latitude`: Required, -90 to 90
- `longitude`: Required, -180 to 180
- `isfavorite`: Optional, boolean (default: false)

**Success Response** (201):
```json
{
  "success": true,
  "message": "Address created successfully.",
  "data": {
    "id_address": "uuid-1",
    "id_user": "user-uuid",
    "label": "Domicile",
    "address": "123 Rue de la Paix, Dakar, Senegal",
    "latitude": 14.7167,
    "longitude": -17.4674,
    "isfavorite": true,
    "createdAt": "2026-06-05T10:30:00Z",
    "updatedAt": "2026-06-05T10:30:00Z"
  },
  "errors": null
}
```

**Error Responses**:
- 400: Invalid geolocation, validation error
- 500: Server error

---

### 2. List Addresses
```
GET /addresses?favorite=true&label=Domicile&search=rue&page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters**:
- `favorite` (boolean, optional): Filter by favorite status (true|false)
- `label` (string, optional): Filter by exact label match
- `search` (string, optional): Search in address field (LIKE)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example Requests**:
```bash
# Get all addresses
curl http://localhost:3000/addresses \
  -H "Authorization: Bearer {token}"

# Get only favorites
curl http://localhost:3000/addresses?favorite=true \
  -H "Authorization: Bearer {token}"

# Search for addresses containing "rue"
curl http://localhost:3000/addresses?search=rue \
  -H "Authorization: Bearer {token}"

# Get favorites with label "Domicile"
curl "http://localhost:3000/addresses?favorite=true&label=Domicile" \
  -H "Authorization: Bearer {token}"
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Addresses retrieved.",
  "data": {
    "addresses": [
      {
        "id_address": "uuid-1",
        "id_user": "user-uuid",
        "label": "Domicile",
        "address": "123 Rue de la Paix, Dakar",
        "latitude": 14.7167,
        "longitude": -17.4674,
        "isfavorite": true,
        "createdAt": "2026-06-05T10:30:00Z",
        "updatedAt": "2026-06-05T10:30:00Z"
      },
      {
        "id_address": "uuid-2",
        "id_user": "user-uuid",
        "label": "Travail",
        "address": "456 Boulevard du Gueule Tapée, Dakar",
        "latitude": 14.6928,
        "longitude": -17.4467,
        "isfavorite": false,
        "createdAt": "2026-06-04T15:45:00Z",
        "updatedAt": "2026-06-04T15:45:00Z"
      }
    ],
    "total": 2,
    "pages": 1
  },
  "errors": null
}
```

---

### 3. Get Single Address
```
GET /addresses/:id
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Address ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Address retrieved.",
  "data": {
    "id_address": "uuid-1",
    "id_user": "user-uuid",
    "label": "Domicile",
    "address": "123 Rue de la Paix, Dakar",
    "latitude": 14.7167,
    "longitude": -17.4674,
    "isfavorite": true,
    "createdAt": "2026-06-05T10:30:00Z",
    "updatedAt": "2026-06-05T10:30:00Z"
  },
  "errors": null
}
```

**Error Responses**:
- 403: Address belongs to another user
- 404: Address not found
- 500: Server error

---

### 4. Update Address
```
PATCH /addresses/:id
Content-Type: application/json
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Address ID

**Request Body** (at least one field):
```json
{
  "label": "Maison",
  "address": "Updated address",
  "latitude": 14.7200,
  "longitude": -17.4700,
  "isfavorite": false
}
```

**Validation**:
- `label`: Optional, 1-100 chars
- `address`: Optional, 5-500 chars
- `latitude`: Optional, -90 to 90
- `longitude`: Optional, -180 to 180
- `isfavorite`: Optional, boolean

**Success Response** (200):
```json
{
  "success": true,
  "message": "Address updated successfully.",
  "data": {
    "id_address": "uuid-1",
    "id_user": "user-uuid",
    "label": "Maison",
    "address": "Updated address",
    "latitude": 14.7200,
    "longitude": -17.4700,
    "isfavorite": false,
    "createdAt": "2026-06-05T10:30:00Z",
    "updatedAt": "2026-06-05T10:45:00Z"
  },
  "errors": null
}
```

**Error Responses**:
- 400: Invalid geolocation, validation error
- 403: Access denied
- 404: Address not found
- 500: Server error

---

### 5. Toggle Favorite
```
PATCH /addresses/:id/favorite
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Address ID

**Request Body**: Empty

**Success Response** (200):
```json
{
  "success": true,
  "message": "Address marked as favorite.",
  "data": {
    "id_address": "uuid-1",
    "isfavorite": true,
    "updatedAt": "2026-06-05T10:50:00Z"
  },
  "errors": null
}
```

**Notes**:
- Toggles `isfavorite` boolean
- If current value is true, will become false (and vice versa)
- Message reflects new status

**Error Responses**:
- 403: Access denied
- 404: Address not found
- 500: Server error

---

### 6. Get Favorites
```
GET /addresses/favorites?limit=10
Authorization: Bearer {token}
```

**Query Parameters**:
- `limit` (number, optional): Max addresses to return (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Favorite addresses retrieved.",
  "data": {
    "addresses": [
      {
        "id_address": "uuid-1",
        "id_user": "user-uuid",
        "label": "Domicile",
        "address": "123 Rue de la Paix, Dakar",
        "latitude": 14.7167,
        "longitude": -17.4674,
        "isfavorite": true,
        "createdAt": "2026-06-05T10:30:00Z",
        "updatedAt": "2026-06-05T10:30:00Z"
      }
    ],
    "count": 1
  },
  "errors": null
}
```

---

### 7. Delete Address
```
DELETE /addresses/:id
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` (UUID): Address ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Address deleted successfully.",
  "data": null,
  "errors": null
}
```

**Error Responses**:
- 403: Access denied
- 404: Address not found
- 500: Server error

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
| INVALID_GEOLOCATION | Lat/long out of range | 400 |
| ADDRESS_NOT_FOUND | Address doesn't exist | 404 |
| FORBIDDEN | User doesn't own the address | 403 |
| INTERNAL_ERROR | Server error | 500 |

---

## Data Types

### Address Object
```typescript
{
  id_address: string (UUID),           // PK
  id_user: string (UUID),              // FK to utilisateur
  label: string (1-100),               // e.g., "Domicile", "Travail"
  address: string (5-500),             // Full address
  latitude: decimal (10,7),            // -90 to 90
  longitude: decimal (10,7),           // -180 to 180
  isfavorite: boolean,                 // Default: false
  createdAt: DateTime,                 // ISO 8601
  updatedAt: DateTime                  // ISO 8601
}
```

---

## Geolocation Validation

Coordinates must be valid:
- **Latitude**: -90 ≤ lat ≤ 90
- **Longitude**: -180 ≤ lon ≤ 180

Example valid coordinates:
- Dakar, Senegal: `lat: 14.7167, lon: -17.4674`
- Paris, France: `lat: 48.8566, lon: 2.3522`
- New York, USA: `lat: 40.7128, lon: -74.0060`

---

## Complete Examples

### Create home address
```bash
curl -X POST http://localhost:3000/addresses \
  -H "Authorization: Bearer eyJhb..." \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Domicile",
    "address": "123 Rue de la Paix, Dakar, SN",
    "latitude": 14.7167,
    "longitude": -17.4674,
    "isfavorite": true
  }'
```

### List favorite addresses
```bash
curl http://localhost:3000/addresses?favorite=true \
  -H "Authorization: Bearer eyJhb..."
```

### Search addresses
```bash
curl "http://localhost:3000/addresses?search=rue&page=1&limit=10" \
  -H "Authorization: Bearer eyJhb..."
```

### Update address
```bash
curl -X PATCH http://localhost:3000/addresses/uuid-1 \
  -H "Authorization: Bearer eyJhb..." \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Maison",
    "isfavorite": false
  }'
```

### Mark as favorite
```bash
curl -X PATCH http://localhost:3000/addresses/uuid-1/favorite \
  -H "Authorization: Bearer eyJhb..."
```

### Delete address
```bash
curl -X DELETE http://localhost:3000/addresses/uuid-1 \
  -H "Authorization: Bearer eyJhb..."
```
