#!/bin/bash

# MANUAL_SOCKET_TEST.SH
# Script pour tester Socket.io avec un token Keycloak réel
# Instructions:
# 1. Lancer: bash manual_socket_test.sh
# 2. Obtient un token Keycloak
# 3. Lance une connexion Socket.io avec le token
# 4. Affiche les logs du serveur

echo "======================================================"
echo "  🧪 TEST MANUEL SOCKET.IO AVEC TOKEN RÉEL"
echo "======================================================"

# Obtenir un token Keycloak
echo ""
echo "[STEP 1] 🔐 Obtention d'un token Keycloak..."

TOKEN=$(curl -s -X POST http://localhost:8080/realms/ndjigi/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=ndjigi-backend&client_secret=cfJxRSCZ4TstC3g51jyJfSENHxlgycic&grant_type=password&username=admin@parkway.bf&password=Admin@2026&scope=openid profile email" \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "[STEP 1] ❌ Erreur: Impossible d'obtenir un token"
  echo "          Vérifiez les identifiants Keycloak"
  exit 1
fi

echo "[STEP 1] ✅ Token obtenu: ${TOKEN:0:50}..."

# Lancer le test Node.js avec le token
echo ""
echo "[STEP 2] 🔗 Lancement de la connexion Socket.io..."
cat > /tmp/socket_test_with_token.js << 'EOF'
const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:8000';
const token = process.argv[2];

console.log('[SOCKET] 🔗 Connexion avec token valide...\n');

const socket = io(BACKEND_URL, {
  reconnection: false,
  auth: { token }
});

socket.on('connect', () => {
  console.log('✅ CONNEXION ACCEPTÉE!');
  console.log('   Socket ID:', socket.id);
  console.log('   User Data:', socket.data);
  console.log('\n[SOCKET] 👋 Déconnexion...\n');
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ CONNEXION REFUSÉE!');
  console.log('   Erreur:', error.message);
  console.log('   Code:', error.data?.code);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏱️  TIMEOUT - Aucune réponse du serveur');
  socket.disconnect();
  process.exit(1);
}, 5000);
EOF

node /tmp/socket_test_with_token.js "$TOKEN"
RESULT=$?

# Afficher les logs du serveur
echo ""
echo "[STEP 3] 📋 Logs du serveur (dernières 20 lignes):"
echo "======================================================"
docker-compose logs backend --tail=20

echo ""
if [ $RESULT -eq 0 ]; then
  echo "======================================================"
  echo "✅ TEST RÉUSSI: Connexion Socket.io acceptée!"
  echo "======================================================"
else
  echo "======================================================"
  echo "❌ TEST ÉCHOUÉ: Connexion Socket.io refusée"
  echo "======================================================"
fi

exit $RESULT
