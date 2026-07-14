/**
 * TEST_SOCKET_IO.JS
 * Script de test pour Socket.io Phase 1
 * Tests:
 * 1. Connexion SANS token → refusée
 * 2. Connexion avec token EXPIRÉ → refusée (code TOKEN_EXPIRED)
 * 3. Connexion avec token VALIDE → acceptée
 */

const { io } = require('socket.io-client');
const axios = require('axios');

const KEYCLOAK_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'ndjigi';
const KEYCLOAK_CLIENT_ID = 'ndjigi-backend';
const KEYCLOAK_CLIENT_SECRET = 'cfJxRSCZ4TstC3g51jyJfSENHxlgycic';
const BACKEND_URL = 'http://localhost:8000';

let accessToken = null;

/**
 * Obtenir un token Keycloak valide
 */
async function getValidToken() {
  console.log('[TEST] 🔐 Obtention d\'un token Keycloak valide...');
  try {
    const auth = Buffer.from(`${KEYCLOAK_CLIENT_ID}:${KEYCLOAK_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', 'test_chauffeur@ndjigi.test');
    params.append('password', 'test_chauffeur_123');
    params.append('scope', 'openid profile email');

    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      params,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    console.log('[TEST] ✅ Token obtenu:', accessToken.substring(0, 50) + '...');
    return accessToken;
  } catch (error) {
    console.error('[TEST] ❌ Erreur obtention token:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * Test 1: Connexion SANS token
 */
function test1_NoToken() {
  return new Promise((resolve) => {
    console.log('\n[TEST 1] Connexion SANS token...');
    const socket = io(BACKEND_URL, {
      reconnection: false,
      auth: {}  // Pas de token
    });

    socket.on('connect', () => {
      console.log('[TEST 1] ❌ FAIL: Connexion acceptée (devrait être refusée)');
      socket.disconnect();
      resolve(false);
    });

    socket.on('connect_error', (error) => {
      console.log('[TEST 1] ✅ PASS: Connexion refusée');
      console.log('           Erreur:', error.message);
      console.log('           Code:', error.data?.code);
      socket.disconnect();
      resolve(error.data?.code === 'NO_TOKEN');
    });

    setTimeout(() => {
      socket.disconnect();
      console.log('[TEST 1] ⏱️  TIMEOUT');
      resolve(false);
    }, 3000);
  });
}

/**
 * Test 2: Connexion avec token EXPIRÉ
 */
function test2_ExpiredToken() {
  return new Promise((resolve) => {
    console.log('\n[TEST 2] Connexion avec token EXPIRÉ...');
    // Token ancien créé au début du test (sera expiré après ~15min)
    // Pour ce test, on simule avec un token malformé ou très ancien
    const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJlZkR1Y3YyWnA5dXZpRGFYR0J5TnFSS1pobVVFN2M1Z1hRQTQwUWlYZWFjIn0.eyJleHAiOjE2MjAwMDAwMDAsImlhdCI6MTYyMDAwMDAwMCwianRpIjoib25ydHJvOmQ3ZmM5MWNjLTAzMzMtNjBlNy1hMGEwLTZmMmE0ZGQwNGE2MiIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvbmRqaWdpIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImIyMTQ1ZGQ5LTJjMzItNDEwYS05N2Y4LWFjMTVhN2MyMDcyMyIsInR5cCI6IkJlYXJlciIsImF6cCI6Im5kamlnaS1iYWNrZW5kIn0.dummy';

    const socket = io(BACKEND_URL, {
      reconnection: false,
      auth: { token: expiredToken }
    });

    socket.on('connect', () => {
      console.log('[TEST 2] ❌ FAIL: Connexion acceptée (devrait être refusée)');
      socket.disconnect();
      resolve(false);
    });

    socket.on('connect_error', (error) => {
      console.log('[TEST 2] ✅ PASS: Connexion refusée');
      console.log('           Erreur:', error.message);
      console.log('           Code:', error.data?.code);
      socket.disconnect();
      // Token expiré ou invalide
      resolve(error.data?.code === 'INVALID_TOKEN' || error.data?.code === 'TOKEN_EXPIRED');
    });

    setTimeout(() => {
      socket.disconnect();
      console.log('[TEST 2] ⏱️  TIMEOUT');
      resolve(false);
    }, 3000);
  });
}

/**
 * Test 3: Connexion avec token VALIDE
 */
function test3_ValidToken(token) {
  return new Promise((resolve) => {
    console.log('\n[TEST 3] Connexion avec token VALIDE...');
    const socket = io(BACKEND_URL, {
      reconnection: false,
      auth: { token }
    });

    let connected = false;

    socket.on('connect', () => {
      connected = true;
      console.log('[TEST 3] ✅ PASS: Connexion acceptée');
      console.log('           Socket ID:', socket.id);
      console.log('           User ID:', socket.data?.user?.id_utilisateur);
      console.log('           Roles:', socket.data?.roles);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      console.log('[TEST 3] ❌ FAIL: Connexion refusée');
      console.log('           Erreur:', error.message);
      console.log('           Code:', error.data?.code);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      if (!connected) {
        socket.disconnect();
        console.log('[TEST 3] ⏱️  TIMEOUT');
      }
      resolve(connected);
    }, 5000);
  });
}

/**
 * Main
 */
async function main() {
  console.log('====================================================');
  console.log('  🧪 TESTS SOCKET.IO PHASE 1 (Authentification)');
  console.log('====================================================');

  const token = await getValidToken();

  const test1 = await test1_NoToken();
  const test2 = await test2_ExpiredToken();
  const test3 = await test3_ValidToken(token);

  console.log('\n====================================================');
  console.log('  📊 RÉSUMÉ DES TESTS');
  console.log('====================================================');
  console.log(`Test 1 (NO_TOKEN):      ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (EXPIRED):       ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (VALID):         ${test3 ? '✅ PASS' : '❌ FAIL'}`);

  const all = test1 && test2 && test3;
  console.log(`\nRésultat global:        ${all ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ÉCHOUÉS'}`);
  console.log('====================================================\n');

  process.exit(all ? 0 : 1);
}

main().catch(console.error);
