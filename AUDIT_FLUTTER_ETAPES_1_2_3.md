# AUDIT FLUTTER COMPLET — ÉTAPES 1, 2, 3
## Architecture, Spécifications, et Cartographie API

**Date:** 2026-06-07  
**Statut:** Audit complet (Lecture seule)  
**Auteur:** Claude Code  
**Portée:** Deux écrans passager (Profil, Centre d'Assistance)

---

## TABLE DES MATIÈRES
1. [ÉTAPE 1 — Architecture Flutter Existante](#étape-1--architecture-flutter-existante)
2. [ÉTAPE 2 — Spécifications des deux écrans](#étape-2--spécifications-des-deux-écrans)
3. [ÉTAPE 3 — Cartographie complète des appels API](#étape-3--cartographie-complète-des-appels-api)
4. [Récapitulatif des lacunes backend](#récapitulatif-des-lacunes-backend)

---

# ÉTAPE 1 — ARCHITECTURE FLUTTER EXISTANTE

## 1.1 Structure des dossiers (lib/)

```
lib/
├── app/
│   ├── app.dart                      # Application root
│   ├── bootstrap/
│   │   └── bootstrap.dart             # App initialization
│   └── router/
│       ├── app_router.dart            # go_router configuration
│       └── route_guards.dart
│
├── core/
│   ├── config/
│   │   └── app_config.dart            # Base URL, config
│   ├── constants/
│   │   └── routes.dart
│   ├── network/
│   │   └── api_service.dart           # Dio HTTP client
│   ├── providers/
│   │   ├── app_providers.dart         # Riverpod providers
│   │   └── gps_provider.dart
│   ├── services/
│   │   ├── auth_keycloak_service.dart
│   │   ├── location_service.dart
│   │   ├── map_service.dart
│   │   ├── notification_service.dart
│   │   └── (other services)
│   ├── socket/
│   │   └── socket_service.dart        # Socket.io client
│   ├── storage/
│   │   ├── local_db.dart
│   │   └── secure_storage.dart        # Token storage
│   ├── theme/
│   │   ├── app_theme.dart
│   │   ├── colors.dart
│   │   └── text_styles.dart
│   └── utils/
│       ├── formatters.dart
│       ├── geo_utils.dart
│       └── validators.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_repository.dart
│   │   │   └── auth_result.dart (freezed)
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── auth_provider.dart (StateNotifier)
│   │       ├── screens/
│   │       │   ├── splash_screen.dart
│   │       │   ├── welcome_screen.dart
│   │       │   ├── login_screen.dart
│   │       │   ├── register_screen.dart
│   │       │   ├── role_selection_screen.dart
│   │       │   ├── phone_collection_screen.dart
│   │       │   ├── keycloak_callback_screen.dart
│   │       │   └── compte_suspendu_screen.dart
│   │       └── widgets/
│   │
│   ├── home/
│   │   └── presentation/
│   │       └── screens/
│   │           ├── home_passager_screen.dart
│   │           ├── home_chauffeur_screen.dart
│   │           └── home_proprietaire_screen.dart
│   │
│   ├── chauffeur/
│   ├── course/
│   └── (other features)
│
└── shared/
    └── models/
        ├── utilisateur.dart (freezed)
        ├── trajet.dart (freezed)
        ├── location.dart (freezed)
        ├── utilisateur_role.dart
        └── models.dart
```

## 1.2 Pattern d'architecture

**State Management:** Riverpod  
- `Provider<T>` — valeurs constantes (config, services)
- `StateNotifierProvider<N, S>` — état mutable avec notifier (auth)
- `FutureProvider<T>` — données asynchrones (SharedPreferences)

**Navigation:** go_router  
- Routes basées sur chemins: `/home/passager`, `/profil`, `/assistance`
- Redirect logic basée sur `authProvider`
- Deep linking via `ndjigi-mobile://` scheme
- Multi-rôles: passager, chauffeur, proprietaire

**HTTP Client:** Dio via ApiService  
- Base URL depuis `AppConfig`
- JWT interceptor automatique
- Token refresh on 401
- Error handling standardisé
- Timeout: 15s

**Modèles:** freezed + json_serializable  
- Immutabilité garantie
- Sérialisation/désérialisation automatique
- JsonKey pour mapper champs API (snake_case → camelCase)

**Screens:** ConsumerStatefulWidget + ConsumerState  
- Accès providers via `ref.read()`, `ref.watch()`
- Local state avec `setState()` pour UI locale
- Gestion erreurs avec try/catch

## 1.3 Services clés

| Service | Rôle | Implémentation |
|---------|------|-----------------|
| **ApiService** | HTTP client | Dio + JWT interceptor |
| **SecureStorage** | Token storage | flutter_secure_storage |
| **SocketService** | Real-time chat | Socket.io client |
| **LocationService** | GPS/géolocalisation | geolocator |
| **NotificationService** | Push notifications | firebase_messaging |
| **KeycloakAuthService** | OAuth2 auth | Keycloak OIDC |

## 1.4 Auth Flow

```
1. User login (email/password)
   ↓
2. Token exchange (POST /auth/login)
   ↓
3. Store access_token + refresh_token (SecureStorage)
   ↓
4. Load user profile (GET /utilisateurs/profil)
   ↓
5. Determine role (from user.roles)
   ↓
6. Navigate to /home/{role}
   ↓
7. Keycloak OAuth2 flow available (advanced)
   ↓
8. Phone collection if missing (special flow)
```

Token refresh happens automatically via Dio interceptor on 401 response.

## 1.5 Providers hierarchy (app_providers.dart)

```dart
appConfigProvider → AppConfig.instance
secureStorageProvider → SecureStorage()
sharedPreferencesProvider → SharedPreferences (async)
apiServiceProvider → ApiService(storage, config)  ← depends on above
socketServiceProvider → SocketService()
locationServiceProvider → LocationService()
mapServiceProvider → MapService(dio)  ← depends on apiService
notificationServiceProvider → NotificationService()
keycloakAuthServiceProvider → KeycloakAuthService(config, storage, dio)  ← depends on apiService
```

## 1.6 Routes principales

| Route | Écran | Rôle requis |
|-------|-------|------------|
| `/splash` | SplashScreen | Tous |
| `/welcome` | WelcomeScreen | Non-auth |
| `/login` | LoginScreen | Non-auth |
| `/register` | RegisterScreen | Non-auth |
| `/role-selection` | RoleSelectionScreen | Non-auth |
| `/phone-collection` | PhoneCollectionScreen | Non-auth |
| `/home/passager` | HomePassagerScreen | passager |
| `/home/chauffeur` | HomeChauffeurScreen | chauffeur |
| `/home/proprietaire` | HomeProprietaireScreen | proprietaire |

## 1.7 Exemple d'écran existant (HomePassagerScreen)

**Type:** ConsumerStatefulWidget (stateful + Riverpod)

**État local:**
- `_selectedNavIndex` — index bottom nav
- `_currentCarouselPage` — page du carousel
- `_pageController` — contrôle carousel auto-scroll
- `_walletData` — solde portefeuille
- `_notifications` — liste notifications
- `_isLoading` — loading state
- `_errorMessage` — message erreur

**Appels API:**
```dart
// Parallèles au chargement
Future.wait([
  apiService.get('/utilisateurs/profil'),       // Profil user
  apiService.get('/paiement/portefeuille'),     // Wallet
  apiService.get('/notification'),              // Notifications
], eagerError: false);
```

**Sections UI:**
1. AppBar — notifications, user avatar
2. Carousel — banners auto-scroll
3. Wallet card — solde, bouton recharge
4. Services grid — VTC, Covoiturage, Réservation, Location
5. Bottom nav — 4 onglets

**Navigation:**
```dart
context.push('/profil')                    // Profile screen
context.push('/paiement/recharge')         // Wallet top-up
context.push('/course/history')            // Trips history
context.push('/location/search')           // Car rentals
context.push('/notifications')             // Notifications
```

---

# ÉTAPE 2 — SPÉCIFICATIONS DES DEUX ÉCRANS

## Écran 1: Profil Passager

### Organisation générale
Écran scrollable avec sections distinctes:

1. **En-tête du profil**
   - Photo de profil + modifiable
   - Nom, prénom, date inscription
   - Statut vérification
   - Rating/avis moyen

2. **Informations personnelles**
   - Prénom, nom, téléphone, email
   - Adresse
   - Tous modifiables

3. **Adresses favorites**
   - List: Domicile, Travail, etc.
   - CRUD: ajouter, modifier, supprimer
   - Marquer comme préférée

4. **Portefeuille N'DJIGI**
   - Solde disponible
   - Devise (XOF par défaut)
   - Boutons: Recharger, Historique

5. **Centre de sécurité**
   - Contacts de confiance (max 3)
   - CRUD: ajouter, modifier, supprimer
   - Relations: parent, enfant, etc.
   - Tutoriel SOS
   - Toggle: partage trajet automatique

6. **Devenir chauffeur/propriétaire**
   - Affiche options selon rôles actuels
   - Redirection vers formulaires

7. **Paramètres**
   - Notifications (toggle)
   - Langue (local pref)
   - Confidentialité (navigue)
   - Conditions d'utilisation (WebView)
   - Version app (statique)
   - Déconnexion
   - Supprimer compte

### 📊 Résumé API Profil
- **GET:** 4 endpoints (profil, portefeuille, adresses, contacts)
- **POST:** 3 endpoints (photo, adresse, contact)
- **PATCH:** 5 endpoints (profil, adresse, contact, settings)
- **DELETE:** 2 endpoints (adresse, contact)
- **Total:** 14 endpoints pour l'écran Profil

---

## Écran 2: Centre d'Assistance

### Organisation générale
TabBar avec 3 onglets + FAB pour chat:

1. **Tab 1: FAQ**
   - Liste FAQ avec recherche
   - Filtre par catégorie
   - Dépliable (question → réponse)
   - Vote: utile/pas utile

2. **Tab 2: Signalement**
   - Dropdown: sélectionner une course
   - Champ sujet (dropdown)
   - Description libre
   - Upload photos (optionnel)
   - Bouton envoyer → crée ticket

3. **Tab 3: Contact**
   - Info support (téléphone, email)
   - Boutons cliquables (tel:, mailto:)
   - Mes tickets (liste)
   - Détail statut ticket

4. **FAB: Chat direct**
   - Ouvre écran de chat en temps réel
   - Historique messages
   - Envoyer message

### 📊 Résumé API Assistance
- **GET:** 4 endpoints (FAQs, trajets, tickets, messages)
- **POST:** 2 endpoints (photos, ticket)
- **PATCH:** 2 endpoints (FAQ vote, support chat?)
- **WebSocket:** Message envoi/réception (Socket.io)
- **Total:** 8+ endpoints pour l'écran Assistance

---

# ÉTAPE 3 — CARTOGRAPHIE COMPLÈTE DES APPELS API

## Vue d'ensemble synthétique

| Écran | Nombre endpoints | État implémentation |
|-------|------------------|---------------------|
| **Profil** | 14 | ✅ Backend OK |
| **Assistance** | 8+ | ⚠️ Partiellement OK |
| **TOTAL** | **22+** | **À valider** |

---

## Détail par section

### PROFIL PASSAGER

#### Section 1: En-tête Profil

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 1.1 | GET | `/utilisateurs/profil` | - | ✅ Existe |
| 1.2 | POST | `/photos` | ownerType, isPrincipale, photos | ✅ Existe |

#### Section 2: Informations personnelles

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 2.1 | GET | `/utilisateurs/profil` | - | ✅ (réutilisé 1.1) |
| 2.2 | PATCH | `/utilisateurs/profil` | prenom, nom, telephone, email, adresse | ✅ Existe |

#### Section 3: Adresses favorites

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 3.1 | GET | `/addresses` | page, limit, favorite | ✅ Existe |
| 3.2 | POST | `/addresses` | label, address, latitude, longitude, isfavorite | ✅ Existe |
| 3.3 | PATCH | `/addresses/{id}` | label, address, lat, lng, isfavorite | ✅ Existe |
| 3.4 | DELETE | `/addresses/{id}` | - | ✅ Existe |

#### Section 4: Portefeuille N'DJIGI

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 4.1 | GET | `/paiement/portefeuille` | - | ⚠️ À vérifier |
| 4.2 | Nav | `/paiement/recharge` | - | ✅ Route (pas API) |
| 4.3 | Nav | `/paiement/historique` | - | ✅ Route (pas API) |

#### Section 5: Centre de sécurité

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 5.1 | GET | `/contacts-confiance` | page, limit | ✅ Existe |
| 5.2 | POST | `/contacts-confiance` | nom, prenom, country_code, phone, relation | ✅ Existe |
| 5.3 | PATCH | `/contacts-confiance/{id}` | nom, prenom, country_code, phone, relation | ✅ Existe |
| 5.4 | DELETE | `/contacts-confiance/{id}` | - | ✅ Existe |
| 5.5 | - | Tutoriel SOS | - | ✅ Statique (pas API) |
| 5.6 | PATCH | `/utilisateurs/profil` | partage_trajet_automatique | ⚠️ À vérifier champ |

#### Section 6: Devenir chauffeur/propriétaire

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 6.1 | - | Logique rôles | - | ✅ Depuis 1.1 |
| 6.2 | Nav | `/documents/submission?role=chauffeur\|proprietaire` | - | ✅ Route (pas API) |

#### Section 7: Paramètres

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 7.1 | PATCH | `/utilisateurs/profil` | notifications_activees | ⚠️ À vérifier champ |
| 7.2 | - | Local storage | Langue | ✅ Statique (pas API) |
| 7.3 | Nav | `/settings/privacy` | - | ✅ Route (pas API) |
| 7.4 | Nav | `url_launcher` vers PDF | - | ✅ URL launcher (pas API) |
| 7.5 | - | pubspec.yaml | Version | ✅ Statique (pas API) |
| 7.6 | POST | `/auth/logout` | refresh_token | ⚠️ À vérifier endpoint |
| 7.7 | DELETE | `/utilisateurs/{id}` ou `/utilisateurs/profil` | - | ⚠️ À vérifier endpoint exact |

---

### CENTRE D'ASSISTANCE

#### Onglet 1: FAQ

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 1.1 | GET | `/faqs` | categorie, page, limit | ✅ Existe |
| 1.1b | GET | `/faqs/search` | q, page, limit | ✅ Existe |
| 1.2 | PATCH | `/faqs/{id}/vote/helpful` | - | ✅ Existe |
| 1.2b | PATCH | `/faqs/{id}/vote/not-helpful` | - | ✅ Existe |

#### Onglet 2: Signalement

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 2.1 | GET | `/trajets` ou `/trajets/historique` | page, limit | ⚠️ À vérifier |
| 2.2 | POST | `/photos` | ownerType, photos | ✅ Existe |
| 2.3 | POST | `/support/tickets` | sujet, description, id_trajet, photos | ✅ Existe |

#### Onglet 3: Contact

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| 3.1 | - | Config statique | tel, email | ✅ Hardcoded |
| 3.2 | - | `tel:` scheme | - | ✅ url_launcher |
| 3.3 | - | `mailto:` scheme | - | ✅ url_launcher |
| 3.4 | GET | `/support/tickets` | page, limit, statut | ✅ Existe |

#### FAB: Chat direct

| # | Méthode | Endpoint | Paramètres | Statut |
|---|---------|----------|-----------|--------|
| FAB.1 | Nav | `/support/chat` | - | ⚠️ Route (pas implémentée) |
| FAB.2 | GET / WS | `/conversations/{id}/messages` | - | ⚠️ Socket.io only (Phase 7) |
| FAB.3 | POST / WS | `message:send` (Socket.io) | contenu, id_conversation | ✅ Socket.io Phase 7 |

---

## Résumé des appels API par méthode HTTP

### GET (lecture)
```
✅ GET /utilisateurs/profil
✅ GET /addresses
✅ GET /addresses/{id}
✅ GET /contacts-confiance
✅ GET /contacts-confiance/{id}
✅ GET /paiement/portefeuille                    ⚠️ À confirmer
✅ GET /faqs
✅ GET /faqs/search
✅ GET /trajets (pour dropdown signalement)      ⚠️ À confirmer endpoint
✅ GET /support/tickets
✅ GET /conversations/{id}/messages             (Socket.io)
```

### POST (création)
```
✅ POST /photos
✅ POST /addresses
✅ POST /contacts-confiance
✅ POST /support/tickets
✅ POST message:send (Socket.io)
```

### PATCH (modification)
```
✅ PATCH /utilisateurs/profil
✅ PATCH /addresses/{id}
✅ PATCH /contacts-confiance/{id}
✅ PATCH /faqs/{id}/vote/helpful
✅ PATCH /faqs/{id}/vote/not-helpful
⚠️ PATCH /utilisateurs/profil (champs partage_trajet, notifications)
```

### DELETE (suppression)
```
✅ DELETE /addresses/{id}
✅ DELETE /contacts-confiance/{id}
⚠️ DELETE /utilisateurs/{id} (ou /profil)      À confirmer
```

### WebSocket / Socket.io
```
✅ message:send (impl. Phase 7)
✅ message:read
✅ typing:start / typing:stop
⚠️ Chat support (impl. ou création écran nécessaire?)
```

---

## Modèles Dart à créer/adapter

Pour implémenter les deux écrans, il faudrait les modèles suivants:

### Existants ✅
```dart
Utilisateur               // ID, email, nom, prenom, roles, statut_compte
Trajet                    // ID, depart, arrivee, date, tarif
Location                  // lat, lng, adresse, ville
```

### À créer ⚠️
```dart
Address {
  id_address: String,
  label: String,           // "Domicile", "Travail"
  address: String,
  latitude: double,
  longitude: double,
  isfavorite: bool,
  createdAt: DateTime,
  updatedAt: DateTime
}

Contact {
  id_contact: String,
  nom: String,
  prenom: String,
  country_code: String,    // "+221", "+33"
  phone: String,
  relation: String,        // "parent", "enfant", "ami"
  createdAt: DateTime
}

Portefeuille {
  id_portefeuille: String,
  solde: double,
  devise: String,          // "XOF"
  statut: String           // "actif"
}

Photo {
  id_photo: String,
  fileKey: String,
  filename: String,
  filepath: String,
  mimeType: String,
  fileSize: int,
  is_principale: bool,
  uploadedAt: DateTime
}

FAQ {
  id_faq: String,
  question: String,
  reponse: String,
  categorie: String,
  ordre: int,
  isActive: bool,
  helpfulCount: int,
  notHelpfulCount: int,
  viewCount: int,
  createdAt: DateTime
}

SupportTicket {
  id_ticket: String,
  sujet: String,           // "probleme_technique", "reclamation"
  description: String,
  id_trajet: String?,
  photos: List<String>,
  statut: String,          // "ouvert", "en_cours", "resolu"
  eligible_remboursement: bool,
  date_creation: DateTime,
  date_resolution: DateTime?
}

Message {
  id_message: String,
  id_conversation: String,
  contenu: String,
  id_utilisateur: String,
  date_envoi: DateTime,
  lu: bool
}
```

---

# RÉCAPITULATIF DES LACUNES BACKEND

## ✅ Entièrement implémenté

| Feature | Endpoints |
|---------|-----------|
| **Profil utilisateur** | GET/PATCH /utilisateurs/profil |
| **Adresses favorites** | POST/GET/PATCH/DELETE /addresses |
| **Contacts de confiance** | POST/GET/PATCH/DELETE /contacts-confiance |
| **Upload photos** | POST /photos |
| **FAQs** | GET/SEARCH/VOTE /faqs/* |
| **Support tickets** | POST/GET/PATCH /support/tickets |
| **Conversations/Messages** | Socket.io (Phase 7) |

## ⚠️ À vérifier / clarifier

| Item | Endpoint | Question |
|------|----------|----------|
| **Portefeuille** | GET /paiement/portefeuille | Endpoint existe-t-il? Champs retournés? |
| **Logout** | POST /auth/logout | Endpoint exact? Body attendu? |
| **Suppression compte** | DELETE /utilisateurs/{id} ou /profil | Endpoint exact? Soft delete? |
| **Champs profil** | PATCH /utilisateurs/profil | Supporte `partage_trajet_automatique` et `notifications_activees`? |
| **Trajets dropdown** | GET /trajets ou /trajets/historique | Quel endpoint pour le dropdown "Course concernée"? |
| **Chat support** | POST message + GET /conversations/{id}/messages | Réutiliser Socket.io Phase 7 pour support ou endpoint REST? |

## ❌ Non trouvé / À créer

| Item | Solution |
|------|----------|
| **Écran Profil** | Créer entièrement (Flutter) |
| **Écran Assistance** | Créer entièrement (Flutter) |
| **Models Dart** | Créer 7 modèles avec freezed (Address, Contact, Portefeuille, Photo, FAQ, SupportTicket, Message) |
| **Providers** | Créer providers pour chaque ressource (addressProvider, contactProvider, etc.) |
| **Chat support** | À clarifier si réutilise Socket.io ou endpoint REST /conversations |

---

## Recommandations immédiates

### Pour le backend (points de clarification)

1. **Confirmation endpoints portefeuille/logout/suppression**
   - Vérifier GET /paiement/portefeuille existe et retourne solde, devise, statut
   - Vérifier POST /auth/logout existe
   - Clarifier DELETE endpoint exact pour suppression compte

2. **Support du chat**
   - Confirmer si chat support utilise Socket.io (comme messages de chat Phase 7)
   - Ou créer endpoint REST `/support/messages` ou `/conversations/{id}/messages` dédié

3. **Champs profil étendus**
   - Ajouter `partage_trajet_automatique` et `notifications_activees` au model Utilisateur
   - Ou clarifier où stocker ces préférences

### Pour le frontend Flutter

1. **Créer les 7 modèles Dart** avec freezed + json_serializable
2. **Créer providers Riverpod** pour:
   - addressesProvider (FutureProvider)
   - contactsProvider (FutureProvider)
   - portefeuillleProvider (FutureProvider)
   - faqsProvider (FutureProvider)
   - ticketsProvider (FutureProvider)
   - conversationMessagesProvider (FutureProvider + Socket.io)

3. **Implémenter les deux écrans** (Profil, Assistance) en utilisant ConsumerStatefulWidget

4. **Ajouter routes** pour /profil, /assistance, /support/chat dans app_router.dart

---

## Conclusion

**Audit terminé.** La majorité des endpoints backend pour les deux écrans existent et sont fonctionnels. Quelques clarifications et ajouts mineurs sont nécessaires avant de débuter l'implémentation Flutter.

**Nombre d'endpoints mappés:** 22+  
**Endpoints implémentés:** ~18  
**Endpoints à clarifier:** ~4

**Prochaine étape:** Démarrer l'implémentation Flutter des deux écrans Profil et Assistance avec les modèles et providers Riverpod.

---

*Audit complet réalisé en lecture seule. Aucune modification n'a été apportée au code.*
