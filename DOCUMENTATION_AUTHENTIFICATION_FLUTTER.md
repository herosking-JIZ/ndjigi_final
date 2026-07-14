# Documentation API d'Authentification - N'DJIGI
## Pour Développeurs Mobile Flutter

**Version:** 1.0  
**Date:** Juin 2026  
**Base URL:** `https://api.ndjigi.com/api/v1` (Production) | `http://localhost:8000/api/v1` (Développement)

---

## Table des Matières

1. [Vue d'ensemble du système](#vue-densemble)
2. [Architecture de l'authentification](#architecture)
3. [Flux d'authentification par rôle](#flux-par-role)
4. [Endpoints API détaillés](#endpoints)
5. [Gestion des tokens](#tokens)
6. [Codes d'erreur](#erreurs)
7. [Implémentation Flutter](#flutter)
8. [Bonnes pratiques de sécurité](#securite)

---

## Vue d'Ensemble du Système {#vue-densemble}

N'DJIGI utilise un système d'authentification **multi-couches** avec **Keycloak** comme fournisseur d'identité principal (SSO), supportant plusieurs rôles utilisateurs :

- **Passagers** : Réservation et consultation de trajets
- **Chauffeurs** : Gestion de disponibilité et trajets
- **Propriétaires** : Gestion de véhicules et locations
- **Gestionnaires** : Gestion des parkings
- **Administrateurs** : Accès complet à la plateforme

### Types d'Authentification Supportés

1. **Keycloak OAuth2** (Recommandé) - Primary authentication via Keycloak server
2. **Email/Mot de passe local** - Fallback pour gestionnaires
3. **SMS OTP** - Authentification par SMS (Phase 5)
4. **TOTP 2FA** - Authentification à deux facteurs (Phase 6)
5. **Invitation par email** - Onboarding des gestionnaires

---

## Architecture de l'Authentification {#architecture}

### Flux Général

```
Client Flutter
    ↓
[Demande de connexion]
    ↓
API N'DJIGI Backend
    ↓
Keycloak Server (OAuth2)
    ↓
[Validation + Création Tokens]
    ↓
Redis (Token Blacklist & Cache)
    ↓
Base de Données PostgreSQL
    ↓
[Réponse avec Access Token + Refresh Token]
    ↓
Client Flutter [Stocke tokens en sécurité]
```

### Composants Principaux

| Composant | Rôle |
|-----------|------|
| **Access Token** | JWT (15 minutes) - Utilisé pour chaque requête authentifiée |
| **Refresh Token** | JWT (7 jours) - Utilisé pour obtenir un nouveau Access Token |
| **Redis Blacklist** | Invalidation des tokens lors de la déconnexion |
| **Keycloak** | Serveur d'identité (création/gestion des identités) |
| **Database** | Synchronisation des rôles et données utilisateur |

### Schéma de l'Utilisateur

```json
{
  "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "numero_telephone": "+223XXXXXXXX",
  "nom": "Traoré",
  "prenom": "Ahmed",
  "keycloak_id": "keycloak-uuid",
  "auth_provider": "keycloak|email",
  "deux_fa_activee": false,
  "auth_method_otp": false,
  "statut_compte": "actif|inactif|suspendu",
  "mot_de_passe_temporaire": false,
  "roles": ["passager", "chauffeur"],
  "created_at": "2026-01-01T10:30:00Z",
  "updated_at": "2026-01-01T10:30:00Z"
}
```

---

## Flux d'Authentification par Rôle {#flux-par-role}

### 1. PASSAGER - Flux d'Inscription et Connexion

#### Scénario 1a: Première Connexion (Inscription)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Utilisateur ouvre l'app                              │
│ 2. Clique sur "S'inscrire"                              │
│ 3. Entre: email, mot de passe, nom, prénom, téléphone   │
│ 4. App envoie POST /auth/login                          │
│ 5. Keycloak crée le compte automatiquement              │
│ 6. Backend crée l'enregistrement utilisateur            │
│ 7. Tokens reçus et stockés en sécurité                  │
│ 8. Redirection vers l'écran d'accueil passager          │
└─────────────────────────────────────────────────────────┘
```

**Requête:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "ahmed.traore@example.com",
  "password": "SecurePass@2026123",
  "grant_type": "password"
}
```

**Réponse (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
    "email": "ahmed.traore@example.com",
    "prenom": "Ahmed",
    "nom": "Traoré",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["passager"],
    "statut_compte": "actif"
  }
}
```

#### Scénario 1b: Connexion Existante

Même requête que 1a - le système détecte si le compte existe.

#### Scénario 1c: Vérification du Profil Passager

Après connexion, récupérer les informations complètes du profil passager:

```http
GET /utilisateur/profil
Authorization: Bearer {access_token}
```

**Réponse (200 OK):**
```json
{
  "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ahmed.traore@example.com",
  "prenom": "Ahmed",
  "nom": "Traoré",
  "numero_telephone": "+223XXXXXXXX",
  "roles": ["passager"],
  "statut_compte": "actif",
  "deux_fa_activee": false,
  "passager": {
    "adresses": [
      {
        "id": "addr-001",
        "type": "domicile|travail|autre",
        "adresse": "Avenue de Mali, Bamako",
        "latitude": 12.6536,
        "longitude": -8.0029
      }
    ],
    "historique_trajets": 15,
    "note_moyenne": 4.8,
    "nombre_evaluations": 42
  }
}
```

---

### 2. CHAUFFEUR - Flux d'Inscription et Connexion

#### Scénario 2a: Inscription Chauffeur

Processus similaire au passager avec données supplémentaires:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "driver.moussa@example.com",
  "password": "SecurePass@2026123",
  "grant_type": "password",
  "user_type": "chauffeur"  // Optionnel - pour pre-sélection du rôle
}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id_utilisateur": "660e8400-e29b-41d4-a716-446655440111",
    "email": "driver.moussa@example.com",
    "prenom": "Moussa",
    "nom": "Diallo",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["chauffeur"],
    "statut_compte": "actif"
  }
}
```

#### Scénario 2b: Profil Chauffeur Complètes

```http
GET /utilisateur/profil
Authorization: Bearer {access_token}
```

**Réponse (200 OK):**
```json
{
  "id_utilisateur": "660e8400-e29b-41d4-a716-446655440111",
  "email": "driver.moussa@example.com",
  "prenom": "Moussa",
  "nom": "Diallo",
  "numero_telephone": "+223XXXXXXXX",
  "roles": ["chauffeur"],
  "statut_compte": "actif",
  "deux_fa_activee": false,
  "chauffeur": {
    "numero_permis": "BK-2024-123456",
    "date_expiration_permis": "2028-06-15",
    "statut_chauffeur": "actif|inactif|suspendu|bloque",
    "statut_verification": "verifie|en_attente|rejete",
    "documents_verification": {
      "permis_de_conduire": {
        "statut": "accepte|rejete|en_attente",
        "date_verification": "2026-01-15T10:30:00Z",
        "commentaire": null
      },
      "certificat_aptitude": {
        "statut": "accepte",
        "date_verification": "2026-01-15T10:30:00Z"
      }
    },
    "disponibilite": "disponible|occupe|indisponible",
    "localisation_actuelle": {
      "latitude": 12.6536,
      "longitude": -8.0029,
      "accuracy": 10.5,
      "timestamp": "2026-06-03T15:45:00Z"
    },
    "note_moyenne": 4.9,
    "nombre_evaluations": 127,
    "nombre_trajets_effectues": 245,
    "vehicule_principal": {
      "id_vehicule": "veh-001",
      "marque": "Toyota",
      "modele": "Corolla",
      "immatriculation": "BA-5234-XX",
      "couleur": "Gris"
    }
  }
}
```

---

### 3. PROPRIÉTAIRE - Flux d'Inscription et Connexion

#### Scénario 3a: Inscription Propriétaire

```http
POST /auth/login
Content-Type: application/json

{
  "email": "owner.fatima@example.com",
  "password": "SecurePass@2026123",
  "grant_type": "password",
  "user_type": "proprietaire"
}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id_utilisateur": "770e8400-e29b-41d4-a716-446655440222",
    "email": "owner.fatima@example.com",
    "prenom": "Fatima",
    "nom": "Koita",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["proprietaire"],
    "statut_compte": "actif"
  }
}
```

#### Scénario 3b: Profil Propriétaire

```http
GET /utilisateur/profil
Authorization: Bearer {access_token}
```

**Réponse:**
```json
{
  "id_utilisateur": "770e8400-e29b-41d4-a716-446655440222",
  "email": "owner.fatima@example.com",
  "roles": ["proprietaire"],
  "proprietaire": {
    "statut_validation": "valide|en_attente|rejete",
    "date_validation": "2026-01-20T14:30:00Z",
    "documents_fournis": {
      "carte_identite": {
        "statut": "accepte|rejete|en_attente",
        "date_verification": "2026-01-20T14:30:00Z"
      },
      "certificat_immatriculation": {
        "statut": "accepte"
      }
    },
    "nombre_vehicules": 3,
    "nombre_locations_actives": 1,
    "nombre_locations_totales": 27,
    "taux_satisfaction": 4.7,
    "vehicules": [
      {
        "id_vehicule": "veh-001",
        "marque": "Toyota",
        "modele": "Corolla",
        "immatriculation": "BA-5234-XX",
        "couleur": "Gris",
        "annee": 2023,
        "type": "berline",
        "statut": "disponible|loue|hors_service"
      }
    ]
  }
}
```

---

## Endpoints API Détaillés {#endpoints}

### A. AUTHENTIFICATION

#### 1. Connexion / Inscription (Keycloak + Email)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass@2026",
  "grant_type": "password"
}
```

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| email | string | ✓ | Adresse email unique |
| password | string | ✓ | Mot de passe (12+ caractères, minuscule, majuscule, chiffre, caractère spécial) |
| grant_type | string | ✓ | Toujours "password" |

**Réponses:**
- `201 Created` : Inscription réussie
- `200 OK` : Connexion réussie
- `400 Bad Request` : Paramètres invalides
- `401 Unauthorized` : Mot de passe incorrect
- `429 Too Many Requests` : Limite de 10 tentatives par 15 minutes dépassée

**Exemple réponse 200/201:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "prenom": "Ahmed",
    "nom": "Traoré",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["passager"],
    "statut_compte": "actif"
  }
}
```

---

#### 2. Rafraîchir le Token

Lorsque l'access_token expire (15 minutes), utiliser le refresh_token pour obtenir un nouveau sans se reconnecter.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC..."
}
```

**Réponses:**
- `200 OK` : Nouveaux tokens générés
- `401 Unauthorized` : Refresh token expiré ou invalide
- `403 Forbidden` : Compte inactif/suspendu

**Réponse 200:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Points Important:**
- Faire la demande **avant** l'expiration du token (ex: à 14 minutes)
- Mettre à jour les tokens stockés localement
- Si echec → demander à l'utilisateur de se reconnecter

---

#### 3. Déconnexion

```http
POST /auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC..."
}
```

**Réponses:**
- `200 OK` : Déconnexion réussie, tokens invalidés
- `401 Unauthorized` : Token invalide/expiré

**Réponse 200:**
```json
{
  "message": "Déconnexion réussie"
}
```

**Important:** 
- Cette action blackliste les tokens (impossible de les réutiliser)
- Supprimer les tokens stockés localement
- Rediriger vers l'écran de connexion

---

#### 4. Connexion Locale (Gestionnaires)

Pour les gestionnaires créés par l'admin (sans Keycloak):

```http
POST /auth/local/login
Content-Type: application/json

{
  "email": "gestionnaire@example.com",
  "password": "TempPassword123!",
  "grant_type": "password"
}
```

Identique à `/auth/login` mais pour l'authentification locale uniquement.

---

### B. GESTION DU MOT DE PASSE

#### 1. Changer le Mot de Passe Temporaire

Les gestionnaires reçoivent un mot de passe temporaire et doivent le changer à la première connexion:

```http
POST /auth/change-temporary-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "ancien_mot_de_passe": "TempPassword123!",
  "nouveau_mot_de_passe": "NewSecurePass@2026",
  "confirmation_mot_de_passe": "NewSecurePass@2026"
}
```

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| ancien_mot_de_passe | string | ✓ | Mot de passe temporaire actuel |
| nouveau_mot_de_passe | string | ✓ | Nouveau mot de passe (12+ caractères) |
| confirmation_mot_de_passe | string | ✓ | Confirmation du nouveau mot de passe |

**Réponses:**
- `200 OK` : Mot de passe changé, flag temporaire retiré
- `400 Bad Request` : Validation échouée
- `401 Unauthorized` : Mot de passe actuel incorrect

**Réponse 200:**
```json
{
  "message": "Mot de passe modifié avec succès",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Validation du Mot de Passe:**
- Minimum 12 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (!@#$%^&*)

---

#### 2. Demande de Réinitialisation de Mot de Passe

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Réponses:**
- `200 OK` : Email d'instruction envoyé (toujours 200 même si email inexistant - sécurité)
- `400 Bad Request` : Email invalide

**Réponse 200:**
```json
{
  "message": "Si l'email existe, vous recevrez les instructions de réinitialisation",
  "email_sent": true
}
```

**Flux Email:**
1. Backend envoie email avec lien contenant un token unique
2. Utilisateur clique sur le lien dans l'email
3. Utiliser l'endpoint suivant avec le token

---

#### 3. Réinitialiser le Mot de Passe

```http
POST /auth/reset-password
Content-Type: application/json

{
  "reset_token": "token-recu-par-email",
  "nouveau_mot_de_passe": "NewSecurePass@2026",
  "confirmation_mot_de_passe": "NewSecurePass@2026"
}
```

**Réponses:**
- `200 OK` : Mot de passe réinitialisé
- `400 Bad Request` : Token expiré ou invalide
- `409 Conflict` : Token déjà utilisé

**Réponse 200:**
```json
{
  "message": "Mot de passe réinitialisé avec succès",
  "can_login": true
}
```

---

### C. AUTHENTIFICATION À DEUX FACTEURS (2FA)

#### Phase 1: Demander un Code SMS

```http
POST /auth/otp/request
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "numero_telephone": "+223XXXXXXXX"
}
```

**Réponses:**
- `200 OK` : SMS envoyé
- `400 Bad Request` : Numéro invalide
- `429 Too Many Requests` : Limité à 1 demande par 60 secondes, max 5 par 24h

**Réponse 200:**
```json
{
  "message": "Code OTP envoyé au numéro",
  "numero_telephone": "+223XXXXXXXX",
  "expires_in": 300,
  "attempts_remaining": 3
}
```

---

#### Phase 2: Vérifier le Code OTP

```http
POST /auth/otp/verify
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "otp_code": "123456",
  "numero_telephone": "+223XXXXXXXX"
}
```

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| otp_code | string | ✓ | Code à 6 chiffres reçu par SMS |
| numero_telephone | string | ✓ | Numéro utilisé pour la demande |

**Réponses:**
- `200 OK` : Code vérifié, 2FA activée
- `400 Bad Request` : Code invalide
- `429 Too Many Requests` : Trop de tentatives (max 3 par OTP)

**Réponse 200:**
```json
{
  "message": "OTP vérifié avec succès",
  "deux_fa_activee": true,
  "auth_method_otp": true
}
```

---

#### Phase 3: Configuration TOTP (Authentificateur Google)

Après activation SMS OTP, configurer TOTP pour une sécurité supplémentaire:

```http
POST /auth/totp/setup
Authorization: Bearer {access_token}
```

**Réponse 200:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "manual_entry_key": "JBSWY3DPEBLW64TMMQ======",
  "message": "Scannez le code QR avec Google Authenticator ou entrez manuellement la clé"
}
```

**Actions sur le client:**
1. Afficher le code QR à l'utilisateur
2. Demander de scanner avec Google Authenticator/Authy/Microsoft Authenticator
3. Demander une confirmation avec un code à 6 chiffres

---

#### Phase 4: Vérifier le Code TOTP

```http
POST /auth/totp/verify
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "totp_code": "123456"
}
```

**Réponses:**
- `200 OK` : TOTP configuré et vérifié
- `400 Bad Request` : Code invalide
- `429 Too Many Requests` : Trop de tentatives

**Réponse 200:**
```json
{
  "message": "TOTP configuré avec succès",
  "backup_codes": [
    "XXXX-XXXX",
    "XXXX-XXXX",
    "XXXX-XXXX",
    "XXXX-XXXX",
    "XXXX-XXXX"
  ],
  "message_important": "Conservez ces codes dans un endroit sûr. Ils permettent l'accès d'urgence."
}
```

---

### D. VÉRIFICATION DE COMPTE

#### Vérifier Email (Après Inscription)

```http
POST /auth/verify-sms
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "verification_code": "123456"
}
```

---

### E. PROFIL UTILISATEUR

#### 1. Récupérer le Profil Actuel

```http
GET /utilisateur/profil
Authorization: Bearer {access_token}
```

**Réponses:**
- `200 OK` : Profil récupéré
- `401 Unauthorized` : Token absent ou expiré
- `403 Forbidden` : Compte inactif

Voir sections "Flux par rôle" pour structure complète.

---

#### 2. Mettre à Jour le Profil

```http
PATCH /utilisateur/profil
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "prenom": "Ahmed",
  "nom": "Traoré",
  "numero_telephone": "+223XXXXXXXX",
  "photo_profil_url": "https://cdn.ndjigi.com/..."
}
```

**Réponses:**
- `200 OK` : Profil mis à jour
- `400 Bad Request` : Données invalides
- `409 Conflict` : Email/numéro déjà utilisé

**Réponse 200:**
```json
{
  "message": "Profil mis à jour avec succès",
  "user": { /* objet utilisateur complet */ }
}
```

---

#### 3. Récupérer Tous les Utilisateurs (Admin)

```http
GET /utilisateurs?page=1&limit=20
Authorization: Bearer {access_token}
```

Requête: `access_token` de rôle `admin` ou `gestionnaire`

**Réponses:**
- `200 OK` : Liste paginée
- `401 Unauthorized` : Non authentifié
- `403 Forbidden` : Permissions insuffisantes

---

## Gestion des Tokens {#tokens}

### Structure d'un Access Token JWT

```json
{
  "alg": "RS256",
  "typ": "JWT"
}.
{
  "sub": "keycloak-user-id",
  "email": "user@example.com",
  "prenom": "Ahmed",
  "nom": "Traoré",
  "realm_access": {
    "roles": ["passager", "user"]
  },
  "resource_access": {
    "ndjigi-backend": {
      "roles": ["passager"]
    }
  },
  "email_verified": true,
  "preferred_username": "user@example.com",
  "given_name": "Ahmed",
  "family_name": "Traoré",
  "iat": 1717418400,
  "exp": 1717419300,
  "jti": "token-id-unique"
}
```

### Durée de Vie

| Token | Durée | Action |
|-------|-------|--------|
| Access Token | 15 minutes | Utiliser pour authentifier chaque requête |
| Refresh Token | 7 jours | Obtenir un nouvel Access Token sans se reconnecter |

### Stockage Sécurisé des Tokens en Flutter

**Pour Android:**
```dart
// Utiliser flutter_secure_storage
final storage = FlutterSecureStorage();

// Sauvegarder
await storage.write(key: 'access_token', value: accessToken);
await storage.write(key: 'refresh_token', value: refreshToken);

// Récupérer
String? accessToken = await storage.read(key: 'access_token');
```

**Pour iOS:**
```dart
// Même package, utilise Keychain
final storage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_OAEPwithSHA_256andMGF1Padding,
    storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
  ),
);
```

**NE PAS FAIRE:**
❌ Stocker dans SharedPreferences (lisible en clair)
❌ Stocker dans des variables globales
❌ Logger les tokens
❌ Transmettre en paramètre GET

---

### Headers HTTP pour Toute Requête Authentifiée

```http
GET /api/v1/utilisateur/profil
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cC...
Content-Type: application/json
```

---

### Gestion Automatique de l'Expiration en Flutter

```dart
// Classe d'exemple pour gérer les tokens
class AuthService {
  final storage = FlutterSecureStorage();
  late Timer? _refreshTimer;
  
  Future<String?> getValidAccessToken() async {
    String? token = await storage.read(key: 'access_token');
    
    if (token == null) return null;
    
    // Vérifier si le token expire dans moins de 1 minute
    if (_isTokenExpiringSoon(token)) {
      return await _refreshToken();
    }
    
    return token;
  }
  
  bool _isTokenExpiringSoon(String token) {
    // Décoder et vérifier exp claim
    final parts = token.split('.');
    final decodedBytes = utf8.encode(parts[1]);
    final payload = json.decode(
      utf8.decode(base64.decode(base64.normalize(parts[1])))
    );
    
    final exp = DateTime.fromMillisecondsSinceEpoch(payload['exp'] * 1000);
    return DateTime.now().isAfter(exp.subtract(Duration(minutes: 1)));
  }
  
  Future<String?> _refreshToken() async {
    String? refreshToken = await storage.read(key: 'refresh_token');
    
    if (refreshToken == null) {
      // Forcer la déconnexion
      await logout();
      return null;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$BASE_URL/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refresh_token': refreshToken}),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await storage.write(key: 'access_token', value: data['access_token']);
        await storage.write(key: 'refresh_token', value: data['refresh_token']);
        return data['access_token'];
      } else {
        // Refresh token expiré
        await logout();
        return null;
      }
    } catch (e) {
      print('Erreur refresh token: $e');
      return null;
    }
  }
}
```

---

## Codes d'Erreur {#erreurs}

### Erreurs d'Authentification

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | "Email et mot de passe requis" | Paramètres manquants | Vérifier les données envoyées |
| 400 | "Format email invalide" | Email mal formé | Valider avec regex standard |
| 400 | "Mot de passe trop faible" | Validation échouée | Voir critères de mot de passe |
| 401 | "Identifiants invalides" | Email/pass incorrect | Afficher "Email ou mot de passe incorrect" |
| 401 | "Token expiré" | Access token expiré | Utiliser refresh_token |
| 401 | "Token invalide" | Token corrompu/modifié | Déconnecter l'utilisateur |
| 401 | "Refresh token expiré" | Refresh token expiré (7 jours) | Demander reconnexion |
| 403 | "Compte suspendu" | Compte blacklisté | Contacter support |
| 403 | "Compte inactif" | Compte désactivé | Réactiver depuis le portail |
| 403 | "Permissions insuffisantes" | Rôle non autorisé | Vérifier le rôle utilisateur |
| 404 | "Utilisateur non trouvé" | Pas d'enregistrement | Vérifier l'ID |
| 409 | "Email déjà utilisé" | Email existe | Proposer reset password |
| 409 | "Numéro de téléphone déjà utilisé" | Téléphone existe | Proposer reset password |
| 429 | "Trop de tentatives" | Limite dépassée | Attendre et réessayer |

### Exemple de Réponse d'Erreur

```json
{
  "error": "Unauthorized",
  "status_code": 401,
  "message": "Token expiré",
  "timestamp": "2026-06-03T15:45:30Z",
  "request_id": "req-12345"
}
```

### Erreurs OTP/2FA

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | "Code OTP invalide" | Mauvais code | Vérifier le code reçu |
| 400 | "Code OTP expiré" | OTP expiré (5 min) | Demander un nouveau code |
| 429 | "Trop de tentatives OTP" | >3 tentatives | Demander un nouveau code |
| 429 | "Limite de demandes OTP" | >5 demandes/24h | Réessayer plus tard |

---

## Implémentation Flutter {#flutter}

### Installation des Dépendances

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  flutter_secure_storage: ^9.0.0
  jwt_decoder: ^2.0.1
  connectivity_plus: ^5.0.0
  provider: ^6.0.0
```

---

### Service d'Authentification Complet

```dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService extends ChangeNotifier {
  static const String baseUrl = 'http://localhost:8000/api/v1';
  static const String storageKeyAccessToken = 'access_token';
  static const String storageKeyRefreshToken = 'refresh_token';
  
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _accessToken;
  String? _refreshToken;
  Map<String, dynamic>? _user;
  Timer? _refreshTimer;
  
  // Getters
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _accessToken != null;
  List<String> get userRoles => _user?['roles'] ?? [];
  
  /// Initialiser le service (appeler au démarrage)
  Future<void> init() async {
    _accessToken = await _storage.read(key: storageKeyAccessToken);
    _refreshToken = await _storage.read(key: storageKeyRefreshToken);
    
    if (_accessToken != null && !JwtDecoder.isExpired(_accessToken!)) {
      _startRefreshTimer();
      notifyListeners();
    } else if (_refreshToken != null) {
      await _refreshToken();
    } else {
      await logout();
    }
  }
  
  /// Connexion/Inscription
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'grant_type': 'password',
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        _accessToken = data['access_token'];
        _refreshToken = data['refresh_token'];
        _user = data['user'];
        
        // Sauvegarder en sécurité
        await _storage.write(
          key: storageKeyAccessToken,
          value: _accessToken!,
        );
        await _storage.write(
          key: storageKeyRefreshToken,
          value: _refreshToken!,
        );
        
        _startRefreshTimer();
        notifyListeners();
        
        return {'success': true, 'user': _user};
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Erreur de connexion',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Erreur réseau: $e'};
    }
  }
  
  /// Rafraîchir le token
  Future<bool> _refreshToken() async {
    if (_refreshToken == null) {
      await logout();
      return false;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refresh_token': _refreshToken}),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _accessToken = data['access_token'];
        _refreshToken = data['refresh_token'];
        
        await _storage.write(
          key: storageKeyAccessToken,
          value: _accessToken!,
        );
        await _storage.write(
          key: storageKeyRefreshToken,
          value: _refreshToken!,
        );
        
        notifyListeners();
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (e) {
      print('Erreur refresh: $e');
      return false;
    }
  }
  
  /// Déconnexion
  Future<void> logout() async {
    try {
      if (_accessToken != null && _refreshToken != null) {
        await http.post(
          Uri.parse('$baseUrl/auth/logout'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $_accessToken',
          },
          body: json.encode({'refresh_token': _refreshToken}),
        );
      }
    } catch (e) {
      print('Erreur déconnexion: $e');
    } finally {
      _accessToken = null;
      _refreshToken = null;
      _user = null;
      _refreshTimer?.cancel();
      
      await _storage.delete(key: storageKeyAccessToken);
      await _storage.delete(key: storageKeyRefreshToken);
      
      notifyListeners();
    }
  }
  
  /// Demander code OTP
  Future<Map<String, dynamic>> requestOTP(String phoneNumber) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/otp/request'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_accessToken',
        },
        body: json.encode({'numero_telephone': phoneNumber}),
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {
          'success': false,
          'message': json.decode(response.body)['message'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Erreur: $e'};
    }
  }
  
  /// Vérifier code OTP
  Future<Map<String, dynamic>> verifyOTP({
    required String otpCode,
    required String phoneNumber,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/otp/verify'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_accessToken',
        },
        body: json.encode({
          'otp_code': otpCode,
          'numero_telephone': phoneNumber,
        }),
      );
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {
          'success': false,
          'message': json.decode(response.body)['message'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Erreur: $e'};
    }
  }
  
  /// Récupérer le profil complet
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final token = await _getValidToken();
      if (token == null) {
        return {'success': false, 'message': 'Non authentifié'};
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/utilisateur/profil'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        _user = json.decode(response.body);
        notifyListeners();
        return {'success': true, 'user': _user};
      } else {
        return {
          'success': false,
          'message': json.decode(response.body)['message'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Erreur: $e'};
    }
  }
  
  /// Obtenir un token valide (gère l'expiration auto)
  Future<String?> _getValidToken() async {
    if (_accessToken == null) return null;
    
    // Vérifier si expiré
    if (JwtDecoder.isExpired(_accessToken!)) {
      final success = await _refreshToken();
      return success ? _accessToken : null;
    }
    
    return _accessToken;
  }
  
  /// Démarrer la minuterie de rafraîchissement automatique
  void _startRefreshTimer() {
    _refreshTimer?.cancel();
    
    if (_accessToken == null) return;
    
    try {
      final decodedToken = JwtDecoder.decode(_accessToken!);
      final expiry = DateTime.fromMillisecondsSinceEpoch(
        decodedToken['exp'] * 1000,
      );
      
      // Rafraîchir 1 minute avant l'expiration
      final refreshTime = expiry.subtract(const Duration(minutes: 1));
      final delay = refreshTime.difference(DateTime.now());
      
      if (delay.isNegative) {
        _refreshToken();
      } else {
        _refreshTimer = Timer(delay, () {
          _refreshToken();
          _startRefreshTimer();
        });
      }
    } catch (e) {
      print('Erreur décodage token: $e');
    }
  }
  
  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
}
```

---

### Intégration dans l'Application

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final authService = AuthService();
  await authService.init();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authService),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Consumer<AuthService>(
        builder: (context, authService, child) {
          if (authService.isAuthenticated) {
            return const HomeScreen();
          } else {
            return const LoginScreen();
          }
        },
      ),
    );
  }
}
```

---

### Écran de Connexion

```dart
class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool isLoading = false;
  String? errorMessage;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      setState(() => errorMessage = 'Remplissez tous les champs');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    final result = await context.read<AuthService>().login(
      email: emailController.text,
      password: passwordController.text,
    );

    if (!mounted) return;

    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connexion réussie')),
      );
    } else {
      setState(() => errorMessage = result['message']);
    }

    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connexion')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              decoration: const InputDecoration(
                labelText: 'Mot de passe',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            if (errorMessage != null)
              Text(
                errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isLoading ? null : _handleLogin,
              child: isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Se Connecter'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### Interceptor HTTP (Gestion Automatique des Tokens)

```dart
import 'package:http/http.dart' as http;

class AuthenticatedHttpClient extends http.BaseClient {
  final AuthService authService;

  AuthenticatedHttpClient(this.authService);

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // Ajouter le token à chaque requête
    final token = await authService._getValidToken();
    
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    try {
      return await super.send(request);
    } catch (e) {
      // Gérer les erreurs de réseau
      rethrow;
    }
  }
}

// Utilisation
final httpClient = AuthenticatedHttpClient(authService);
final response = await httpClient.get(Uri.parse('$baseUrl/utilisateur/profil'));
```

---

## Bonnes Pratiques de Sécurité {#securite}

### 1. Stockage des Tokens
✅ **À FAIRE:**
- Utiliser `flutter_secure_storage` (Keychain iOS / Keystore Android)
- Chiffrer les données locales
- Supprimer les tokens à la déconnexion

❌ **À ÉVITER:**
- SharedPreferences (stockage en clair)
- Variables globales
- Logging des tokens

---

### 2. Transmission des Données
✅ **À FAIRE:**
- Toujours utiliser HTTPS
- Utiliser le header `Authorization: Bearer {token}`
- Valider les certificats SSL

❌ **À ÉVITER:**
- HTTP non chiffré
- Tokens en URL parameters
- Tokens en logs

---

### 3. Gestion des Mots de Passe
✅ **À FAIRE:**
- Valider avant envoi (format, longueur)
- Afficher les critères de sécurité
- Masquer le mot de passe lors de la saisie

❌ **À ÉVITER:**
- Stocker les mots de passe
- Logger les mots de passe
- Accepter des mots de passe faibles

---

### 4. Gestion des Sessions
✅ **À FAIRE:**
- Vérifier l'expiration régulièrement
- Rafraîchir automatiquement avant l'expiration
- Forcer la reconnexion si token invalide
- Déconnecter à la fermeture de l'app

❌ **À ÉVITER:**
- Ignorer l'expiration des tokens
- Conserver les tokens après fermeture
- Utiliser des tokens compromis

---

### 5. Gestion des Erreurs
✅ **À FAIRE:**
- Afficher des messages génériques ("Identifiants invalides")
- Logger les erreurs côté serveur
- Tracer les tentatives non autorisées

❌ **À ÉVITER:**
- Révéler si l'email existe
- Afficher le message d'erreur exact du serveur
- Logger les données sensibles

---

### 6. Validation des Données
✅ **À FAIRE:**
- Valider email avec regex standard
- Vérifier la longueur du mot de passe
- Nettoyer les entrées utilisateur

❌ **À ÉVITER:**
- Accepter n'importe quel input
- Faire confiance aux données du client
- Envoyer sans validation

---

## Flux Complet: Exemple Réel

### Scénario: Nouveau Passager s'Inscrit

**Jour 1 - Installation & Inscription**

```
1. Utilisateur télécharge l'app → main() appelle authService.init()
   ✓ Pas de token trouvé → Afficher LoginScreen

2. Utilisateur rentre: email="ahmed@example.com", password="SecurePass@2026"
   ✓ App valide le format email et la force du mot de passe

3. App envoie POST /auth/login
   ✓ Keycloak crée le compte (s'il n'existe pas)
   ✓ Backend crée utilisateur_role avec rôle "passager"
   ✓ Retour: access_token (15 min), refresh_token (7 jours)

4. App stocke tokens en flutter_secure_storage
   ✓ Démarre le _refreshTimer

5. App affiche HomeScreen (passager)
   ✓ Récupère le profil avec GET /utilisateur/profil
   ✓ Affiche les trajets disponibles
```

**Jour 2 - Utilisation Normale**

```
1. Utilisateur ouvre l'app
   ✓ main() → authService.init()
   ✓ Tokens trouvés en secure storage
   ✓ Access token pas expiré → HomeScreen

2. Après 14 minutes d'usage:
   ✓ _refreshTimer déclenche _refreshToken()
   ✓ POST /auth/refresh avec refresh_token
   ✓ Nouveaux tokens reçus, stockés
   ✓ App continue sans interruption (utilisateur ne voit rien)

3. À 7 jours:
   ✓ Refresh token expire
   ✓ Prochain _refreshToken() échoue
   ✓ logout() automatique
   ✓ Retour à LoginScreen
   ✓ Utilisateur se reconnecte
```

**Jour N - Déconnexion Manuelle**

```
1. Utilisateur clique "Déconnecter"
   ✓ POST /auth/logout avec access_token et refresh_token
   ✓ Backend blackliste les tokens (Redis)

2. Tokens supprimés de flutter_secure_storage
   ✓ _refreshTimer annulée
   ✓ _user = null

3. Affichage LoginScreen
```

**Si Token Expire Pendant Requête**

```
1. App envoie requête authentifiée avec token expiré
2. Backend retour 401 "Token expiré"
3. App intercepte l'erreur 401
4. App utilise refresh_token pour obtenir nouveau access_token
5. App relance la requête originale avec le nouveau token
```

---

## Checklist pour le Développeur Mobile

- [ ] Implémenter `AuthService` avec gestion automatique des tokens
- [ ] Utiliser `flutter_secure_storage` pour les tokens
- [ ] Implémenter `AuthenticatedHttpClient` pour injecter le token
- [ ] Créer `LoginScreen` et `RegisterScreen`
- [ ] Créer écrans spécifiques pour chaque rôle (Passager, Chauffeur, Propriétaire)
- [ ] Implémenter la gestion du refresh token automatique
- [ ] Tester le flux complet: inscription → connexion → déconnexion
- [ ] Tester l'expiration du token et le rafraîchissement automatique
- [ ] Implémenter la gestion des erreurs 401/403
- [ ] Tester sur réseau lent (simulateur réseau)
- [ ] Tester la sécurité (pas de tokens en logs)
- [ ] Implémenter Optional: SMS OTP (Phase 5)
- [ ] Implémenter Optional: TOTP 2FA (Phase 6)

---

## Support et Contact

Pour toute question sur l'intégration:
- **Email:** support@ndjigi.com
- **Documentation API Swagger:** `{BASE_URL}/api/v1/docs`
- **Repository Backend:** [GitHub](https://github.com/ndjigi/)

---

**Dernière mise à jour:** Juin 2026  
**Statut:** ✅ Production-Ready
