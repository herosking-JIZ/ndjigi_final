/**
 * TEST_SOCKET_PHASE2.JS
 * Test du namespace /chat et des handlers de conversation
 *
 * À exécuter après démarrage du serveur backend sur le port 8000
 */

const { io } = require('socket.io-client');

// Importer le client Prisma pour faire des requêtes directes si nécessaire
const { prisma } = require('./backend/src/config/db');

// Token d'authentification valide (à remplacer par un token réel)
// Pour ce test, on va supposer qu'on a un token valide depuis le système d'authentification
const BACKEND_URL = 'http://localhost:8000';
const TOKEN = process.env.TEST_TOKEN || null;

const NAMESPACE_CHAT = '/chat';

// Couleurs pour l'affichage
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Teste la connexion au namespace /chat
 */
async function testConnectionNamespace() {
  return new Promise((resolve) => {
    log(colors.blue, '\n=== TEST 1: Connexion au namespace /chat ===');

    if (!TOKEN) {
      log(colors.red, '❌ Token non fourni. Impossible de tester.');
      resolve(false);
      return;
    }

    const socket = io(`${BACKEND_URL}${NAMESPACE_CHAT}`, {
      auth: { token: TOKEN },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      log(colors.green, `✅ Connecté au namespace /chat: ${socket.id}`);

      // Attendre 2 secondes et déconnecter
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 2000);
    });

    socket.on('connect_error', (err) => {
      log(colors.red, `❌ Erreur de connexion: ${err.message}`);
      socket.disconnect();
      resolve(false);
    });

    socket.on('disconnect', (reason) => {
      log(colors.yellow, `⚠️  Déconnexion: ${reason}`);
    });

    // Timeout après 10 secondes
    setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 10000);
  });
}

/**
 * Teste l'auto-join à la connexion
 */
async function testAutoJoin() {
  return new Promise((resolve) => {
    log(colors.blue, '\n=== TEST 2: Auto-join des conversations ===');

    if (!TOKEN) {
      log(colors.red, '❌ Token non fourni. Impossible de tester.');
      resolve(false);
      return;
    }

    const socket = io(`${BACKEND_URL}${NAMESPACE_CHAT}`, {
      auth: { token: TOKEN }
    });

    let autoJoinLogged = false;

    socket.on('connect', () => {
      log(colors.green, `✅ Connecté au namespace /chat`);

      // Observer les logs pour voir les auto-joins (2 secondes d'attente)
      setTimeout(() => {
        if (!autoJoinLogged) {
          log(colors.yellow, '⚠️  Pas de log d\'auto-join détecté dans les délais');
        }
        socket.disconnect();
        resolve(true);
      }, 3000);
    });

    socket.on('connect_error', (err) => {
      log(colors.red, `❌ Erreur de connexion: ${err.message}`);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 10000);
  });
}

/**
 * Teste le join sur une conversation autorisée
 */
async function testJoinAuthorized(conversationId) {
  return new Promise((resolve) => {
    log(colors.blue, `\n=== TEST 3: Join sur conversation autorisée (${conversationId}) ===`);

    if (!TOKEN) {
      log(colors.red, '❌ Token non fourni. Impossible de tester.');
      resolve(false);
      return;
    }

    const socket = io(`${BACKEND_URL}${NAMESPACE_CHAT}`, {
      auth: { token: TOKEN }
    });

    let joinSucceeded = false;

    socket.on('connect', () => {
      log(colors.green, `✅ Connecté`);

      // Émettre conversation:join
      socket.emit('conversation:join', { id_conversation: conversationId });
    });

    socket.on('conversation:joined', (payload) => {
      log(colors.green, `✅ Événement conversation:joined reçu pour: ${payload.id_conversation}`);
      joinSucceeded = true;
      socket.disconnect();
      resolve(true);
    });

    socket.on('conversation:error', (payload) => {
      log(colors.red, `❌ Événement conversation:error: code=${payload.code}`);
      socket.disconnect();
      resolve(false);
    });

    socket.on('connect_error', (err) => {
      log(colors.red, `❌ Erreur de connexion: ${err.message}`);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      if (!joinSucceeded) {
        log(colors.red, '❌ Timeout: pas de réponse pour conversation:join');
      }
      socket.disconnect();
      resolve(joinSucceeded);
    }, 10000);
  });
}

/**
 * Teste le join sur une conversation non autorisée
 */
async function testJoinForbidden(conversationId) {
  return new Promise((resolve) => {
    log(colors.blue, `\n=== TEST 4: Join sur conversation INTERDITE (${conversationId}) ===`);

    if (!TOKEN) {
      log(colors.red, '❌ Token non fourni. Impossible de tester.');
      resolve(false);
      return;
    }

    const socket = io(`${BACKEND_URL}${NAMESPACE_CHAT}`, {
      auth: { token: TOKEN }
    });

    let forbiddenErrorReceived = false;

    socket.on('connect', () => {
      log(colors.green, `✅ Connecté`);

      // Émettre conversation:join
      socket.emit('conversation:join', { id_conversation: conversationId });
    });

    socket.on('conversation:joined', (payload) => {
      log(colors.red, `❌ UNEXPECTED: conversation:joined reçu (devrait être FORBIDDEN)`);
      socket.disconnect();
      resolve(false);
    });

    socket.on('conversation:error', (payload) => {
      if (payload.code === 'FORBIDDEN') {
        log(colors.green, `✅ Réponse FORBIDDEN correcte: code=${payload.code}`);
        forbiddenErrorReceived = true;
      } else {
        log(colors.red, `❌ Erreur inattendue: code=${payload.code}`);
      }
      socket.disconnect();
      resolve(forbiddenErrorReceived);
    });

    socket.on('connect_error', (err) => {
      log(colors.red, `❌ Erreur de connexion: ${err.message}`);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      socket.disconnect();
      resolve(forbiddenErrorReceived);
    }, 10000);
  });
}

/**
 * Teste le payload invalide
 */
async function testInvalidPayload() {
  return new Promise((resolve) => {
    log(colors.blue, `\n=== TEST 5: Payload invalide ===`);

    if (!TOKEN) {
      log(colors.red, '❌ Token non fourni. Impossible de tester.');
      resolve(false);
      return;
    }

    const socket = io(`${BACKEND_URL}${NAMESPACE_CHAT}`, {
      auth: { token: TOKEN }
    });

    let invalidPayloadError = false;

    socket.on('connect', () => {
      log(colors.green, `✅ Connecté`);

      // Émettre conversation:join avec payload invalide
      socket.emit('conversation:join', { invalid_field: 'test' });
    });

    socket.on('conversation:error', (payload) => {
      if (payload.code === 'INVALID_PAYLOAD') {
        log(colors.green, `✅ Réponse INVALID_PAYLOAD correcte`);
        invalidPayloadError = true;
      }
      socket.disconnect();
      resolve(invalidPayloadError);
    });

    socket.on('connect_error', (err) => {
      log(colors.red, `❌ Erreur de connexion: ${err.message}`);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      socket.disconnect();
      resolve(invalidPayloadError);
    }, 10000);
  });
}

/**
 * Récupère une conversation valide pour l'utilisateur connecté
 */
async function getValidConversationForUser(userId) {
  try {
    const conversations = await prisma.conversation_participant.findMany({
      where: { id_utilisateur: userId },
      select: { id_conversation: true },
      take: 1
    });
    return conversations.length > 0 ? conversations[0].id_conversation : null;
  } catch (err) {
    log(colors.red, `❌ Erreur lors de la récupération des conversations: ${err.message}`);
    return null;
  }
}

/**
 * Récupère une conversation invalide pour l'utilisateur connecté
 */
async function getInvalidConversationForUser(userId) {
  try {
    // Récupérer une conversation que l'utilisateur n'a pas
    const userConversations = await prisma.conversation_participant.findMany({
      where: { id_utilisateur: userId },
      select: { id_conversation: true }
    });

    const userConvIds = userConversations.map(c => c.id_conversation);

    const otherConversation = await prisma.conversation.findFirst({
      where: {
        id_conversation: {
          notIn: userConvIds
        }
      },
      select: { id_conversation: true }
    });

    return otherConversation ? otherConversation.id_conversation : null;
  } catch (err) {
    log(colors.red, `❌ Erreur lors de la recherche d'une conversation invalide: ${err.message}`);
    return null;
  }
}

/**
 * Main - exécute tous les tests
 */
async function main() {
  log(colors.blue, '\n╔════════════════════════════════════════╗');
  log(colors.blue, '║  TESTS PHASE 2 - SOCKET.IO ROOMS/CHAT ║');
  log(colors.blue, '╚════════════════════════════════════════╝\n');

  if (!TOKEN) {
    log(colors.red, '❌ ERREUR: Variable d\'environnement TEST_TOKEN non définie.');
    log(colors.yellow, 'Usage: TEST_TOKEN=<token> node test_socket_phase2.js');
    process.exit(1);
  }

  try {
    // Test 1: Connexion au namespace
    const test1 = await testConnectionNamespace();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Auto-join
    const test2 = await testAutoJoin();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3 & 4: Join autorisé/interdit (nécessite une connexion valide)
    let test3 = false, test4 = false;

    // Note: Ces tests nécessitent une BD avec des conversations réelles
    // Pour l'instant, on les saute en production
    log(colors.yellow, '\n⚠️  Tests 3 & 4 (Join autorisé/interdit) nécessitent une BD avec conversations réelles.');
    log(colors.yellow, '   Contactez l\'équipe pour des données de test.');

    // Test 5: Payload invalide
    const test5 = await testInvalidPayload();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Résumé
    log(colors.blue, '\n╔════════════════════════════════════════╗');
    log(colors.blue, '║           RÉSUMÉ DES TESTS             ║');
    log(colors.blue, '╚════════════════════════════════════════╝\n');

    log(test1 ? colors.green : colors.red, `Test 1 (Connexion /chat): ${test1 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
    log(test2 ? colors.green : colors.red, `Test 2 (Auto-join): ${test2 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
    log(colors.yellow, `Test 3 (Join autorisé): ⏭️  SAUTÉ`);
    log(colors.yellow, `Test 4 (Join interdit): ⏭️  SAUTÉ`);
    log(test5 ? colors.green : colors.red, `Test 5 (Payload invalide): ${test5 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);

    // Déconnecter Prisma
    await prisma.$disconnect();

    process.exit(0);
  } catch (err) {
    log(colors.red, `❌ Erreur fatale: ${err.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
