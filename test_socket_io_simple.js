/**
 * TEST_SOCKET_IO_SIMPLE.JS
 * Script simplifié pour tester Socket.io
 * Crée un utilisateur de test et teste les connexions
 */

const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:8000';

/**
 * Test 1: Connexion SANS token
 */
function test1_NoToken() {
  return new Promise((resolve) => {
    console.log('\n[TEST 1] 🔗 Connexion SANS token...');
    const socket = io(BACKEND_URL, {
      reconnection: false,
      auth: {}
    });

    socket.on('connect', () => {
      console.log('[TEST 1] ❌ FAIL: Connexion acceptée (devrait être refusée)');
      socket.disconnect();
      resolve({ passed: false, code: 'CONNECTED' });
    });

    socket.on('connect_error', (error) => {
      const code = error.data?.code;
      const passed = code === 'NO_TOKEN';
      console.log(`[TEST 1] ${passed ? '✅ PASS' : '❌ FAIL'}: Connexion refusée`);
      console.log(`         Code reçu: ${code}`);
      socket.disconnect();
      resolve({ passed, code });
    });

    setTimeout(() => {
      socket.disconnect();
      console.log('[TEST 1] ⏱️  TIMEOUT');
      resolve({ passed: false, code: 'TIMEOUT' });
    }, 3000);
  });
}

/**
 * Test 2: Connexion avec token INVALIDE
 */
function test2_InvalidToken() {
  return new Promise((resolve) => {
    console.log('\n[TEST 2] 🔗 Connexion avec token INVALIDE...');
    const socket = io(BACKEND_URL, {
      reconnection: false,
      auth: { token: 'invalid.token.here' }
    });

    socket.on('connect', () => {
      console.log('[TEST 2] ❌ FAIL: Connexion acceptée (devrait être refusée)');
      socket.disconnect();
      resolve({ passed: false, code: 'CONNECTED' });
    });

    socket.on('connect_error', (error) => {
      const code = error.data?.code;
      const passed = code === 'INVALID_TOKEN';
      console.log(`[TEST 2] ${passed ? '✅ PASS' : '❌ FAIL'}: Connexion refusée`);
      console.log(`         Code reçu: ${code}`);
      socket.disconnect();
      resolve({ passed, code });
    });

    setTimeout(() => {
      socket.disconnect();
      console.log('[TEST 2] ⏱️  TIMEOUT');
      resolve({ passed: false, code: 'TIMEOUT' });
    }, 3000);
  });
}

/**
 * Test 3: Vérifier que le serveur HTTP répond toujours
 */
async function test3_HTTPHealth() {
  return new Promise((resolve) => {
    console.log('\n[TEST 3] 🔗 Vérifier que HTTP fonctionne (/health)...');
    const http = require('http');
    http.get('http://localhost:8000/health', (res) => {
      const passed = res.statusCode === 200;
      console.log(`[TEST 3] ${passed ? '✅ PASS' : '❌ FAIL'}: /health HTTP ${res.statusCode}`);
      resolve({ passed, code: `HTTP_${res.statusCode}` });
    }).on('error', (e) => {
      console.log(`[TEST 3] ❌ FAIL: ${e.message}`);
      resolve({ passed: false, code: 'HTTP_ERROR' });
    });
  });
}

/**
 * Main
 */
async function main() {
  console.log('====================================================');
  console.log('  🧪 TESTS SOCKET.IO PHASE 1 (SANS TOKEN VALIDE)');
  console.log('====================================================');
  console.log('Note: Ces tests vérifient SANS token réel.');
  console.log('      Un token réel de Keycloak est requis pour tester');
  console.log('      une connexion acceptée (Test de vérification manuelle).');

  const test1 = await test1_NoToken();
  const test2 = await test2_InvalidToken();
  const test3 = await test3_HTTPHealth();

  console.log('\n====================================================');
  console.log('  📊 RÉSUMÉ DES TESTS');
  console.log('====================================================');
  console.log(`Test 1 (NO_TOKEN):      ${test1.passed ? '✅ PASS' : '❌ FAIL'} (${test1.code})`);
  console.log(`Test 2 (INVALID):       ${test2.passed ? '✅ PASS' : '❌ FAIL'} (${test2.code})`);
  console.log(`Test 3 (HTTP HEALTH):   ${test3.passed ? '✅ PASS' : '❌ FAIL'} (${test3.code})`);

  const all = test1.passed && test2.passed && test3.passed;
  console.log(`\nRésultat global:        ${all ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ÉCHOUÉS'}`);
  console.log('====================================================\n');

  process.exit(all ? 0 : 1);
}

main().catch(console.error);
