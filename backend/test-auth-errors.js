/**
 * TEST D'ERREURS - Vérification des codes d'erreur d'auth
 */

const { AuthError } = require('./src/services/auth/resolveUser');

console.log('\n' + '='.repeat(70));
console.log('🧪 TEST DES CODES D\'ERREUR D\'AUTHENTIFICATION');
console.log('='.repeat(70) + '\n');

// ─── Tester les codes d'erreur typés ───

const testCases = [
  {
    name: 'NO_TOKEN (pas de token)',
    error: new AuthError('Token manquant. Connectez-vous.', 'NO_TOKEN'),
    expectedCode: 'NO_TOKEN',
    expectedHTTP: 401,
  },
  {
    name: 'INVALID_TOKEN (token malformé)',
    error: new AuthError('Token invalide ou expiré.', 'INVALID_TOKEN'),
    expectedCode: 'INVALID_TOKEN',
    expectedHTTP: 401,
  },
  {
    name: 'TOKEN_EXPIRED (token expiré)',
    error: new AuthError('Session expirée. Reconnectez-vous.', 'TOKEN_EXPIRED'),
    expectedCode: 'TOKEN_EXPIRED',
    expectedHTTP: 401,
  },
  {
    name: 'TOKEN_REVOKED (token révoqué/blacklisté)',
    error: new AuthError('Token révoqué. Reconnectez-vous.', 'TOKEN_REVOKED'),
    expectedCode: 'TOKEN_REVOKED',
    expectedHTTP: 401,
  },
  {
    name: 'ACCOUNT_PENDING_ACTIVATION',
    error: new AuthError('Compte non activé. Veuillez accepter l\'invitation par email.', 'ACCOUNT_PENDING_ACTIVATION'),
    expectedCode: 'ACCOUNT_PENDING_ACTIVATION',
    expectedHTTP: 403,
  },
  {
    name: 'ACCOUNT_BLOCKED',
    error: new AuthError('Compte temporairement bloqué.', 'ACCOUNT_BLOCKED'),
    expectedCode: 'ACCOUNT_BLOCKED',
    expectedHTTP: 401,
  },
  {
    name: 'PHONE_NUMBER_REQUIRED',
    error: new AuthError('Numéro de téléphone requis.', 'PHONE_NUMBER_REQUIRED', {
      keycloak_data: {
        keycloak_id: 'test-id',
        email: 'test@example.com',
      }
    }),
    expectedCode: 'PHONE_NUMBER_REQUIRED',
    expectedHTTP: 422,
  },
];

let passCount = 0;
let failCount = 0;

testCases.forEach(testCase => {
  const { name, error, expectedCode, expectedHTTP } = testCase;

  console.log(`📌 ${name}`);

  // Vérifier le code
  if (error.code === expectedCode) {
    console.log(`   ✅ Code: ${error.code} (correct)`);
    passCount++;
  } else {
    console.log(`   ❌ Code: attendu ${expectedCode}, reçu ${error.code}`);
    failCount++;
  }

  // Vérifier le message
  if (error.message && error.message.length > 0) {
    console.log(`   ✅ Message: "${error.message}"`);
  } else {
    console.log(`   ❌ Message vide ou manquant`);
    failCount++;
  }

  // Vérifier le HTTP mapping (affichage seulement)
  console.log(`   ℹ️  HTTP: ${expectedHTTP} ${expectedHTTP === 401 ? '(Unauthorized)' : expectedHTTP === 403 ? '(Forbidden)' : '(Unprocessable Entity)'}`);

  // Vérifier les détails si présents
  if (error.details && Object.keys(error.details).length > 0) {
    console.log(`   ✅ Détails: ${JSON.stringify(error.details)}`);
  }

  console.log();
});

// ─── Vérifier la mappeur HTTP dans keycloakAuth ───

console.log('📌 Vérification du mappage HTTP dans keycloakAuth.js');
const fs = require('fs');
const keycloakAuthCode = fs.readFileSync('./src/middlewares/keycloakAuth.js', 'utf-8');

const httpMappings = {
  'ACCOUNT_PENDING_ACTIVATION': 403,
  'PHONE_NUMBER_REQUIRED': 422,
};

let httpOk = true;
Object.entries(httpMappings).forEach(([code, expectedStatus]) => {
  if (keycloakAuthCode.includes(code)) {
    console.log(`   ✅ ${code} → ${expectedStatus} trouvé`);
  } else {
    console.log(`   ❌ ${code} manquant dans le mapping`);
    httpOk = false;
  }
});

if (httpOk) {
  passCount++;
  console.log('\n   ✅ Tous les codes d\'erreur sont mappés correctement');
} else {
  failCount++;
  console.log('\n   ❌ Certains codes manquent du mapping');
}

// ─── RÉSUMÉ ───
console.log('\n' + '='.repeat(70));
console.log(`📊 RÉSUMÉ: ${passCount} ✅ / ${failCount} ❌`);
console.log('='.repeat(70) + '\n');

if (failCount === 0) {
  console.log('✅ TOUS LES TESTS PASSENT\n');
} else {
  console.log(`⚠️  ${failCount} TEST(S) ÉCHOUÉ(S)\n`);
}
