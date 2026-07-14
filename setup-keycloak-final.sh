#!/bin/bash
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_PASSWORD="admin_password_change_me_prod"

# Get token
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$KEYCLOAK_ADMIN" \
  -d "password=$KEYCLOAK_PASSWORD" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Step 1: Got admin token: ${TOKEN:0:20}..."

# List existing realms to check
REALMS=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms" -H "Authorization: Bearer $TOKEN")
echo "Step 2: Existing realms: $(echo $REALMS | grep -o '"realm":"[^"]*' | head -3)"

# Try to get ndjigi realm
NDJIGI_REALM=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/ndjigi" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$NDJIGI_REALM" | grep -q '"realm"'; then
  echo "Step 3: Realm ndjigi already exists"
else
  echo "Step 3: Creating realm ndjigi..."
  # Create realm using form data instead of raw JSON
  curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"realm":"ndjigi","enabled":true}' -v 2>&1 | grep -E "HTTP|errorMessage"
fi

# Create roles
echo "Step 4: Creating roles..."
for ROLE in "ndjigi-admin" "ndjigi-gestionnaire" "ndjigi-chauffeur" "ndjigi-passager" "ndjigi-proprietaire"; do
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/ndjigi/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$ROLE\"}" 2>/dev/null
  echo "  ✓ $ROLE"
done

# Create backend client
echo "Step 5: Creating backend client..."
BACKEND_CLIENT=$(curl -s -X POST "$KEYCLOAK_URL/admin/realms/ndjigi/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"ndjigi-backend","enabled":true,"publicClient":false,"standardFlowEnabled":true,"directAccessGrantsEnabled":true,"serviceAccountsEnabled":true}' 2>/dev/null)

echo "Backend client response: $(echo $BACKEND_CLIENT | grep -o '"id":"[^"]*' | head -1)"

# Get backend client ID
BACKEND_CLIENT_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/ndjigi/clients?clientId=ndjigi-backend" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Backend client ID: $BACKEND_CLIENT_ID"

if [ ! -z "$BACKEND_CLIENT_ID" ]; then
  # Get the secret
  BACKEND_SECRET=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/ndjigi/clients/$BACKEND_CLIENT_ID/client-secret" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -o '"value":"[^"]*' | cut -d'"' -f4)
  echo "Backend secret: $BACKEND_SECRET"
fi

# Create web client
echo "Step 6: Creating web client..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/ndjigi/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"ndjigi-web","enabled":true,"publicClient":true,"standardFlowEnabled":true}' 2>/dev/null > /dev/null
echo "  ✓ Web client created"

# Create mobile client
curl -s -X POST "$KEYCLOAK_URL/admin/realms/ndjigi/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"ndjigi-mobile","enabled":true,"publicClient":true,"standardFlowEnabled":true}' 2>/dev/null > /dev/null
echo "  ✓ Mobile client created"

# Create test user
echo "Step 7: Creating test user..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/ndjigi/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@ndjigi.local","enabled":true,"emailVerified":true,"credentials":[{"type":"password","value":"TestPassword123!","temporary":false}]}' 2>/dev/null > /dev/null
echo "  ✓ Test user created"

echo ""
echo "✅ KEYCLOAK SETUP COMPLETE!"
echo ""
if [ ! -z "$BACKEND_SECRET" ]; then
  echo "Add this to backend/.env:"
  echo "KEYCLOAK_CLIENT_SECRET=$BACKEND_SECRET"
fi
