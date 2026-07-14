#!/bin/bash

# Script de configuration initiale de Keycloak
# À exécuter une fois les conteneurs Docker lancés

set -e

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin_password_change_me_prod"
REALM="ndjigi"

echo "🔧 Configuration de Keycloak..."

# Attendre que Keycloak soit prêt
echo "⏳ Attente de Keycloak..."
for i in {1..30}; do
  if curl -s "$KEYCLOAK_URL/health/ready" > /dev/null 2>&1; then
    echo "✅ Keycloak est prêt!"
    break
  fi
  echo "  Tentative $i/30..."
  sleep 2
done

# Obtenir un token d'administration
echo "🔐 Authentification admin..."
TOKEN=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Impossible d'obtenir le token admin"
  exit 1
fi

echo "✅ Token obtenu"

# Créer le realm
echo "📋 Création du realm '$REALM'..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"realm\": \"$REALM\",
    \"enabled\": true,
    \"accessTokenLifespan\": 900,
    \"refreshTokenLifespan\": 604800,
    \"accessCodeLifespan\": 600,
    \"actionTokenGeneratedByAdminLifespan\": 43200,
    \"actionTokenGeneratedByUserLifespan\": 300
  }" || echo "⚠️  Le realm existe peut-être déjà"

echo "✅ Realm créé"

# Créer les rôles
echo "🎭 Création des rôles..."
for ROLE in "ndjigi-admin" "ndjigi-gestionnaire" "ndjigi-chauffeur" "ndjigi-passager"; do
  curl -s -X POST \
    "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$ROLE\",
      \"description\": \"Rôle $ROLE\"
    }" || echo "⚠️  Le rôle $ROLE existe peut-être déjà"
done

echo "✅ Rôles créés"

# Créer le client backend
echo "🖥️  Création du client backend..."
CLIENT_BACKEND_ID=$(curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "ndjigi-backend",
    "name": "N'"'"'DJIGI Backend",
    "enabled": true,
    "publicClient": false,
    "standardFlowEnabled": false,
    "directAccessGrantsEnabled": true,
    "serviceAccountsEnabled": true,
    "redirectUris": ["http://localhost:8000/*", "http://backend:8000/*"],
    "webOrigins": ["http://localhost:8000", "http://backend:8000"]
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "✅ Client backend créé: $CLIENT_BACKEND_ID"

# Créer le client web
echo "🌐 Création du client web..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "ndjigi-web",
    "name": "N'"'"'DJIGI Web",
    "enabled": true,
    "publicClient": true,
    "standardFlowEnabled": true,
    "implicitFlowEnabled": false,
    "directAccessGrantsEnabled": true,
    "redirectUris": [
      "http://localhost:3000/*",
      "http://localhost:3000/callback"
    ],
    "webOrigins": ["http://localhost:3000"]
  }' || echo "⚠️  Le client web existe peut-être déjà"

echo "✅ Client web créé"

# Créer le client mobile
echo "📱 Création du client mobile..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "ndjigi-mobile",
    "name": "N'"'"'DJIGI Mobile",
    "enabled": true,
    "publicClient": true,
    "standardFlowEnabled": true,
    "implicitFlowEnabled": false,
    "directAccessGrantsEnabled": true,
    "redirectUris": [
      "app://ndjigi-mobile/*",
      "io.flutter.plugins.firebase.auth:///*"
    ]
  }' || echo "⚠️  Le client mobile existe peut-être déjà"

echo "✅ Client mobile créé"

# Créer un utilisateur de test
echo "👤 Création d'un utilisateur de test..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/$REALM/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@ndjigi.local",
    "firstName": "Test",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "TestPassword123!",
      "temporary": false
    }]
  }' || echo "⚠️  L'"'"'utilisateur de test existe peut-être déjà"

echo "✅ Utilisateur de test créé"

echo ""
echo "=========================================="
echo "✅ Configuration de Keycloak terminée!"
echo "=========================================="
echo ""
echo "🔗 Admin Console: $KEYCLOAK_URL/admin"
echo "👤 Admin: $ADMIN_USER / $ADMIN_PASSWORD"
echo ""
echo "📊 Pour consulter les secrets des clients:"
echo "  1. Aller dans Admin Console"
echo "  2. Realm: ndjigi"
echo "  3. Clients > ndjigi-backend"
echo "  4. Credentials tab"
echo ""
