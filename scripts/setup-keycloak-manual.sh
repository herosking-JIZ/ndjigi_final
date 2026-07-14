#!/bin/bash
# Manual Keycloak setup using kcadm.sh when environment variables don't work

set -e

KEYCLOAK_URL="http://keycloak:8080"
REALM_NAME="ndjigi"
ADMIN_USER="admin"
ADMIN_PASSWORD="NDJIGI@2026"
ADMIN_EMAIL="admin@ndjigi.test"

echo "🔐 Starting manual Keycloak setup..."
echo "Keycloak URL: $KEYCLOAK_URL"
echo ""

# Create realm
echo "1️⃣ Creating realm '$REALM_NAME'..."
curl -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Content-Type: application/json" \
  -d "{
    \"realm\": \"$REALM_NAME\",
    \"displayName\": \"N'DJIGI\",
    \"enabled\": true,
    \"accessTokenLifespan\": 300,
    \"refreshTokenLifespan\": 1800
  }" 2>/dev/null || echo "  (realm may already exist)"

echo "✅ Realm created"
echo ""

# Create users
echo "2️⃣ Creating admin user..."
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$ADMIN_USER\",
    \"email\": \"$ADMIN_EMAIL\",
    \"firstName\": \"Test\",
    \"lastName\": \"Admin\",
    \"enabled\": true,
    \"emailVerified\": true,
    \"credentials\": [
      {
        \"type\": \"password\",
        \"value\": \"$ADMIN_PASSWORD\",
        \"temporary\": false
      }
    ]
  }" 2>/dev/null || echo "  (user may already exist)"

echo "✅ Admin user created"
echo ""
echo "✅ SETUP COMPLETE"
echo "Login credentials: $ADMIN_USER / $ADMIN_PASSWORD"
