#!/bin/bash
# ============================================================================
#  N'DJIGI - Setup automatique du realm Keycloak
# ============================================================================
#  Crée le realm `ndjigi`, les clients, les rôles, et configure les
#  durées de tokens. Idempotent (peut être relancé sans casser).
#
#  Prérequis : Keycloak doit tourner (docker compose up -d)
#
#  Usage :
#    bash scripts/keycloak/setup-realm.sh
#
#  Variables d'environnement attendues :
#    KEYCLOAK_URL              http://localhost:8080 (par défaut)
#    KEYCLOAK_ADMIN_USER       admin
#    KEYCLOAK_ADMIN_PASSWORD   <ton mot de passe admin>
# ============================================================================

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:?Variable KEYCLOAK_ADMIN_PASSWORD requise}"
REALM="ndjigi"

# Helper pour appeler kcadm via docker exec
kcadm() {
  docker compose exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"
}

echo "🔐 Authentification kcadm..."
kcadm config credentials \
  --server "${KEYCLOAK_URL}" \
  --realm master \
  --user "${KEYCLOAK_ADMIN_USER}" \
  --password "${KEYCLOAK_ADMIN_PASSWORD}"

# ----------------------------------------------------------------------------
# Étape 1 : Création du realm (si absent)
# ----------------------------------------------------------------------------
echo ""
echo "🏛  Configuration du realm ${REALM}..."

if kcadm get realms/${REALM} > /dev/null 2>&1; then
  echo "  → Realm ${REALM} existe déjà"
else
  kcadm create realms -s realm=${REALM} -s enabled=true -s displayName="N'DJIGI"
  echo "  ✅ Realm ${REALM} créé"
fi

# Configuration locale + token lifespans
kcadm update realms/${REALM} \
  -s defaultLocale=fr \
  -s internationalizationEnabled=true \
  -s 'supportedLocales=["fr","en"]' \
  -s registrationAllowed=false \
  -s resetPasswordAllowed=true \
  -s loginWithEmailAllowed=true \
  -s rememberMe=true \
  -s verifyEmail=false \
  -s accessTokenLifespan=300 \
  -s ssoSessionIdleTimeout=1800 \
  -s ssoSessionMaxLifespan=36000 \
  -s ssoSessionIdleTimeoutRememberMe=2592000 \
  -s ssoSessionMaxLifespanRememberMe=2592000 \
  -s offlineSessionIdleTimeout=2592000

echo "  ✅ Realm configuré (access=5min, refresh standard=30min, remember me=30j)"

# ----------------------------------------------------------------------------
# Étape 2 : Création des realm roles
# ----------------------------------------------------------------------------
echo ""
echo "👥 Création des rôles..."

for role in ndjigi-admin ndjigi-gestionnaire ndjigi-passager ndjigi-chauffeur ndjigi-proprietaire; do
  if kcadm get roles/${role} -r ${REALM} > /dev/null 2>&1; then
    echo "  → Rôle ${role} existe déjà"
  else
    kcadm create roles -r ${REALM} -s name=${role} -s description="Rôle ${role}"
    echo "  ✅ Rôle ${role} créé"
  fi
done

# ----------------------------------------------------------------------------
# Étape 3 : Client ndjigi-backend (confidentiel, service account)
# ----------------------------------------------------------------------------
echo ""
echo "🔧 Configuration du client ndjigi-backend..."

BACKEND_CLIENT_UUID=$(kcadm get clients -r ${REALM} -q clientId=ndjigi-backend --fields id --format csv --noquotes 2>/dev/null | tail -n +2 || echo "")

if [ -z "${BACKEND_CLIENT_UUID}" ]; then
  BACKEND_CLIENT_UUID=$(kcadm create clients -r ${REALM} \
    -s clientId=ndjigi-backend \
    -s enabled=true \
    -s publicClient=false \
    -s serviceAccountsEnabled=true \
    -s directAccessGrantsEnabled=true \
    -s standardFlowEnabled=false \
    -s implicitFlowEnabled=false \
    -s 'redirectUris=["*"]' \
    -i)
  echo "  ✅ Client ndjigi-backend créé (UUID: ${BACKEND_CLIENT_UUID})"
else
  echo "  → Client ndjigi-backend existe déjà (UUID: ${BACKEND_CLIENT_UUID})"
  kcadm update clients/${BACKEND_CLIENT_UUID} -r ${REALM} \
    -s serviceAccountsEnabled=true \
    -s directAccessGrantsEnabled=true
fi

# Récupère le secret
BACKEND_SECRET=$(kcadm get clients/${BACKEND_CLIENT_UUID}/client-secret -r ${REALM} --fields value --format csv --noquotes | tail -n +2)
echo ""
echo "  📋 KEYCLOAK_CLIENT_SECRET=${BACKEND_SECRET}"
echo "     → À copier dans backend/.env"

# Service account : ajouter les rôles realm-management nécessaires pour Admin API
RM_CLIENT_UUID=$(kcadm get clients -r ${REALM} -q clientId=realm-management --fields id --format csv --noquotes | tail -n +2)
SERVICE_ACCOUNT_USER_ID=$(kcadm get clients/${BACKEND_CLIENT_UUID}/service-account-user -r ${REALM} --fields id --format csv --noquotes | tail -n +2)

for role in manage-users view-users manage-realm view-realm; do
  ROLE_ID=$(kcadm get clients/${RM_CLIENT_UUID}/roles/${role} -r ${REALM} --fields id --format csv --noquotes 2>/dev/null | tail -n +2 || echo "")
  if [ -n "${ROLE_ID}" ]; then
    kcadm create users/${SERVICE_ACCOUNT_USER_ID}/role-mappings/clients/${RM_CLIENT_UUID} -r ${REALM} \
      -b "[{\"id\":\"${ROLE_ID}\",\"name\":\"${role}\"}]" 2>/dev/null || true
  fi
done

echo "  ✅ Service account configuré avec droits Admin API"

# ----------------------------------------------------------------------------
# Étape 4 : Client ndjigi-web (public, frontend admin/gestionnaire)
# ----------------------------------------------------------------------------
echo ""
echo "🌐 Configuration du client ndjigi-web..."

WEB_CLIENT_UUID=$(kcadm get clients -r ${REALM} -q clientId=ndjigi-web --fields id --format csv --noquotes 2>/dev/null | tail -n +2 || echo "")

if [ -z "${WEB_CLIENT_UUID}" ]; then
  kcadm create clients -r ${REALM} \
    -s clientId=ndjigi-web \
    -s enabled=true \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=true \
    -s 'redirectUris=["http://localhost:3000/*"]' \
    -s 'webOrigins=["http://localhost:3000","+"]'
  echo "  ✅ Client ndjigi-web créé"
else
  echo "  → Client ndjigi-web existe déjà"
fi

# ----------------------------------------------------------------------------
# Étape 5 : Client ndjigi-mobile (public, app Flutter)
# ----------------------------------------------------------------------------
echo ""
echo "📱 Configuration du client ndjigi-mobile..."

MOBILE_CLIENT_UUID=$(kcadm get clients -r ${REALM} -q clientId=ndjigi-mobile --fields id --format csv --noquotes 2>/dev/null | tail -n +2 || echo "")

if [ -z "${MOBILE_CLIENT_UUID}" ]; then
  kcadm create clients -r ${REALM} \
    -s clientId=ndjigi-mobile \
    -s enabled=true \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=true \
    -s 'redirectUris=["ndjigi://callback"]' \
    -s 'webOrigins=["+"]'
  echo "  ✅ Client ndjigi-mobile créé"
else
  echo "  → Client ndjigi-mobile existe déjà"
fi

# ----------------------------------------------------------------------------
# Étape 6 : User admin de test
# ----------------------------------------------------------------------------
echo ""
echo "👤 Création de l'admin de test (admin.test@ndjigi.local)..."

ADMIN_USER_ID=$(kcadm get users -r ${REALM} -q email=admin.test@ndjigi.local --fields id --format csv --noquotes 2>/dev/null | tail -n +2 || echo "")

if [ -z "${ADMIN_USER_ID}" ]; then
  ADMIN_USER_ID=$(kcadm create users -r ${REALM} \
    -s username=admin.test \
    -s email=admin.test@ndjigi.local \
    -s emailVerified=true \
    -s firstName=Admin \
    -s lastName=Test \
    -s enabled=true \
    -i)
  
  kcadm set-password -r ${REALM} --userid ${ADMIN_USER_ID} --new-password "Admin@2026!" --temporary=false
  
  # Assigner le rôle ndjigi-admin
  kcadm add-roles -r ${REALM} --uusername admin.test --rolename ndjigi-admin
  
  echo "  ✅ Admin de test créé : admin.test@ndjigi.local / Admin@2026!"
else
  echo "  → Admin de test existe déjà"
fi

# ----------------------------------------------------------------------------
# Étape 7 : Export du realm
# ----------------------------------------------------------------------------
echo ""
echo "💾 Export du realm en JSON..."

mkdir -p keycloak-exports
docker compose exec -T keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm ${REALM} \
  --users realm_file 2>/dev/null || echo "  ⚠️  Export nécessite l'arrêt de Keycloak en mode dev (à faire à la fin du projet)"

# ----------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  ✅ Setup terminé !"
echo "============================================================"
echo ""
echo "  Realm                : ${REALM}"
echo "  Backend client ID    : ndjigi-backend"
echo "  Backend secret       : ${BACKEND_SECRET}"
echo "  Web client ID        : ndjigi-web (public)"
echo "  Mobile client ID     : ndjigi-mobile (public)"
echo ""
echo "  Admin de test :"
echo "    URL      : http://localhost:8080/realms/${REALM}/account"
echo "    Email    : admin.test@ndjigi.local"
echo "    Password : Admin@2026!"
echo ""
echo "  Admin console Keycloak :"
echo "    URL      : ${KEYCLOAK_URL}"
echo "    User     : ${KEYCLOAK_ADMIN_USER}"
echo ""
echo "============================================================"
