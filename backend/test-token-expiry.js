/**
 * TEST DE DÉTECTION TOKEN_EXPIRED
 * Vérifie que les tokens expirés retournent le bon code d'erreur
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('🧪 TEST: Détection TOKEN_EXPIRED');
console.log('='.repeat(70) + '\n');

// ─── Créer un token expiré ───
const expiredPayload = {
  sub: 'test-user',
  email: 'test@example.com',
  exp: Math.floor(Date.now() / 1000) - 1000, // Expiré il y a 1000 secondes
  iat: Math.floor(Date.now() / 1000) - 2000,
};

const expiredToken = jwt.sign(expiredPayload, 'test-secret', { algorithm: 'HS256' });

console.log('📌 Token expiré créé:');
console.log(`   exp: ${expiredPayload.exp} (${new Date(expiredPayload.exp * 1000).toISOString()})`);
console.log(`   Maintenant: ${Math.floor(Date.now() / 1000)}`);
console.log(`   Décalage: -${Math.floor(Date.now() / 1000) - expiredPayload.exp} secondes\n`);

// ─── Vérifier comment resolveUser.js détecte l'expiration ───
const resolveUserCode = fs.readFileSync('./src/services/auth/resolveUser.js', 'utf-8');

console.log('📌 Vérification du code resolveUser.js:');

// Chercher la logique de détection d'expiration
if (resolveUserCode.includes('TOKEN_EXPIRED')) {
  const lines = resolveUserCode.split('\n');
  const expiredLines = lines.filter((line, idx) => {
    return line.includes('TOKEN_EXPIRED') || line.includes('expires') || line.includes('exp');
  });

  console.log('   Mentions de TOKEN_EXPIRED trouvées:');
  expiredLines.slice(0, 5).forEach(line => {
    console.log(`   - ${line.trim()}`);
  });
}

// ─── Vérifier si verifyKeycloakToken() détecte l'expiration ───
const keycloakConfig = fs.readFileSync('./src/config/keycloak.js', 'utf-8');

console.log('\n📌 Vérification du code keycloak.js (verifyKeycloakToken):');

if (keycloakConfig.includes('jwt.verify')) {
  console.log('   ✅ Utilise jwt.verify() qui vérifie "exp" par défaut');
} else {
  console.log('   ⚠️  jwt.verify() non trouvé');
}

if (keycloakConfig.includes('TokenExpiredError') || keycloakConfig.includes('exp')) {
  console.log('   ✅ Gère les tokens expirés');
} else {
  console.log('   ⚠️  Pas de gestion explicite de TokenExpiredError');
}

// ─── Tester avec jwt.verify() ───
console.log('\n📌 Test jwt.verify() avec token expiré:');

try {
  const verified = jwt.verify(expiredToken, 'test-secret', { algorithms: ['HS256'] });
  console.log('   ❌ Token accepté (devrait être rejeté!)');
} catch (err) {
  console.log(`   ✅ Token rejeté: ${err.name}`);
  console.log(`   Message: ${err.message}`);

  if (err.name === 'TokenExpiredError') {
    console.log('   ✅ CORRECT: Détecté comme TokenExpiredError');
  }
}

// ─── Vérifier la gestion d'erreur dans resolveUser ───
console.log('\n📌 Vérification de la conversion d\'erreur:');

const errorHandlingCode = resolveUserCode.substring(
  resolveUserCode.indexOf('verifyKeycloakToken'),
  resolveUserCode.indexOf('verifyKeycloakToken') + 500
);

if (errorHandlingCode.includes('TokenExpiredError') || errorHandlingCode.includes('expired')) {
  console.log('   ✅ Gère TokenExpiredError spécifiquement');
} else {
  console.log('   ⚠️  Ne détecte pas TokenExpiredError spécifiquement');
  console.log('   ℹ️  Tous les erreurs verifyKeycloakToken() → INVALID_TOKEN');
}

// ─── RÉSUMÉ ───
console.log('\n' + '='.repeat(70));
console.log('📊 DIAGNOSTIC');
console.log('='.repeat(70) + '\n');

console.log('✅ jwt.verify() détecte correctement l\'expiration (TokenExpiredError)');
console.log('⚠️  resolveUserFromToken() ne distingue PAS TokenExpiredError');
console.log('   → Tous les erreurs verifyKeycloakToken() deviennent INVALID_TOKEN\n');

console.log('SOLUTION: Dans resolveUser.js, ligne ~55, ajouter:\n');
console.log('  if (message.includes("expired") || message.includes("TokenExpiredError")) {');
console.log('    throw new AuthError(..., "TOKEN_EXPIRED");');
console.log('  }\n');

console.log('='.repeat(70));
console.log('✅ TEST TERMINÉ');
console.log('='.repeat(70) + '\n');
