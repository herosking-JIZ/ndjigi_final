# Intégration Keycloak PKCE - N'DJIGI Mobile

## ✅ Implémentation complétée

### 1. **Dépendances ajoutées** (`pubspec.yaml`)
- `flutter_appauth: ^7.0.0` - Gestion OAuth2/PKCE native
- `app_links: ^3.4.0` - Gestion des deep links
- `crypto: ^3.0.0` - Calcul SHA256 pour PKCE
- `url_launcher: ^6.1.0` - Ouverture d'URLs externes

### 2. **Configuration Android** (`android/app/src/main/AndroidManifest.xml`)
- ✅ Nettoyé les duplicatas
- ✅ Ajouté intent-filters pour deep links:
  - `ndjigi-mobile://callback` - Pour le retour d'authentification
  - `ndjigi-mobile://logout-callback` - Pour le retour de logout

### 3. **Configuration App** (`lib/core/config/app_config.dart`)
- ✅ Ajouté `redirectUri` = `ndjigi-mobile://callback`
- ✅ Ajouté `logoutRedirectUri` = `ndjigi-mobile://logout-callback`
- ✅ Ajouté getter `keycloakUserInfoEndpoint`
- ✅ Support des --dart-define pour chaque flavor (dev/staging/prod)

### 4. **Service Keycloak** (Nouveau: `lib/core/services/auth_keycloak_service.dart`)
- ✅ Classe `KeycloakAuthService` avec méthodes:
  - `buildAuthorizationUrl()` - Construit l'URL PKCE
  - `exchangeCodeForTokens()` - Échange code → tokens
  - `refreshAccessToken()` - Rafraîchit les tokens
  - `isTokenExpired()` - Vérifie l'expiration
- ✅ Parsing JWT pour extraire user + roles depuis `id_token`
- ✅ Classe `KeycloakAuthResult` pour les résultats

### 5. **Provider Keycloak** (`lib/core/providers/app_providers.dart`)
- ✅ Ajouté `keycloakAuthServiceProvider`

### 6. **Repository Auth** (`lib/features/auth/data/auth_repository.dart`)
- ✅ Ajouté dépendance `KeycloakAuthService`
- ✅ Méthode `startLoginWithKeycloak()` - Démarre le flux PKCE
- ✅ Méthode `completeLoginWithKeycloak()` - Complète avec le code
- ✅ Amélioré `isAuthenticated()` - Vérifie l'expiry JWT
- ✅ Amélioré `refreshTokens()` - Utilise Keycloak
- ✅ Implémentation PKCE:
  - `_generateCodeVerifier()` - 128 chars URL-safe
  - `_generateCodeChallenge()` - SHA256(verifier) en base64url
  - `_generateRandomString()` - State CSRF random

### 7. **Provider Auth** (`lib/features/auth/presentation/providers/auth_provider.dart`)
- ✅ Classe `LoginFlowState` pour le flux OAuth
- ✅ Champs privés pour stocker `_currentCodeVerifier` et `_currentState`
- ✅ Méthode `startKeycloakLogin()` - Lance le flux
- ✅ Méthode `completeKeycloakLogin()` - Traite le callback
- ✅ Amélioré `checkAuthStatus()` - Timeout 8s + gestion TimeoutException
- ✅ Notifier avec suppression de token sauf sur timeout réseau

### 8. **API Service** (`lib/core/network/api_service.dart`)
- ✅ Amélioration du LogInterceptor pour masquer les tokens en clair
- ✅ Regex pour remplacer `Bearer`, `access_token`, `refresh_token`, `id_token`

### 9. **Deep Link Parser** (Nouveau: `lib/core/services/deeplink_handler.dart`)
- ✅ Classe `DeepLinkParser` avec méthodes:
  - `parseKeycloakCallback()` - Extrait code, state, error
  - `isKeycloakCallback()` - Détecte le type de deep link

### 10. **Écran Callback** (Nouveau: `lib/features/auth/presentation/screens/keycloak_callback_screen.dart`)
- ✅ Gère le retour depuis Keycloak
- ✅ Extrait le code du deep link
- ✅ Appelle `completeKeycloakLogin()`
- ✅ Redirige vers `/role-selection` ou `/login` selon le succès

### 11. **Routes** (`lib/app/router/app_router.dart` + `lib/core/constants/routes.dart`)
- ✅ Ajouté constante `keycloakCallback = '/auth/keycloak-callback'`
- ✅ Ajouté GoRoute pour `/auth/keycloak-callback` avec parsing des query params

## 🔄 Flux d'authentification

```
1. Utilisateur clique "Connexion Keycloak" → startKeycloakLogin()
   ├─ Génère code_verifier (128 chars)
   ├─ Génère code_challenge = SHA256(verifier)
   ├─ Génère state (CSRF)
   ├─ Stocke verifier + state en mémoire
   └─ Retourne authUrl + loginData

2. url_launcher.launchUrl(authUrl) → ouvre browser Keycloak

3. Utilisateur se log dans Keycloak

4. Keycloak redirige vers ndjigi-mobile://callback?code=XXX&state=YYY

5. Deep link intercepté → GoRouter route vers /auth/keycloak-callback

6. KeycloakCallbackScreen extrait code + récupère verifier du notifier

7. completeKeycloakLogin(code: code)
   ├─ Récupère verifier du notifier
   ├─ POST /token avec code + verifier
   ├─ Décide le JWT id_token
   ├─ Extrait user + roles
   ├─ Sauvegarde tokens dans SecureStorage
   └─ Mets à jour state Riverpod

8. GoRouter redirige vers /role-selection (ou /home/role)
```

## 🛠️ Configuration Keycloak (côté serveur)

```
Realm: ndjigi
Client: ndjigi-mobile
  - Access Type: public (pas de secret)
  - Standard Flow Enabled: ON
  - Implicit Flow Enabled: OFF
  - Valid Redirect URIs:
    * ndjigi-mobile://callback
    * http://localhost:8080/callback (dev/test)
  - Valid Post Logout Redirect URIs:
    * ndjigi-mobile://logout-callback
  - Require PKCE: ON
  - PKCE Code Challenge Method: S256 (SHA256)
```

## 📱 Commandes de test

```bash
# Émulateur Android (10.0.2.2 = localhost depuis émulateur)
flutter run \
  --dart-define=KEYCLOAK_URL=http://10.0.2.2:8080 \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1

# Téléphone réel (IP LAN)
flutter run \
  --dart-define=KEYCLOAK_URL=http://10.3.3.49:8080 \
  --dart-define=API_BASE_URL=http://10.3.3.49:8000/api/v1
```

## ⚠️ Points importants

1. **Sécurité**: Les tokens ne sont JAMAIS loggués en clair (regex masquage)
2. **Expiry**: JWT exp est vérifié à chaque authentification
3. **Refresh**: Automatique si token expiré (transparent)
4. **Timeout**: Si réseau lent, l'utilisateur reste logué (pas de logout forced)
5. **Deep links**: Gérés automatiquement par GoRouter + intent-filters
6. **Roles**: Extraits de `realm_access.roles` du JWT

## 📋 À faire côté UI

Pour terminer l'intégration:

```dart
// login_screen.dart - Ajouter un bouton:
ElevatedButton(
  onPressed: () async {
    final loginFlow = await ref.read(authProvider.notifier).startKeycloakLogin();
    if (loginFlow?.authUrl != null) {
      await launchUrl(
        Uri.parse(loginFlow!.authUrl!),
        mode: LaunchMode.externalApplication,
      );
    }
  },
  child: const Text('Connexion avec Keycloak'),
),
```

## 🧪 Checklist avant merge

- [ ] `flutter pub get` pour synchroniser pubspec.lock
- [ ] `flutter clean && flutter pub get`
- [ ] Compiler sans erreurs: `flutter build apk --dart-define=...`
- [ ] Tester sur émulateur:
  - [ ] Bouton "Keycloak" ouvre le browser
  - [ ] Login dans Keycloak
  - [ ] Callback redirige vers l'app
  - [ ] État Riverpod `isAuthenticated=true`
  - [ ] GoRouter redirige vers /role-selection
- [ ] Tester sur téléphone réel:
  - [ ] Deep link fonctionne
  - [ ] Pas de crash sur 401/token expiry

## 📄 Fichiers modifiés

```
✅ pubspec.yaml
✅ android/app/src/main/AndroidManifest.xml
✅ lib/core/config/app_config.dart
✅ lib/core/network/api_service.dart
✅ lib/core/providers/app_providers.dart
✅ lib/core/constants/routes.dart
✅ lib/features/auth/data/auth_repository.dart
✅ lib/features/auth/presentation/providers/auth_provider.dart
✅ lib/app/router/app_router.dart

✅ CRÉÉS:
  - lib/core/services/auth_keycloak_service.dart
  - lib/core/services/deeplink_handler.dart
  - lib/features/auth/presentation/screens/keycloak_callback_screen.dart
```

---

**Note**: Cette implémentation suit les best practices OAuth2/PKCE. Les tokens sont stockés dans flutter_secure_storage uniquement (jamais SharedPreferences). La gestion des erreurs est robuste avec timeout + retry.
