/**
 * TEST_IMPORTS.JS
 * Vérifier que tous les modules sont bien importables
 */

console.log('Vérification des imports...\n');

try {
  console.log('✓ Chargement de socket.io...');
  const { Server } = require('socket.io');
  console.log('  OK');

  console.log('✓ Chargement du middleware d\'authentification...');
  const { authMiddleware } = require('./backend/src/socket/middleware/authMiddleware');
  console.log('  OK');

  console.log('✓ Chargement du handler de conversation...');
  const { registerConversationHandlers } = require('./backend/src/socket/handlers/conversationHandler');
  console.log('  OK');

  console.log('✓ Chargement du service de conversation...');
  const { isParticipant, listConversationIds } = require('./backend/src/socket/services/conversationService');
  console.log('  OK');

  console.log('✓ Chargement de la config DB...');
  const { prisma } = require('./backend/src/config/db');
  console.log('  OK');

  console.log('\n✅ Tous les imports réussis !');
  process.exit(0);

} catch (err) {
  console.error(`\n❌ Erreur d'import: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
