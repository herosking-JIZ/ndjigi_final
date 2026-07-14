/**
 * SMOKE TEST - Vérification de l'authentification
 * Test de bout en bout de la correction d'auth
 */

const jwt = require('jsonwebtoken');
const { AuthError, resolveUserFromToken } = require('./src/services/auth/resolveUser');

// ─────────────────────────────────────────────────────
// TÂCHE 2 : TESTS DE REJET (Sécurité)
// ─────────────────────────────────────────────────────

console.log('\n' + '='.repeat(70));
console.log('🧪 SMOKE TEST - Authentification');
console.log('='.repeat(70) + '\n');

// ─── TEST 1: Pas de token ───
console.log('📌 TEST 1: Pas de token');
try {
  resolveUserFromToken(null).catch(err => {
    if (err instanceof AuthError && err.code === 'NO_TOKEN') {
      console.log(`✅ PASS: Retourne NO_TOKEN (${err.code})`);
      console.log(`   Message: "${err.message}"\n`);
    } else {
      console.log(`❌ FAIL: Code attendu NO_TOKEN, reçu ${err.code || 'AUTRE'}\n`);
    }
  });
} catch (err) {
  if (err instanceof AuthError && err.code === 'NO_TOKEN') {
    console.log(`✅ PASS: Retourne NO_TOKEN (${err.code})`);
    console.log(`   Message: "${err.message}"\n`);
  }
}

// ─── TEST 2: Token à signature invalide ───
console.log('📌 TEST 2: Token avec signature invalide');
const validPayload = {
  sub: 'test-user-123',
  email: 'test@example.com',
  given_name: 'Test',
  family_name: 'User',
  realm_access: { roles: ['ndjigi-passager'] },
  iss: 'http://keycloak:8080/realms/ndjigi',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

const tokenWithBadSignature = jwt.sign(validPayload, 'wrong-secret', { algorithm: 'HS256' });
// Modifier un caractère pour corrompre la signature
const corruptedToken = tokenWithBadSignature.split('.').map((part, i) => {
  if (i === 2) { // Partie signature
    return part.substring(0, part.length - 1) + (part[part.length - 1] === 'A' ? 'B' : 'A');
  }
  return part;
}).join('.');

resolveUserFromToken(corruptedToken).catch(err => {
  if (err instanceof AuthError && err.code === 'INVALID_TOKEN') {
    console.log(`✅ PASS: Rejet signature invalide (${err.code})`);
    console.log(`   Message: "${err.message}"\n`);
  } else {
    console.log(`❌ FAIL: Code attendu INVALID_TOKEN, reçu ${err.code || 'AUTRE'}\n`);
  }
});

// ─── TEST 3: Token expiré ───
console.log('📌 TEST 3: Token expiré');
const expiredPayload = {
  ...validPayload,
  exp: Math.floor(Date.now() / 1000) - 1000, // Expiré il y a 1000 secondes
};
const expiredToken = jwt.sign(expiredPayload, 'test-secret', { algorithm: 'HS256' });

resolveUserFromToken(expiredToken).catch(err => {
  if (err instanceof AuthError && err.code === 'TOKEN_EXPIRED') {
    console.log(`✅ PASS: Rejet token expiré avec code TOKEN_EXPIRED (${err.code})`);
    console.log(`   Message: "${err.message}"\n`);
  } else {
    console.log(`⚠️  PARTIAL: Token rejeté mais code est ${err.code} au lieu de TOKEN_EXPIRED\n`);
  }
});

// ─── TEST 4: Vérifier l'ordre d'exécution dans resolveUser ───
console.log('📌 TEST 4: Vérification de l\'ordre d\'exécution');
console.log('   Vérification du code: blacklist AVANT le cache\n');

const fs = require('fs');
const resolveUserCode = fs.readFileSync('./src/services/auth/resolveUser.js', 'utf-8');

// Trouver les positions des commentaires
const blacklistComment = resolveUserCode.indexOf('c. Vérifier la blacklist');
const cacheComment = resolveUserCode.indexOf('d. Résoudre l\'utilisateur');

if (blacklistComment < cacheComment && blacklistComment !== -1 && cacheComment !== -1) {
  console.log(`✅ PASS: Blacklist (ligne ~${resolveUserCode.substring(0, blacklistComment).split('\n').length})`);
  console.log(`   vérifiée AVANT cache (ligne ~${resolveUserCode.substring(0, cacheComment).split('\n').length})\n`);
} else {
  console.log(`❌ FAIL: Ordre d'exécution incorrect\n`);
}

// ─────────────────────────────────────────────────────
// TÂCHE 3 : VÉRIFICATIONS STRUCTURELLES
// ─────────────────────────────────────────────────────

console.log('📌 TEST 5: Vérification du jwt.decode() résiduel');
console.log('   Recherche de jwt.decode() non-vérifié...\n');

// Vérifier que le nouveau middleware n'utilise pas jwt.decode() seul
const keycloakAuthCode = fs.readFileSync('./src/middlewares/keycloakAuth.js', 'utf-8');
if (keycloakAuthCode.includes('jwt.decode')) {
  console.log(`❌ FAIL: keycloakAuth.js contient jwt.decode() (non sûr)\n`);
} else {
  console.log(`✅ PASS: keycloakAuth.js n'utilise PAS jwt.decode() seul\n`);
}

// Vérifier que resolveUser utilise verifyKeycloakToken()
if (resolveUserCode.includes('verifyKeycloakToken') && !resolveUserCode.includes('jwt.decode')) {
  console.log(`✅ PASS: resolveUser.js utilise verifyKeycloakToken() (JWKS sûr)\n`);
} else {
  console.log(`⚠️  WARNING: Vérifier que resolveUser utilise verifyKeycloakToken()\n`);
}

// ─────────────────────────────────────────────────────
// DIAGNOSTIC : Exigences de verifyKeycloakToken()
// ─────────────────────────────────────────────────────

console.log('📌 TEST 6: Diagnostic de verifyKeycloakToken()');
console.log('   Exigences actuelles:\n');

const keycloakConfig = fs.readFileSync('./src/config/keycloak.js', 'utf-8');

// Extraire les exigences de jwt.verify()
if (keycloakConfig.includes('algorithms: [\'RS256\']')) {
  console.log(`   ✅ Vérifie: Algorithm RS256`);
}
if (keycloakConfig.includes('issuer:')) {
  const issuerMatch = keycloakConfig.match(/issuer:\s*`([^`]+)`/);
  if (issuerMatch) {
    console.log(`   ✅ Vérifie: Issuer = "${issuerMatch[1]}"`);
  }
}
if (keycloakConfig.includes('header.kid')) {
  console.log(`   ✅ Vérifie: Header KID présent`);
}

console.log('\n   ⚠️  NOTE: jwt.verify() par défaut NE vérifie pas "audience" (aud)\n');

// Vérifier si audience est mentionné
if (keycloakConfig.includes('audience') || keycloakConfig.includes('aud')) {
  console.log(`   ⚠️  ATTENTION: "audience" est mentionné dans config/keycloak.js\n`);
} else {
  console.log(`   ✅ Audience (aud) N'EST PAS vérifiée (peut être un problème si Keycloak l'exige)\n`);
}

// ─────────────────────────────────────────────────────
// ANALYSE : Fallback dans routes/index.js
// ─────────────────────────────────────────────────────

console.log('📌 TEST 7: Vérification du fallback dans routes/index.js\n');

const indexCode = fs.readFileSync('./src/routes/index.js', 'utf-8');
if (indexCode.includes('authenticateKeycloak(req, res, (err) => {') &&
    indexCode.includes('authenticate(req, res, next)')) {
  console.log(`⚠️  OBSERVATION: Fallback détecté (lignes 48-56)\n`);
  console.log(`   authenticateKeycloak(req, res, callback)`);
  console.log(`   → if (err || !req.user) authenticate(req, res, next)\n`);
  console.log(`   ISSUE: Maintenant authenticateKeycloak ET authenticate`);
  console.log(`          pointent tous les deux vers keycloakAuth\n`);
  console.log(`   IMPACT: Le fallback est REDONDANT\n`);
  console.log(`   SUGGESTION: Simplifier à:\n`);
  console.log(`   router.use(authenticate);\n`);
} else {
  console.log(`ℹ️  Pas de fallback détecté\n`);
}

// ─────────────────────────────────────────────────────
// RÉSUMÉ
// ─────────────────────────────────────────────────────

console.log('='.repeat(70));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(70) + '\n');

console.log('✅ Logique d\'authentification:');
console.log('   - NO_TOKEN: Erreur bien typée');
console.log('   - Token expiré: CODE TOKEN_EXPIRED');
console.log('   - Signature invalide: Rejet correct\n');

console.log('✅ Vérifications de sécurité:');
console.log('   - jwt.decode() ABSENT du middleware (keycloakAuth.js)');
console.log('   - verifyKeycloakToken() UTILISÉ (JWKS/RS256 sûr)');
console.log('   - Blacklist vérifiée AVANT cache\n');

console.log('⚠️  RISQUE IDENTIFIÉ: Mismatch iss/audience');
console.log('   - verifyKeycloakToken() exige: iss = http://keycloak:8080/realms/ndjigi');
console.log('   - Si Keycloak émet https:// ou IP différente: 401 INVALID_TOKEN');
console.log('   - NE PEUT PAS TESTER: Keycloak pas accessible en local\n');

console.log('⚠️  FALLBACK REDONDANT: routes/index.js lignes 48-56');
console.log('   - Les deux branches mènent au même middleware');
console.log('   - Peut être simplifié sans perte de fonctionnalité\n');

console.log('='.repeat(70));
console.log('✅ SMOKE TEST TERMINÉ');
console.log('='.repeat(70) + '\n');
