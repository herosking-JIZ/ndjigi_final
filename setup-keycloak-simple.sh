#!/bin/bash

################################################################################
# SETUP KEYCLOAK - VERSION SIMPLIFIÉE
################################################################################

set -e

KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_PASSWORD="admin_password_change_me_prod"
REALM_NAME="ndjigi"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
print_sep() { echo "═══════════════════════════════════════════════════════════════"; }

print_sep
echo -e "${BLUE}🔧 CONFIGURATION KEYCLOAK COMPLÈTE${NC}"
print_sep

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1: VÉRIFIER KEYCLOAK
# ─────────────────────────────────────────────────────────────────────────────

log_info "Vérification de Keycloak..."
for i in {1..60}; do
  if curl -s "$KEYCLOAK_URL/health/ready" > /dev/null 2>&1; then
    log_success "Keycloak prêt!"
    break
  fi
  sleep 1
done

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2: OBTENIR LE TOKEN
# ─────────────────────────────────────────────────────────────────────────────

log_info "Authentification admin..."
TOKEN_JSON=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$KEYCLOAK_ADMIN" \
  -d "password=$KEYCLOAK_PASSWORD" \
  -d "grant_type=password")

ADMIN_TOKEN=$(echo "$TOKEN_JSON" | grep -o '"access_token":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  log_error "Token admin impossible à obtenir"
  exit 1
fi

log_success "Token obtenu: ${ADMIN_TOKEN:0:20}..."

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3: CRÉER LE REALM
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création du realm 'ndjigi'..."

REALM_JSON='{"realm":"ndjigi","displayName":"N'"'"'DJIGI Platform","enabled":true,"accessTokenLifespan":900,"refreshTokenLifespan":604800}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REALM_JSON" > /dev/null 2>&1

log_success "Realm créé"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4: CRÉER LES RÔLES
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création des 4 rôles..."

for ROLE in "ndjigi-admin" "ndjigi-gestionnaire" "ndjigi-chauffeur" "ndjigi-passager"; do
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$ROLE\",\"description\":\"$ROLE\"}" > /dev/null 2>&1
  log_success "  • $ROLE créé"
done

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 5: CRÉER LE CLIENT BACKEND
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création du client backend..."

BACKEND_JSON='{"clientId":"ndjigi-backend","name":"N'"'"'DJIJI Backend","enabled":true,"publicClient":false,"standardFlowEnabled":true,"directAccessGrantsEnabled":true,"serviceAccountsEnabled":true,"redirectUris":["http://backend:8000/*","http://localhost:8000/*"],"webOrigins":["http://backend:8000","http://localhost:8000"]}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BACKEND_JSON" > /dev/null 2>&1

log_success "Client backend créé"

# Récupérer l'ID et le secret du client
CLIENT_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=ndjigi-backend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$CLIENT_ID" ]; then
  SECRET_JSON=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_ID/client-secret" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

  BACKEND_SECRET=$(echo "$SECRET_JSON" | grep -o '"value":"[^"]*' | cut -d'"' -f4)
  log_success "Secret backend obtenu"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 6: CRÉER LE CLIENT WEB
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création du client web..."

WEB_JSON='{"clientId":"ndjigi-web","name":"N'"'"'DJIGI Web","enabled":true,"publicClient":true,"standardFlowEnabled":true,"directAccessGrantsEnabled":true,"redirectUris":["http://localhost:3000/*","http://localhost:3000/callback","http://localhost:3000/silent-check-sso.html"],"webOrigins":["http://localhost:3000"]}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$WEB_JSON" > /dev/null 2>&1

log_success "Client web créé"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 7: CRÉER LE CLIENT MOBILE
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création du client mobile..."

MOBILE_JSON='{"clientId":"ndjigi-mobile","name":"N'"'"'DJIGI Mobile","enabled":true,"publicClient":true,"standardFlowEnabled":true,"directAccessGrantsEnabled":true,"redirectUris":["app://ndjigi-mobile/*","io.flutter.plugins.firebase.auth://*"]}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$MOBILE_JSON" > /dev/null 2>&1

log_success "Client mobile créé"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 8: CRÉER UTILISATEUR DE TEST
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création de l'utilisateur de test..."

USER_JSON='{"username":"testuser","email":"test@ndjigi.local","firstName":"Test","lastName":"User","enabled":true,"emailVerified":true,"credentials":[{"type":"password","value":"TestPassword123!","temporary":false}]}'

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$USER_JSON" > /dev/null 2>&1

log_success "Utilisateur testuser créé"

# Récupérer l'ID et assigner le rôle
USER_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=testuser" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$USER_ID" ]; then
  # Récupérer l'ID du rôle ndjigi-passager
  ROLE_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/ndjigi-passager" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

  # Assigner le rôle
  ROLE_MAPPING='[{"id":"'$ROLE_ID'","name":"ndjigi-passager","description":"Passager"}]'

  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/realm" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ROLE_MAPPING" > /dev/null 2>&1

  log_success "Rôle ndjigi-passager assigné à testuser"
fi

# ─────────────────────────────────────────────────────────────────────────────
# RAPPORT FINAL
# ─────────────────────────────────────────────────────────────────────────────

print_sep
echo -e "${GREEN}✅ CONFIGURATION KEYCLOAK COMPLÈTE!${NC}"
print_sep

echo ""
echo "📊 RÉSUMÉ:"
echo ""
echo "  ✓ Realm:          ndjigi"
echo "  ✓ Rôles:          4 (admin, gestionnaire, chauffeur, passager)"
echo "  ✓ Clients:        3 (backend, web, mobile)"
echo "  ✓ Utilisateurs:   1 (testuser@ndjigi.local)"
echo ""
print_sep
echo ""
echo -e "${YELLOW}⭐ CONFIGURATION À COPIER DANS backend/.env:${NC}"
echo ""
echo "KEYCLOAK_URL=http://keycloak:8080"
echo "KEYCLOAK_REALM=$REALM_NAME"
echo "KEYCLOAK_CLIENT_ID=ndjigi-backend"
echo "KEYCLOAK_CLIENT_SECRET=$BACKEND_SECRET"
echo ""
print_sep
echo ""
echo "🌐 KEYCLOAK ADMIN CONSOLE:"
echo ""
echo "  URL:      $KEYCLOAK_URL"
echo "  Admin:    $KEYCLOAK_ADMIN"
echo "  Password: $KEYCLOAK_PASSWORD"
echo ""
print_sep
echo ""
echo "🧪 TEST USER:"
echo ""
echo "  Username: testuser"
echo "  Password: TestPassword123!"
echo "  Email:    test@ndjigi.local"
echo "  Rôle:     ndjigi-passager"
echo ""
print_sep
echo ""
echo -e "${GREEN}🚀 PHASE 1 TERMINÉE!${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. Copier KEYCLOAK_CLIENT_SECRET dans backend/.env"
echo "  2. Redémarrer backend: docker-compose restart backend"
echo "  3. Exécuter migrations: docker-compose exec backend npx prisma migrate deploy"
echo "  4. Tester sur http://localhost:3000"
echo ""
