#!/bin/bash

################################################################################
# SETUP KEYCLOAK COMPLET - CONFIGURATION AUTOMATISÉE
# Ce script configure entièrement Keycloak pour N'DJIGI
################################################################################

set -e

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_PASSWORD="NDJIGI@2026"
REALM_NAME="ndjigi"
REALM_DISPLAY_NAME="N'DJIGI Platform"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# FONCTIONS UTILITAIRES
# ─────────────────────────────────────────────────────────────────────────────

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_separator() {
  echo "═══════════════════════════════════════════════════════════════════════════"
}

print_header() {
  echo ""
  print_separator
  echo -e "${BLUE}$1${NC}"
  print_separator
}

# Fonction pour faire des requêtes JSON
api_call() {
  local method=$1
  local endpoint=$2
  local token=$3
  local data=$4

  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      "$KEYCLOAK_URL$endpoint"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d @- \
      "$KEYCLOAK_URL$endpoint" << EOF
$data
EOF
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1: VÉRIFIER QUE KEYCLOAK EST PRÊT
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 1: Vérification de Keycloak"

log_info "Attente que Keycloak soit prêt..."

KEYCLOAK_READY=false
for i in {1..60}; do
  if curl -s "$KEYCLOAK_URL/health/ready" > /dev/null 2>&1; then
    KEYCLOAK_READY=true
    log_success "Keycloak est prêt! (tentative $i)"
    break
  fi

  if [ $((i % 10)) -eq 0 ]; then
    log_info "Tentative $i/60..."
  fi

  sleep 1
done

if [ "$KEYCLOAK_READY" = false ]; then
  log_error "Keycloak n'a pas démarré après 60 secondes"
  log_error "Commandes à tester:"
  echo "  docker-compose logs keycloak --tail=50"
  echo "  docker-compose restart keycloak"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2: OBTENIR LE TOKEN ADMIN
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 2: Authentification Admin"

log_info "Authentification avec l'utilisateur admin..."

TOKEN_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$KEYCLOAK_ADMIN" \
  -d "password=$KEYCLOAK_PASSWORD" \
  -d "grant_type=password")

# Extraire le token (compatible bash)
ADMIN_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  log_error "Impossible d'obtenir le token admin"
  echo "Réponse: $TOKEN_RESPONSE"
  exit 1
fi

log_success "Token admin obtenu"
ADMIN_TOKEN_SHORT="${ADMIN_TOKEN:0:20}..."
log_info "Token: $ADMIN_TOKEN_SHORT"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3: CRÉER LE REALM
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 3: Création du Realm"

log_info "Création du realm '$REALM_NAME'..."

REALM_DATA=$(cat <<EOF
{
  "realm": "$REALM_NAME",
  "displayName": "$REALM_DISPLAY_NAME",
  "enabled": true,
  "accessTokenLifespan": 900,
  "refreshTokenLifespan": 604800,
  "accessCodeLifespan": 600,
  "actionTokenGeneratedByAdminLifespan": 43200,
  "actionTokenGeneratedByUserLifespan": 300,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "offlineSessionIdleTimeout": 2592000,
  "offlineSessionMaxLifespanEnabled": false,
  "userManagedAccessAllowed": false
}
EOF
)

REALM_RESPONSE=$(api_call "POST" "/admin/realms" "$ADMIN_TOKEN" "$REALM_DATA" 2>&1)

# Vérifier si le realm existe déjà
if echo "$REALM_RESPONSE" | grep -q "already exists"; then
  log_warning "Le realm '$REALM_NAME' existe déjà"
elif echo "$REALM_RESPONSE" | grep -q "error"; then
  log_error "Erreur lors de la création du realm"
  echo "$REALM_RESPONSE"
  exit 1
else
  log_success "Realm '$REALM_NAME' créé"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4: CRÉER LES RÔLES
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 4: Création des Rôles"

declare -a ROLES=("ndjigi-admin" "ndjigi-gestionnaire" "ndjigi-chauffeur" "ndjigi-passager" "ndjigi-proprietaire")
declare -a DESCRIPTIONS=("Administrateur du système" "Gestionnaire de parking" "Chauffeur" "Passager" "Propriétaire de véhicule")

for i in "${!ROLES[@]}"; do
  ROLE="${ROLES[$i]}"
  DESCRIPTION="${DESCRIPTIONS[$i]}"

  log_info "Création du rôle '$ROLE'..."

  ROLE_DATA=$(cat <<EOF
{
  "name": "$ROLE",
  "description": "$DESCRIPTION"
}
EOF
)

  ROLE_RESPONSE=$(api_call "POST" "/admin/realms/$REALM_NAME/roles" "$ADMIN_TOKEN" "$ROLE_DATA" 2>&1)

  if echo "$ROLE_RESPONSE" | grep -q "already exists"; then
    log_warning "Le rôle '$ROLE' existe déjà"
  elif echo "$ROLE_RESPONSE" | grep -q "error"; then
    log_error "Erreur lors de la création du rôle '$ROLE'"
    echo "$ROLE_RESPONSE"
  else
    log_success "Rôle '$ROLE' créé"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 5: CRÉER LE CLIENT BACKEND
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 5: Création du Client Backend"

log_info "Création du client 'ndjigi-backend'..."

BACKEND_CLIENT_DATA=$(cat <<EOF
{
  "clientId": "ndjigi-backend",
  "name": "N'DJIGI Backend",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "publicClient": false,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": true,
  "serviceAccountsEnabled": true,
  "implicitFlowEnabled": false,
  "redirectUris": [
    "http://backend:8000/*",
    "http://localhost:8000/*"
  ],
  "webOrigins": [
    "http://backend:8000",
    "http://localhost:8000"
  ]
}
EOF
)

BACKEND_CLIENT_RESPONSE=$(api_call "POST" "/admin/realms/$REALM_NAME/clients" "$ADMIN_TOKEN" "$BACKEND_CLIENT_DATA" 2>&1)

if echo "$BACKEND_CLIENT_RESPONSE" | grep -q "error"; then
  log_error "Erreur lors de la création du client backend"
  echo "$BACKEND_CLIENT_RESPONSE"
else
  log_success "Client backend créé"
fi

# Récupérer l'ID du client backend
BACKEND_CLIENT_ID=$(api_call "GET" "/admin/realms/$REALM_NAME/clients?clientId=ndjigi-backend" "$ADMIN_TOKEN" "" 2>&1 | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$BACKEND_CLIENT_ID" ]; then
  log_error "Impossible de récupérer l'ID du client backend"
  exit 1
fi

log_success "Client Backend ID: $BACKEND_CLIENT_ID"

# Récupérer le secret du client
BACKEND_SECRET_RESPONSE=$(api_call "GET" "/admin/realms/$REALM_NAME/clients/$BACKEND_CLIENT_ID/client-secret" "$ADMIN_TOKEN" "" 2>&1)
BACKEND_SECRET=$(echo "$BACKEND_SECRET_RESPONSE" | grep -o '"value":"[^"]*' | cut -d'"' -f4)

if [ -z "$BACKEND_SECRET" ]; then
  log_error "Impossible de récupérer le secret du client backend"
  exit 1
fi

log_success "Client Backend Secret obtenu"
log_warning "⭐ SECRET À COPIER DANS backend/.env:"
echo ""
echo "    KEYCLOAK_CLIENT_SECRET=$BACKEND_SECRET"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 6: CRÉER LE CLIENT WEB
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 6: Création du Client Web"

log_info "Création du client 'ndjigi-web'..."

WEB_CLIENT_DATA=$(cat <<EOF
{
  "clientId": "ndjigi-web",
  "name": "N'DJIGI Web",
  "enabled": true,
  "publicClient": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "redirectUris": [
    "http://localhost:3000/*",
    "http://localhost:3000/callback",
    "http://localhost:3000/silent-check-sso.html"
  ],
  "webOrigins": [
    "http://localhost:3000"
  ]
}
EOF
)

WEB_CLIENT_RESPONSE=$(api_call "POST" "/admin/realms/$REALM_NAME/clients" "$ADMIN_TOKEN" "$WEB_CLIENT_DATA" 2>&1)

if echo "$WEB_CLIENT_RESPONSE" | grep -q "error"; then
  log_error "Erreur lors de la création du client web"
  echo "$WEB_CLIENT_RESPONSE"
else
  log_success "Client web créé"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 7: CRÉER LE CLIENT MOBILE
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 7: Création du Client Mobile"

log_info "Création du client 'ndjigi-mobile'..."

MOBILE_CLIENT_DATA=$(cat <<EOF
{
  "clientId": "ndjigi-mobile",
  "name": "N'DJIGI Mobile",
  "enabled": true,
  "publicClient": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "redirectUris": [
    "app://ndjigi-mobile/*",
    "io.flutter.plugins.firebase.auth://*"
  ]
}
EOF
)

MOBILE_CLIENT_RESPONSE=$(api_call "POST" "/admin/realms/$REALM_NAME/clients" "$ADMIN_TOKEN" "$MOBILE_CLIENT_DATA" 2>&1)

if echo "$MOBILE_CLIENT_RESPONSE" | grep -q "error"; then
  log_error "Erreur lors de la création du client mobile"
  echo "$MOBILE_CLIENT_RESPONSE"
else
  log_success "Client mobile créé"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 8: CRÉER UN UTILISATEUR DE TEST
# ─────────────────────────────────────────────────────────────────────────────

print_header "ÉTAPE 8: Création d'un Utilisateur de Test"

log_info "Création de l'utilisateur 'testuser'..."

TEST_USER_DATA=$(cat <<EOF
{
  "username": "testuser",
  "email": "test@ndjigi.local",
  "firstName": "Test",
  "lastName": "User",
  "enabled": true,
  "emailVerified": true,
  "credentials": [
    {
      "type": "password",
      "value": "TestPassword123!",
      "temporary": false
    }
  ]
}
EOF
)

TEST_USER_RESPONSE=$(api_call "POST" "/admin/realms/$REALM_NAME/users" "$ADMIN_TOKEN" "$TEST_USER_DATA" 2>&1)

if echo "$TEST_USER_RESPONSE" | grep -q "error"; then
  log_error "Erreur lors de la création de l'utilisateur"
  echo "$TEST_USER_RESPONSE"
else
  log_success "Utilisateur 'testuser' créé"
fi

# Récupérer l'ID de l'utilisateur
TEST_USER_ID=$(api_call "GET" "/admin/realms/$REALM_NAME/users?username=testuser" "$ADMIN_TOKEN" "" 2>&1 | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TEST_USER_ID" ]; then
  log_success "User ID: $TEST_USER_ID"

  # Assigner le rôle ndjigi-passager
  log_info "Attribution du rôle 'ndjigi-passager'..."

  ROLE_ASSIGNMENT_DATA=$(cat <<EOF
[
  {
    "name": "ndjigi-passager",
    "description": "Passager"
  }
]
EOF
)

  api_call "POST" "/admin/realms/$REALM_NAME/users/$TEST_USER_ID/role-mappings/realm" "$ADMIN_TOKEN" "$ROLE_ASSIGNMENT_DATA" > /dev/null 2>&1
  log_success "Rôle 'ndjigi-passager' assigné à 'testuser'"
fi

# ─────────────────────────────────────────────────────────────────────────────
# RAPPORT FINAL
# ─────────────────────────────────────────────────────────────────────────────

print_header "✅ CONFIGURATION KEYCLOAK COMPLÈTE"

echo ""
echo "📊 RÉSUMÉ DE LA CONFIGURATION:"
echo ""
echo "  🔗 Keycloak URL:          $KEYCLOAK_URL"
echo "  🌍 Realm:                 $REALM_NAME"
echo ""
echo "  👥 Rôles créés:           5"
echo "    • ndjigi-admin"
echo "    • ndjigi-gestionnaire"
echo "    • ndjigi-chauffeur"
echo "    • ndjigi-passager"
echo "    • ndjigi-proprietaire"
echo ""
echo "  🔐 Clients créés:         3"
echo "    • ndjigi-backend        (confidential)"
echo "    • ndjigi-web            (public)"
echo "    • ndjigi-mobile         (public)"
echo ""
echo "  👤 Utilisateurs créés:    1"
echo "    • testuser@ndjigi.local (password: TestPassword123!)"
echo "    • Rôle: ndjigi-passager"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "⭐ CONFIGURATION À COPIER DANS backend/.env:"
echo ""
echo "    KEYCLOAK_URL=http://keycloak:8080"
echo "    KEYCLOAK_REALM=$REALM_NAME"
echo "    KEYCLOAK_CLIENT_ID=ndjigi-backend"
echo "    KEYCLOAK_CLIENT_SECRET=$BACKEND_SECRET"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 ACCÈS AU DASHBOARD:"
echo ""
echo "    URL:      $KEYCLOAK_URL"
echo "    Admin:    $KEYCLOAK_ADMIN"
echo "    Password: $KEYCLOAK_PASSWORD"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "🧪 TEST DE LOGIN:"
echo ""
echo "    Username: testuser"
echo "    Password: TestPassword123!"
echo "    Email:    test@ndjigi.local"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "✨ Prochaines étapes:"
echo ""
echo "   1. Copier KEYCLOAK_CLIENT_SECRET dans backend/.env"
echo "   2. Redémarrer le backend: docker-compose restart backend"
echo "   3. Exécuter migrations Prisma: docker-compose exec backend npx prisma migrate deploy"
echo "   4. Tester login sur http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"

log_success "CONFIGURATION KEYCLOAK TERMINÉE! 🎉"
