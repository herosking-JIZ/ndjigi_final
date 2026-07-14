#!/bin/bash
# TEST SCRIPT FOR PHASE 2 FIXES
# This script validates the username fix by creating a gestionnaire

set -e

echo "📝 PHASE 2 TEST SCRIPT"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8000"
ADMIN_TOKEN="${ADMIN_TOKEN:-your_admin_token_here}"
PARKING_ID="${PARKING_ID:-4666b2f9-8f4c-4d69-9330-54f3b6351350}"

echo -e "${YELLOW}Prerequisites:${NC}"
echo "- Backend running on $API_URL"
echo "- Keycloak running and reachable"
echo "- PostgreSQL running and accessible"
echo "- Admin token set in ADMIN_TOKEN env var"
echo ""

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "your_admin_token_here" ]; then
  echo -e "${RED}ERROR: Please set ADMIN_TOKEN environment variable${NC}"
  echo "Example:"
  echo "  export ADMIN_TOKEN='eyJ...' && bash test-phase2-fixes.sh"
  exit 1
fi

echo -e "${YELLOW}Step 1: Generate test data${NC}"
TEST_EMAIL="test.gestionnaire.$(date +%s)@ndjigi.dev"
TEST_NOM="TestGest"
TEST_PRENOM="Phase2"
TEST_PHONE="+22670000000"
echo "Email: $TEST_EMAIL"
echo "Name: $TEST_PRENOM $TEST_NOM"
echo ""

echo -e "${YELLOW}Step 2: Call POST /api/v1/admin/gestionnaires${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/v1/admin/gestionnaires" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"nom\": \"$TEST_NOM\",
    \"prenom\": \"$TEST_PRENOM\",
    \"email\": \"$TEST_EMAIL\",
    \"numero_telephone\": \"$TEST_PHONE\",
    \"adresse\": \"Test Address\",
    \"id_parking\": \"$PARKING_ID\"
  }" \
)

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Parse response
SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
ID_UTILISATEUR=$(echo "$RESPONSE" | jq -r '.data.id_utilisateur' 2>/dev/null)
HTTP_STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)

if [ "$SUCCESS" = "true" ] && [ ! -z "$ID_UTILISATEUR" ] && [ "$ID_UTILISATEUR" != "null" ]; then
  echo -e "${GREEN}✅ Gestionnaire created successfully!${NC}"
  echo "ID: $ID_UTILISATEUR"
  echo ""

  echo -e "${YELLOW}Step 3: Verify in PostgreSQL${NC}"
  echo "Run: SELECT * FROM utilisateur WHERE email = '$TEST_EMAIL';"
  echo "Expected: User exists with keycloak_id, email, nom, prenom, numero_telephone"
  echo ""

  echo -e "${YELLOW}Step 4: Verify in Keycloak${NC}"
  echo "Check Keycloak Admin Console:"
  echo "- Realm: ndjigi"
  echo "- Search for user: $TEST_EMAIL"
  echo "- Verify 'username' field is set to: $TEST_EMAIL"
  echo "- Verify roles include: ndjigi-gestionnaire"
  echo ""

  echo -e "${GREEN}🎉 PHASE 2 TESTS PASSED!${NC}"
  exit 0
else
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null)
  echo -e "${RED}❌ Test FAILED!${NC}"
  echo "Error: $ERROR_MSG"
  echo ""

  # Check for "User name is missing" error
  if echo "$RESPONSE" | grep -q "User name is missing"; then
    echo -e "${RED}ERROR: The 'username' field is STILL MISSING in Keycloak payload!${NC}"
    echo "The fix may not have been applied correctly."
    exit 1
  fi

  exit 1
fi
