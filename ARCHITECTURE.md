# 🏗️ Architecture Système - Ndjigi

**Date:** 2026-05-31  
**Plateforme:** Système de gestion de mobilité (covoiturage, location de véhicules, gestion de parking)

---

## 📋 Table des matières
1. [Vue Globale](#vue-globale)
2. [Composants Principaux](#composants-principaux)
3. [Architecture d'Authentification avec Keycloak](#architecture-dauthentification-avec-keycloak)
4. [Architecture Technique Détaillée](#architecture-technique-détaillée)
5. [Flux de Données](#flux-de-données)
6. [Structure de la Base de Données](#structure-de-la-base-de-données)
7. [Services et APIs](#services-et-apis)
8. [Infrastructure et Déploiement](#infrastructure-et-déploiement)

---

## 🌍 Vue Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NDJIGI SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   WEB FRONTEND   │      │  MOBILE APP      │      │  ADMIN PANEL     │
│  (React/Vite)   │      │  (Flutter)       │      │  (Web)           │
│   Port: 3000    │      │                  │      │                  │
└────────┬─────────┘      └────────┬─────────┘      
         │                         │                    
         │ HTTPS/REST API          │ HTTPS/REST API         
         │                         │                         
         └─────────────┬───────────┴──────────────┬──
                       │                          │
                ┌──────▼──────────────────────────▼────────┐
                │  REVERSE PROXY / LOAD BALANCER (Nginx)   │
                │           Port: 80/443                    │
                └──────┬───────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌──────────────┐
   │KEYCLOAK │   │ BACKEND  │   │  REDIS       │
   │  SSO    │   │Express.js│   │  Cache       │
   │ 8080    │   │Port:8000 │   │  6379        │
   │         │   │          │   │              │
   │Auth +   │   │APIs &    │   │Sessions      │
   │Identity │   │Services  │   │Rate Limit    │
   └────┬────┘   └────┬─────┘   └──────────────┘
        ▲             │
        │             ▼
        │      ┌─────────────────┐
        │      │  POSTGRESQL     │
        │      │  Port: 5432     │
        └──────┤                 │
               │ ndjigi_db       │
               │ keycloak_db     │
               └─────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Third-Party Integrations)          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  SINETPAY        │  │  TWILIO          │  │  OPENSTREETMAP   │ │
│  │  Payment Gateway │  │  SMS/OTP Service │  │  Maps & Location │ │
│  │                  │  │                  │  │                  │ │
│  │ Mobile Money     │  │ OTP Verification │  │ Routing & Geo    │ │
│  │ Card Payments    │  │ Notifications    │  │ Real-time Tracking│ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Composants Principaux

### 1. **Frontend (React + Vite)**
- **Port:** 3000
- **Framework:** React 18+
- **Build Tool:** Vite
- **Responsabilités:**
  - Interface utilisateur pour passagers, chauffeurs, propriétaires
  - Gestion du profil utilisateur
  - Consultation des trajets/locations
  - Support client et tickets
  - Intégration Keycloak (login/logout)

### 2. **Backend (Node.js + Express)**
- **Port:** 8000
- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Responsabilités:**
  - APIs RESTful
  - Logique métier
  - Gestion des utilisateurs et rôles
  - Gestion des véhicules, trajets, locations
  - Gestion des paiements
  - Support client et remboursements
  - Intégration Keycloak Admin API

### 3. **Keycloak (Identity & Access Management)**
- **Port:** 8080
- **Rôle:** Server SSO (Single Sign-On)
- **Database:** PostgreSQL (base keycloak_db)
- **Responsabilités:**
  - Authentification utilisateurs
  - Gestion des rôles et permissions
  - Emission de JWT tokens
  - Validation des tokens
  - Audit des accès
  - Password reset & recovery
  - Support du 2FA

### 4. **Base de Données PostgreSQL**
- **Port:** 5432
- **Databases:**
  - `ndjigi_db` - Données applicatives
  - `keycloak_db` - Données Keycloak
- **Tables:** 40+ tables organisées par domaine

### 5. **Cache Redis**
- **Port:** 6379
- **Responsabilités:**
  - Sessions utilisateur
  - Rate limiting
  - Cache applicatif
  - Données temporaires (OTP, tokens de réinitialisation)

---

## 🔐 Architecture d'Authentification avec Keycloak

### Qu'est-ce que Keycloak?

**Keycloak** est un serveur d'authentification et d'autorisation open-source basé sur **OpenID Connect** et **SAML**. Il fournit:
- ✅ Gestion centralisée des utilisateurs
- ✅ Authentification SSO (Single Sign-On)
- ✅ Gestion des rôles et permissions
- ✅ Émission de tokens JWT sécurisés
- ✅ Audit et logs des accès

### Configuration Keycloak dans Ndjigi

```yaml
# Variables d'environnement (docker-compose.yml)
KEYCLOAK_URL: http://keycloak:8080
KEYCLOAK_REALM: ndjigi              # Realm (tenant logique)
KEYCLOAK_CLIENT_ID: ndjigi-backend  # Client confidentiel
KEYCLOAK_CLIENT_SECRET: W4HZH...    # Secret partagé
```

### Architecture de Sécurité

#### A. **Tokens JWT**

Keycloak émet deux types de tokens:

```
┌────────────────────────────────────────────────────────────────┐
│                    TOKEN KEYCLOAK (JWT)                        │
├────────────────────────────────────────────────────────────────┤
│ Header:                                                        │
│   {                                                            │
│     "alg": "RS256",      ← Algorithme RSA asymétrique         │
│     "typ": "JWT",                                              │
│     "kid": "abc123"     ← Key ID pour validation JWKS         │
│   }                                                            │
├────────────────────────────────────────────────────────────────┤
│ Payload (Claims):                                              │
│   {                                                            │
│     "sub": "user-uuid",                 ← User ID unique       │
│     "email": "user@example.com",                               │
│     "given_name": "Jean",                                      │
│     "family_name": "Dupont",                                   │
│     "realm_access": {                                          │
│       "roles": ["ndjigi-admin", "ndjigi-driver"]              │
│     },                                                         │
│     "exp": 1717166400,  ← Expiration (15 min par défaut)      │
│     "iat": 1717165500,  ← Émis à                              │
│     "iss": "http://keycloak:8080/realms/ndjigi"              │
│   }                                                            │
├────────────────────────────────────────────────────────────────┤
│ Signature:                                                     │
│   RSASHA256(                                                   │
│     base64UrlEncode(header) + "." + base64UrlEncode(payload), │
│     PRIVATE_KEY                                                │
│   )                                                            │
└────────────────────────────────────────────────────────────────┘
```

#### B. **Flux d'Authentification (OpenID Connect)**

```
┌──────────────┐              ┌────────────┐              ┌──────────────┐
│   Frontend   │              │  Backend   │              │  Keycloak    │
│  (Browser)  │              │ (Express)  │              │  (SSO)       │
└──────┬───────┘              └────────┬───┘              └───────┬──────┘
       │                              │                          │
       │ 1. Utilisateur clique "Login"│                          │
       ├─────────────────────────────►│                          │
       │                              │                          │
       │                              │ 2. Redirect vers Keycloak│
       │ 3. Redirect                  │    /auth/realms/ndjigi   │
       │◄──────────────────────────────┤    /protocol/openid-    │
       │    Keycloak Login Page        │    connect/auth         │
       │                              │                          │
       │ 4. Saisit email + password   │                          │
       ├─────────────────────────────────────────────────────────►│
       │                              │                          │
       │                              │ 5. Valide credentials    │
       │                              │◄───────────────────────┤
       │                              │                          │
       │ 6. Redirect avec code        │                          │
       │    (authorization code)      │                          │
       │◄─────────────────────────────┤                          │
       │                              │                          │
       │ 7. Frontend envoie code      │                          │
       │    au backend                │                          │
       ├─────────────────────────────►│                          │
       │   POST /auth/callback        │                          │
       │   ?code=abc123&state=xyz     │                          │
       │                              │                          │
       │                              │ 8. Backend échange code │
       │                              │    contre tokens        │
       │                              ├─────────────────────────►│
       │                              │  POST /token            │
       │                              │  grant_type=auth_code   │
       │                              │  code=abc123            │
       │                              │  client_id=ndjigi-...   │
       │                              │  client_secret=***      │
       │                              │◄─────────────────────────
       │                              │  {                      │
       │                              │    access_token: JWT    │
       │                              │    refresh_token        │
       │                              │    expires_in: 900      │
       │                              │  }                      │
       │                              │                          │
       │ 9. Backend envoie tokens     │                          │
       │    au frontend (cookies)     │                          │
       │◄─────────────────────────────┤                          │
       │                              │                          │
       │ 10. Frontend stocke token    │                          │
       │     dans localStorage/       │                          │
       │     sessionStorage           │                          │
       │                              │                          │
```

#### C. **Validation des Tokens (JWKS)**

```
┌──────────────┐              ┌────────────┐              ┌──────────────┐
│   Frontend   │              │  Backend   │              │  Keycloak    │
│              │              │ (Express)  │              │  (SSO)       │
└──────┬───────┘              └────────┬───┘              └───────┬──────┘
       │                              │                          │
       │ 1. Appel API protégé         │                          │
       │    avec token en header      │                          │
       ├─────────────────────────────►│                          │
       │    Authorization: Bearer X   │                          │
       │                              │                          │
       │                              │ 2. JWKS Client cache    │
       │                              │    les clés publiques   │
       │                              │    depuis :             │
       │                              ├─────────────────────────►│
       │                              │ GET /realms/ndjigi/     │
       │                              │     protocol/openid-    │
       │                              │     connect/certs       │
       │                              │◄─────────────────────────
       │                              │ {                       │
       │                              │   "keys": [             │
       │                              │     {                   │
       │                              │       "kid": "abc123"   │
       │                              │       "n": "...",       │
       │                              │       "e": "AQAB"       │
       │                              │     }                   │
       │                              │   ]                     │
       │                              │ }                       │
       │                              │                          │
       │                              │ 3. Validation du token: │
       │                              │    - Vérifie signature  │
       │                              │      avec clé publique  │
       │                              │    - Vérifie expiration │
       │                              │    - Vérifie issuer     │
       │                              │                          │
       │ 4. Si valide, attache user  │                          │
       │    à req.user et exécute    │                          │
       │    le middleware suivant    │                          │
       │                              │                          │
```

### Code d'Authentification

#### 1. **Middleware de Validation (keycloakAuth.js)**

```javascript
// Flux du middleware keycloakAuth:

const keycloakAuth = async (req, res, next) => {
  // 1. Extraire Bearer token du header
  const token = req.headers.authorization.split(' ')[1];
  
  // 2. Valider le token via JWKS
  const decoded = await verifyKeycloakToken(token);
  
  // 3. Auto-provisioning: créer utilisateur si inexistant
  let user = await prisma.utilisateur.findUnique({
    where: { keycloak_id: decoded.sub }
  });
  
  if (!user) {
    user = await prisma.utilisateur.create({
      data: {
        keycloak_id: decoded.sub,
        email: decoded.email,
        prenom: decoded.given_name,
        nom: decoded.family_name,
        auth_provider: 'keycloak',
        utilisateur_role: {
          create: { role: 'passager' }
        }
      }
    });
  }
  
  // 4. Synchroniser les rôles depuis le token
  const keycloakRoles = decoded.realm_access.roles;
  const localRoles = keycloakRoles.map(kcRole => getLocalRole(kcRole));
  
  // 5. Attacher l'utilisateur à la requête
  req.user = {
    id_utilisateur: user.id_utilisateur,
    email: user.email,
    roles: localRoles,
    token: token  // Pour appels Admin API
  };
  
  next();
};
```

#### 2. **Validation des Tokens (keycloak.js)**

```javascript
// src/config/keycloak.js

async function verifyKeycloakToken(token) {
  // 1. Décoder sans vérifier (pour extraire le kid du header)
  const decoded = jwt.decode(token, { complete: true });
  const { header, payload } = decoded;
  
  // 2. Récupérer la clé publique via JWKS
  const key = await getJwksClient().getSigningKey(header.kid);
  const publicKey = key.getPublicKey();
  
  // 3. Vérifier la signature et les claims
  const verified = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
  });
  
  return verified;
}
```

### Mapping des Rôles

```
Rôles Keycloak (realm)     →  Rôles Locaux (base de données)
─────────────────────────────────────────────────────────────
ndjigi-admin              →  admin
ndjigi-manager            →  gestionnaire
ndjigi-support            →  support
ndjigi-driver             →  chauffeur
ndjigi-owner              →  proprietaire
ndjigi-passenger          →  passager
(pas de préfixe/unknown)  →  null (rejeté)
```

### Sécurité des Tokens

| Aspect | Configuration | Notes |
|--------|--------------|-------|
| **Algorithme** | RS256 | Asymétrique (Keycloak signe avec PRIVATE_KEY) |
| **Durée** | 15 minutes (access token) | Refresh token: 7 jours |
| **Clés** | Rotation automatique | Keycloak gère les clés RSA |
| **Signature** | Vérifiée via JWKS | Endpoint: /realms/{realm}/protocol/openid-connect/certs |
| **Stockage** | SessionStorage (frontend) | Jamais dans localStorage (XSS) |
| **Transmission** | Bearer header HTTPS only | Pas en cookies simples |

---

## 🏛️ Architecture Technique Détaillée

### Couches Applicatives

```
┌─────────────────────────────────────────────────┐
│           CLIENT LAYER (React)                  │
│  - UI Components                                │
│  - State Management                             │
│  - Keycloak Integration                         │
└────────────┬────────────────────────────────────┘
             │ REST API (HTTP/HTTPS)
┌────────────▼────────────────────────────────────┐
│        API GATEWAY / ROUTING LAYER              │
│  - Express.js Router                            │
│  - Path-based Routing                           │
│  - Middleware Chain                             │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│       MIDDLEWARE LAYER                          │
│  ├─ Authentication (keycloakAuth)               │
│  ├─ Authorization (authorize)                   │
│  ├─ Validation (express-validator)              │
│  ├─ Rate Limiting (express-rate-limit)          │
│  ├─ CORS & Security (helmet)                    │
│  └─ Logging (requestLogger)                     │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      CONTROLLER LAYER                           │
│  - Request Handler                              │
│  - Response Formatting                          │
│  - Error Handling                               │
│  Routes:                                        │
│  ├─ /api/auth/*                                │
│  ├─ /api/users/*                               │
│  ├─ /api/vehicles/*                            │
│  ├─ /api/trips/*                               │
│  ├─ /api/payments/*                            │
│  ├─ /api/support/*                             │
│  └─ /api/parking/*                             │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│       SERVICE LAYER                             │
│  - Business Logic                               │
│  ├─ UserService                                 │
│  ├─ VehicleService                              │
│  ├─ TripService                                 │
│  ├─ PaymentService                              │
│  ├─ KeycloakService (Admin API)                │
│  ├─ UserProvisioningService                     │
│  └─ SupportService                              │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      REPOSITORY LAYER (Prisma ORM)              │
│  - Database Abstraction                         │
│  - Query Building                               │
│  - Type Safety                                  │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│       PERSISTENCE LAYER                         │
│  ├─ PostgreSQL (Utilisateurs, Véhicules, etc.) │
│  ├─ Redis (Cache, Sessions, Rate Limit)        │
│  └─ Keycloak DB (Auth)                         │
└─────────────────────────────────────────────────┘
```

### Flux d'une Requête Protégée

```
Requête HTTP
   │
   ▼
Express Router (POST /api/vehicles)
   │
   ▼
keycloakAuth Middleware
   ├─ Extraire token du header
   ├─ Valider via JWKS
   └─ Auto-provisioning & Attacher req.user
   │
   ▼
authorize Middleware (check roles)
   ├─ Vérifier si user a le rôle requis
   └─ Rejeter ou continuer
   │
   ▼
express-validator Middleware
   ├─ Valider body/query parameters
   └─ Rejeter si invalide
   │
   ▼
VehicleController.createVehicle()
   ├─ Extraire données de req.body
   ├─ Appeler VehicleService.create()
   └─ Formater la réponse
   │
   ▼
VehicleService.create()
   ├─ Valider métier (ex: propriétaire existe?)
   ├─ Appeler prisma.vehicule.create()
   └─ Retourner le résultat
   │
   ▼
Prisma (ORM)
   ├─ Construire query SQL
   └─ Exécuter sur PostgreSQL
   │
   ▼
PostgreSQL
   ├─ Insérer données
   └─ Retourner nouvel objet
   │
   ▼
Réponse JSON au client
```

---

## 📊 Flux de Données

### Scénario: Inscription d'un Nouvel Utilisateur

```
┌─ FRONTEND ─────────────────────────────────────────────────┐
│  User: Email + Password                                   │
│  ├─ Remplir formulaire d'inscription                       │
│  └─ POST /api/auth/register                               │
└──────────────┬──────────────────────────────────────────────┘
               │ { email, password, nom, prenom }
               ▼
┌─ BACKEND ─────────────────────────────────────────────────┐
│  authController.register()                                │
│  ├─ Valider input (email, password strength)              │
│  ├─ Appeler KeycloakService.createUser()                  │
│  │  └─ Admin API: POST /admin/realms/ndjigi/users        │
│  │     Retourne: { keycloak_id }                         │
│  │                                                       │
│  ├─ Créer utilisateur en base de données                 │
│  │  prisma.utilisateur.create({                          │
│  │    keycloak_id,                                       │
│  │    email,                                             │
│  │    nom,                                               │
│  │    prenom,                                            │
│  │    utilisateur_role: {                                │
│  │      create: { role: 'passager' }  ← Rôle par défaut │
│  │    }                                                  │
│  │  })                                                   │
│  │                                                       │
│  ├─ Créer portefeuille utilisateur                       │
│  │  prisma.portefeuille.create({ solde: 0 })           │
│  │                                                       │
│  ├─ Envoyer email de confirmation                        │
│  │  (nodemailer)                                         │
│  │                                                       │
│  └─ Retourner { success: true, user_id }                │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─ KEYCLOAK ────────────────────────────────────────────────┐
│  Utilisateur créé dans le realm 'ndjigi'                 │
│  ├─ ID généré: {keycloak_id}                             │
│  ├─ Attributs: email, firstName, lastName                │
│  ├─ Rôle assigné: ndjigi-passenger                       │
│  └─ Statut: Actif                                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─ DATABASE ────────────────────────────────────────────────┐
│  Tables mises à jour:                                    │
│  ├─ utilisateur { id_utilisateur, keycloak_id, ... }     │
│  ├─ utilisateur_role { id_utilisateur, role='passager' } │
│  ├─ portefeuille { id_portefeuille, solde=0 }            │
│  └─ auth_log { event='USER_CREATED', user_id, ... }      │
└────────────────────────────────────────────────────────────┘
```

### Scénario: Authentification d'un Utilisateur Existant

```
┌─ FRONTEND ─────────────────────────────────────────────────┐
│  1. User: Email + Password                                │
│  2. POST /api/auth/login                                  │
└──────────────┬──────────────────────────────────────────────┘
               │ { email, password }
               ▼
┌─ BACKEND ─────────────────────────────────────────────────┐
│  authController.login()                                   │
│  ├─ Valider input                                         │
│  ├─ Appeler KeycloakService.login(email, password)        │
│  │  └─ Keycloak Token Endpoint                            │
│  │     grant_type=password (Direct Access Grant)          │
│  │     Retourne: { access_token, refresh_token, exp }    │
│  │                                                       │
│  ├─ Décoder access_token (sans vérifier)                  │
│  ├─ Récupérer utilisateur from DB by keycloak_id        │
│  │                                                       │
│  ├─ Créer session Redis                                  │
│  │  SET session:{session_id} { user_id, timestamp }      │
│  │                                                       │
│  └─ Retourner:                                           │
│     {                                                    │
│       access_token: JWT,  ← Envoyé au frontend           │
│       refresh_token,      ← Stocké sécurisé              │
│       user: { id, email, roles }                         │
│     }                                                    │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─ FRONTEND ────────────────────────────────────────────────┐
│  ├─ Stocker access_token en sessionStorage                │
│  ├─ Stocker refresh_token en HttpOnly cookie             │
│  ├─ Rediriger vers dashboard                             │
│  └─ Inclure token dans header Authorization pour appels API│
│     Authorization: Bearer {access_token}                 │
└────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Structure de la Base de Données

### Vue d'Ensemble - Domaines Métier

```
UTILISATEURS & AUTH          DOMAINE VÉHICULE              DOMAINE LOCATION
├─ utilisateur               ├─ vehicule                   ├─ location
├─ utilisateur_role          ├─ categorie_vehicule         ├─ detail_trajet_passager
├─ password_reset_token      ├─ vehicule_course            └─ affectation_vehicule
├─ chauffeur                 ├─ vehicule_location
├─ passager                  ├─ zone_tarifaire
├─ proprietaire              └─ tarif_categorie_zone
├─ auth_log
├─ provisioning_incidents
└─ portefeuille              DOMAINE PARKEUR              DOMAINE SUPPORT
                             ├─ parking                   ├─ ticket
AUTRES                       ├─ gestionnaire_parking      ├─ remboursement
├─ avis                      ├─ journal_parking           ├─ conversation
├─ notification              ├─ maintenance               ├─ conversation_participant
├─ document                  └─ maintenance_step          └─ message
├─ paiement
├─ mouvement_portefeuille
├─ mouvement_photo
├─ code_promo
├─ utilisation_promo
├─ reservation
├─ incident_securite
├─ tracking_vehicule
├─ trajet
├─ moyens_paiement
└─ conversation
```

### Schéma Utilisateurs & Authentification

```sql
-- Utilisateurs (source de vérité pour identification)
utilisateur {
  id_utilisateur: UUID PK
  keycloak_id: UUID UNIQUE  ← Lien avec Keycloak SSO
  email: VARCHAR UNIQUE     ← Email depuis Keycloak
  numero_telephone: VARCHAR UNIQUE
  nom: VARCHAR              ← Depuis Keycloak
  prenom: VARCHAR           ← Depuis Keycloak
  auth_provider: VARCHAR    ← 'keycloak' ou 'email'
  statut_compte: ENUM       ← actif|inactif|suspendu
  date_inscription: TIMESTAMP
  supprime_le: TIMESTAMP    ← Soft delete
}

-- Rôles d'utilisateur (locaux = source de vérité métier)
utilisateur_role {
  id_utilisateur: UUID FK
  role: VARCHAR             ← 'admin', 'gestionnaire', 'chauffeur', 'passager', 'proprietaire'
  actif: BOOLEAN
  date_activation: TIMESTAMP
  date_desactivation: TIMESTAMP
  PK: (id_utilisateur, role)
}

-- Spécialisation: Chauffeur
chauffeur {
  id_chauffeur: UUID FK
  statut_validation: ENUM   ← en_attente|valide|refuse|suspendu
  type_service: ENUM        ← covoiturage|course_plein_temps
  statut_disponibilite: ENUM ← en_ligne|hors_ligne|en_course
  note_chauffeur: DECIMAL
  nb_courses_effectuees: INT
  solde_commission_du: DECIMAL
  numero_permis: VARCHAR
  date_expiration_permis: DATE
}

-- Spécialisation: Passager
passager {
  id_passager: UUID FK
  note_passager: DECIMAL
  adresses_favorites: JSON
  nb_courses_effectuees: INT
}

-- Spécialisation: Propriétaire de véhicules
proprietaire {
  id_proprietaire: UUID FK
  statut_validation: ENUM
  note_proprietaire: DECIMAL
  nb_locations_effectuees: INT
}

-- Tokens de réinitialisation de mot de passe
password_reset_token {
  id: UUID PK
  token_hash: VARCHAR UNIQUE
  id_utilisateur: UUID FK
  keycloak_id: UUID
  expires_at: TIMESTAMP
  used_at: TIMESTAMP
}

-- Portefeuille utilisateur
portefeuille {
  id_portefeuille: UUID PK
  id_utilisateur: UUID FK UNIQUE
  solde: DECIMAL            ← Solde disponible
  dette_commission: DECIMAL ← Dettes envers plateforme
  devise: CHAR(3)           ← XOF (franc CFA)
}

-- Logs d'authentification
auth_log {
  id: UUID PK
  user_id: UUID FK
  event_type: VARCHAR       ← LOGIN|LOGOUT|TOKEN_REFRESH|FAILED_AUTH
  channel: VARCHAR          ← web|mobile
  ip_address: VARCHAR
  created_at: TIMESTAMP
}
```

### Schéma Véhicules

```sql
-- Supertype: Tous les véhicules
vehicule {
  id_vehicule: UUID PK
  id_proprietaire: UUID FK  ← Propriétaire du véhicule
  id_parking: UUID FK       ← Parking actuel (optionnel)
  id_categorie: UUID FK     ← Économique|Confort|Premium
  immatriculation: VARCHAR UNIQUE
  marque: VARCHAR
  modele: VARCHAR
  annee: SMALLINT
  nb_places: SMALLINT
  couleur: VARCHAR
  statut: ENUM              ← disponible|en_course|en_location|maintenance|retire
  climatisation: BOOLEAN
  gps_actif: BOOLEAN
  latitude_actuelle: DECIMAL
  longitude_actuelle: DECIMAL
  fonds_genere: DECIMAL     ← Revenus totaux générés
}

-- Véhicule de course (Ride-sharing)
vehicule_course {
  id_vehicule: UUID FK PK
  type_service: VARCHAR     ← standard|premium
}

-- Véhicule de location
vehicule_location {
  id_vehicule: UUID FK PK
}

-- Affectation d'un véhicule de course à un chauffeur
affectation_vehicule {
  id_affectation: UUID PK
  id_vehicule: UUID FK      ← Unique si est_active=true
  id_chauffeur: UUID FK
  date_debut: TIMESTAMP
  date_fin: TIMESTAMP       ← NULL si toujours actif
  est_active: BOOLEAN       ← true = affectation actuelle
  motif_fin: VARCHAR        ← Raison du retrait
}

-- Catégories de véhicules
categorie_vehicule {
  id_categorie: UUID PK
  nom: ENUM                 ← Economique|Confort|Premium
  description: VARCHAR
  actif: BOOLEAN
}

-- Zones tarifaires
zone_tarifaire {
  id_zone: UUID PK
  nom: VARCHAR
  coefficient_max: DECIMAL  ← Multiplicateur prix max
  vitesse_moyenne_kmh: INT
  actif: BOOLEAN
}

-- Tarifs par zone et catégorie
tarif_categorie_zone {
  id_zone: UUID FK
  id_categorie: UUID FK
  tarif_base: DECIMAL       ← Base fixe (ex: 500 XOF)
  tarif_km: DECIMAL         ← Par km (ex: 100 XOF/km)
  tarif_minute: DECIMAL     ← Par minute d'attente
  actif: BOOLEAN
  PK: (id_zone, id_categorie)
}
```

### Schéma Trajets & Locations

```sql
-- Trajets (courses/covoiturage)
trajet {
  id_trajet: UUID PK
  id_affectation: UUID FK   ← Quel véhicule/chauffeur
  id_zone: UUID FK          ← Zone tarifaire applicable
  adresse_depart: VARCHAR
  adresse_arrivee: VARCHAR
  coordonnees_depart: JSON  ← { lat, lng }
  coordonnees_arrivee: JSON ← { lat, lng }
  polyline_trajet: VARCHAR  ← Google Maps encoded polyline
  distance_km: DECIMAL
  duree_estimee_min: INT
  date_heure_debut: TIMESTAMP
  date_heure_fin: TIMESTAMP
  statut: ENUM              ← en_attente|en_cours|termine|annule
  tarif_final: DECIMAL      ← Montant facturé
  type_trajet: VARCHAR
}

-- Passagers d'un trajet
detail_trajet_passager {
  id_trajet: UUID FK
  id_passager: UUID FK
  prix_paye: DECIMAL        ← Prix payé par ce passager
  nb_places_reservees: INT
  date_embarquement: TIMESTAMP
  PK: (id_trajet, id_passager)
}

-- Réservations de trajets
reservation {
  id_reservation: UUID PK
  id_passager: UUID FK
  id_trajet: UUID FK
  date_reservation: TIMESTAMP
  date_trajet_souhaite: TIMESTAMP
  statut: VARCHAR           ← en_attente|confirmee|refusee|annulee
  rappel_24h_envoye: BOOLEAN
  rappel_1h_envoye: BOOLEAN
}

-- Locations de véhicule
location {
  id_location: UUID PK
  id_vehicule: UUID FK      ← Véhicule loué
  id_passager: UUID FK      ← Locataire
  date_debut: TIMESTAMP
  date_fin: TIMESTAMP
  montant_total: DECIMAL
  statut: VARCHAR           ← en_attente|en_cours|termine
}

-- Avis (évaluations)
avis {
  id_avis: UUID PK
  id_evaluateur: UUID FK    ← Qui évalue
  id_evalue: UUID FK        ← Qui est évalué
  id_trajet: UUID FK        ← De quel trajet
  id_location: UUID FK      ← Ou quelle location
  note: SMALLINT            ← 1-5
  commentaire: VARCHAR
}
```

### Schéma Parking

```sql
-- Parking
parking {
  id_parking: UUID PK
  nom: VARCHAR
  adresse: VARCHAR
  latitude: DECIMAL
  longitude: DECIMAL
  capacite_totale: INT
  capacite_occupee: INT     ← Nombre de véhicules actuels
  horaires: VARCHAR         ← "Lun-Dim 06h-22h"
  ville: VARCHAR
}

-- Gestionnaire de parking
gestionnaire_parking {
  id_gestionnaire: UUID FK  ← Utilisateur avec rôle 'gestionnaire'
  id_parking: UUID FK
  date_prise_poste: DATE
  PK: (id_gestionnaire, id_parking)
}

-- Journal des mouvements de parking
journal_parking {
  id_log: UUID PK
  id_vehicule: UUID FK
  id_parking: UUID FK
  id_utilisateur: UUID FK   ← Gestionnaire qui a enregistré
  type_mouvement: ENUM      ← entree|sortie|reprise|maintenance
  etat_vehicule: ENUM       ← bon_etat|besoin_maintenance|...
  besoin_maintenance: BOOLEAN
  commentaire: TEXT
  date_mouvement: TIMESTAMP
}

-- Photos de mouvements de parking
mouvement_photo {
  id_photo: UUID PK
  id_mouvement: UUID FK     ← Lien vers journal_parking
  id_maintenance: UUID FK   ← Ou maintenance
  filename: VARCHAR
  fileKey: VARCHAR          ← S3 key: YYYY-MM/userId/uuid.ext
  filepath: VARCHAR
  mimeType: VARCHAR
  fileSize: BIGINT
  uploadedAt: TIMESTAMP
}

-- Maintenance de véhicules
maintenance {
  id_maintenance: UUID PK
  id_vehicule: UUID FK
  id_parking: UUID FK
  id_gestionnaire: UUID FK  ← Gestionnaire assigné
  type: ENUM                ← mecanique|electricite|carrosserie
  urgence: ENUM             ← basse|normale|haute
  statut: ENUM              ← en_attente|confirmee|en_reparation|terminee
  description: TEXT
  date_creation: TIMESTAMP
  date_resolution: TIMESTAMP
}

-- Historique des changements de maintenance
maintenance_step {
  id_step: UUID PK
  id_maintenance: UUID FK
  statut_ancien: ENUM       ← Ancien statut
  statut_nouveau: ENUM      ← Nouveau statut
  commentaire: TEXT
  date_transition: TIMESTAMP
}
```

### Schéma Support Client

```sql
-- Tickets support
ticket {
  id_ticket: UUID PK
  id_utilisateur: UUID FK   ← Auteur du ticket
  id_agent: UUID FK         ← Agent support assigné
  id_trajet: UUID FK        ← Ticket pour quel trajet
  id_paiement: UUID FK      ← Ticket pour quel paiement
  sujet: VARCHAR
  description: TEXT
  statut: VARCHAR           ← ouvert|en_cours|ferme|resolu
  priorite: VARCHAR         ← basse|normale|haute|urgente
  eligible_remboursement: BOOLEAN
  note_interne: TEXT        ← Notes agents seulement
  date_creation: TIMESTAMP
  date_resolution: TIMESTAMP
}

-- Remboursements
remboursement {
  id_remboursement: UUID PK
  id_ticket: UUID FK
  id_utilisateur: UUID FK
  id_agent: UUID FK         ← Agent qui a traité
  montant: DECIMAL
  motif: VARCHAR
  statut: VARCHAR           ← en_attente|approuve|rejete|rembourse
  id_idempotence: UUID      ← Pour éviter doublons
  date_demande: TIMESTAMP
  date_traitement: TIMESTAMP
}

-- Conversations (tickets, trajets, locations)
conversation {
  id_conversation: UUID PK
  id_trajet: UUID FK        ← Lié à trajet
  id_location: UUID FK      ← Ou location
  id_ticket: UUID FK        ← Ou ticket
  createdAt: TIMESTAMP
}

-- Participants à une conversation
conversation_participant {
  id_conversation: UUID FK
  id_utilisateur: UUID FK
  PK: (id_conversation, id_utilisateur)
}

-- Messages dans une conversation
message {
  id_message: UUID PK
  id_conversation: UUID FK
  id_expediteur: UUID FK
  nom_expediteur: VARCHAR
  contenu: TEXT
  lu: BOOLEAN
  date_envoi: TIMESTAMP
  date_lecture: TIMESTAMP
}

-- Notifications
notification {
  id_notification: UUID PK
  id_utilisateur: UUID FK
  type: VARCHAR             ← TICKET_UPDATE|TRIP_STARTED|PAYMENT_SUCCESS
  titre: VARCHAR
  contenu: TEXT
  lu: BOOLEAN
  id_objet_lie: UUID        ← ID du trajet/ticket/paiement
  date_creation: TIMESTAMP
  date_lecture: TIMESTAMP
}
```

### Schéma Paiements

```sql
-- Moyens de paiement
moyens_paiement {
  id_moyen_paiement: UUID PK
  type: ENUM                ← CARTE_BANCAIRE|MOBILE_MONEY|PORTEFEUILLE
  details: JSON             ← { cardNumber, provider, ... }
  actif: BOOLEAN
  date_ajout: TIMESTAMP
  date_desactivation: TIMESTAMP
}

-- Paiements
paiement {
  id_paiement: UUID PK
  id_utilisateur: UUID FK
  id_moyen_paiement: UUID FK
  montant: DECIMAL
  methode: VARCHAR          ← Type de paiement
  statut: VARCHAR           ← en_attente|confirmee|echec|rembourse
  reference_transaction: VARCHAR UNIQUE
  type: VARCHAR             ← TRAJET|LOCATION|COMMISSION|OTHER
  id_objet_lie: UUID        ← ID du trajet/location
  date_paiement: TIMESTAMP
}

-- Mouvements de portefeuille
mouvement_portefeuille {
  id_mouvement: UUID PK
  id_portefeuille: UUID FK
  id_objet_lie: UUID        ← ID du paiement/trajet
  type_operation: VARCHAR   ← DEPOT|RETRAIT|COMMISSION|REMBOURSEMENT
  montant: DECIMAL
  sens: VARCHAR             ← DEBIT|CREDIT
  solde_apres: DECIMAL      ← Solde après opération
  date_operation: TIMESTAMP
}

-- Codes promotionnels
code_promo {
  id_promo: UUID PK
  code: VARCHAR UNIQUE
  type_reduction: ENUM      ← fixe|pourcentage
  valeur: DECIMAL           ← Montant ou %
  date_debut: TIMESTAMP
  date_fin: TIMESTAMP
  nb_utilisations_max: INT
  nb_utilisations_actuel: INT
  actif: BOOLEAN
}

-- Utilisation des codes promo
utilisation_promo {
  id_utilisateur: UUID FK
  id_promo: UUID FK
  id_trajet: UUID FK
  date_utilisation: TIMESTAMP
  PK: (id_utilisateur, id_promo)
}
```

---

## 🔗 Services et APIs

### Principaux Endpoints API

#### Authentification
```
POST   /api/auth/register          - Créer un compte (Keycloak + BDD)
POST   /api/auth/login             - Login email/password via Keycloak
POST   /api/auth/logout            - Déconnexion
POST   /api/auth/refresh           - Rafraîchir access_token
POST   /api/auth/reset-password    - Demander reset password
POST   /api/auth/update-password   - Mettre à jour mot de passe

POST   /api/auth/keycloak/callback - Callback OAuth (code exchange)
```

#### Utilisateurs
```
GET    /api/users/profile          - Récupérer profil utilisateur (auth required)
PUT    /api/users/profile          - Mettre à jour profil
GET    /api/users/{id}             - Récupérer info utilisateur
PUT    /api/users/{id}/avatar      - Upload photo profil
GET    /api/users/{id}/documents   - Documents utilisateur
```

#### Véhicules (Propriétaires)
```
POST   /api/vehicles               - Créer un véhicule (proprietaire role)
GET    /api/vehicles               - Lister mes véhicules
GET    /api/vehicles/{id}          - Détails véhicule
PUT    /api/vehicles/{id}          - Modifier véhicule
DELETE /api/vehicles/{id}          - Supprimer véhicule
GET    /api/vehicles/{id}/tracking - GPS du véhicule en temps réel
```

#### Trajets (Chauffeurs & Passagers)
```
POST   /api/trips                  - Créer/proposer un trajet (chauffeur)
GET    /api/trips                  - Lister trajets
GET    /api/trips/{id}             - Détails trajet
PUT    /api/trips/{id}             - Modifier trajet
POST   /api/trips/{id}/start       - Démarrer un trajet (chauffeur)
POST   /api/trips/{id}/end         - Terminer trajet
POST   /api/trips/{id}/reserve     - Réserver place (passager)
POST   /api/trips/{id}/cancel      - Annuler trajet
```

#### Locations
```
POST   /api/rentals                - Créer location (proprietaire)
GET    /api/rentals                - Lister locations
GET    /api/rentals/{id}           - Détails location
POST   /api/rentals/{id}/start     - Démarrer location
POST   /api/rentals/{id}/end       - Terminer location
```

#### Parking
```
GET    /api/parkings               - Lister parkings
GET    /api/parkings/{id}          - Détails parking (capacité, etc.)
POST   /api/parkings/{id}/checkin  - Enregistrer entrée véhicule
POST   /api/parkings/{id}/checkout - Enregistrer sortie véhicule
POST   /api/parkings/{id}/maintain - Signaler maintenance
```

#### Support Client
```
POST   /api/tickets                - Créer ticket support
GET    /api/tickets                - Lister mes tickets
GET    /api/tickets/{id}           - Détails ticket
POST   /api/tickets/{id}/message   - Ajouter message à ticket
POST   /api/tickets/{id}/close     - Fermer ticket

POST   /api/refunds                - Demander remboursement
GET    /api/refunds/{id}           - Statut remboursement
```

#### Admin (rôle admin)
```
GET    /api/admin/users            - Lister tous utilisateurs
GET    /api/admin/stats            - Statistiques plateforme
POST   /api/admin/users/{id}/role  - Assigner rôle
POST   /api/admin/vehicles         - Approuver véhicule
POST   /api/admin/parking          - Gérer parkings
```

### Services Principaux

#### 1. **UserService**
- `createUser(email, password)` - Créer utilisateur Keycloak + BDD
- `getUserProfile(userId)` - Récupérer profil
- `updateProfile(userId, data)` - Mettre à jour profil
- `assignRole(userId, role)` - Assigner rôle (local + Keycloak)

#### 2. **KeycloakService**
- `login(email, password)` - Authentifier via Keycloak token endpoint
- `createUser(email, password)` - Créer compte Keycloak (Admin API)
- `resetPassword(keycloakId)` - Envoyer email reset
- `assignRole(keycloakId, role)` - Assigner rôle realm

#### 3. **VehicleService**
- `createVehicle(proprietaireId, data)` - Créer véhicule
- `getVehicles(proprietaireId)` - Lister véhicules
- `updateVehicleStatus(vehicleId, status)` - Changer statut
- `trackVehicle(vehicleId)` - GPS temps réel

#### 4. **TripService**
- `createTrip(affectationId, data)` - Proposer trajet
- `startTrip(tripId)` - Démarrer trajet
- `endTrip(tripId)` - Terminer + calculer tarif
- `reserveSpot(tripId, passagerId)` - Réserver place
- `calculateFare(tripId)` - Calculer tarif selon zone/distance

#### 5. **PaymentService**
- `initiatePayment(userId, amount, method)` - Lancer paiement
- `confirmPayment(transactionId)` - Confirmer paiement
- `requestRefund(paymentId, reason)` - Demander remboursement

#### 6. **ParkingService**
- `checkin(parkingId, vehicleId)` - Enregistrer entrée
- `checkout(parkingId, vehicleId)` - Enregistrer sortie
- `updateCapacity(parkingId)` - Mettre à jour capacité
- `reportMaintenance(vehicleId, type)` - Signaler maintenance

#### 7. **SupportService**
- `createTicket(userId, data)` - Créer ticket
- `assignTicket(ticketId, agentId)` - Assigner agent
- `sendMessage(ticketId, message)` - Ajouter message
- `approveRefund(refundId)` - Approuver remboursement

---

## 🚀 Infrastructure et Déploiement

### Architecture Docker Compose

```yaml
Services:
├─ postgres           (PostgreSQL 16)     - Base de données
├─ keycloak           (Keycloak latest)   - SSO + Identity
├─ backend            (Node.js 18+)       - API Express
├─ web                (Node.js + Vite)    - Frontend React
├─ redis              (Redis 7)           - Cache
├─ ndjigi_mobile      (Flutter)           - App mobile
├─ [Sinetpay]         (External)          - Paiements mobiles
├─ [Twilio]           (External)          - SMS/OTP
├─ [OpenStreetMap]    (External)          - Cartes & Géolocalisation
└─ [Autres services]  (Optional)          - Email, Storage, etc.
```

### Workflow de Déploiement

```
Code Push
   │
   ▼
GitHub Actions (CI/CD)
   ├─ npm test (unit + integration)
   ├─ npm run build
   ├─ Security scan
   └─ Build Docker images
   │
   ▼
Docker Registry (Optional)
   │
   ▼
Production Server
   ├─ docker pull images
   ├─ docker-compose up
   ├─ Database migrations (Prisma)
   ├─ Health checks
   └─ Monitoring alerts
```

### Sécurité en Production

| Aspect | Mesure |
|--------|--------|
| **HTTPS** | Certificat SSL/TLS (Let's Encrypt) |
| **CORS** | Whitelist domains uniquement |
| **Rate Limiting** | Redis + express-rate-limit |
| **Secrets** | Variables d'environnement sécurisées |
| **JWT** | RS256, 15min expiration, refresh tokens |
| **JWKS Caching** | 1h TTL, signature vérifiée |
| **Password** | Bcrypt hashing en base locale (si utilisé) |
| **Audit Logs** | Tous les accès authentifiés loggés |
| **Database** | Backups quotidiens, chiffrement repos |

---

## 📚 Résumé Authentification avec Keycloak

### Points Clés

1. **SSO Centralisé** - Keycloak gère identité centralisée
2. **JWT RS256** - Tokens signés asymétriquement, vérifiés via JWKS
3. **Auto-provisioning** - Utilisateurs créés en BDD au premier login Keycloak
4. **Dual Authority** - Rôles Keycloak (realm) = source de vérité, rôles BDD = métier
5. **Token Refresh** - Access tokens 15min, refresh tokens 7j
6. **Admin API** - Pour créer users, reset password, assign roles
7. **Audit** - Tous les accès loggés dans auth_log table
8. **Password Reset** - Flux email sécurisé via tokens temporaires
9. **2FA Support** - OTP SMS/authenticator (structure ready)
10. **CORS Protected** - Requêtes depuis domaines whitelistés uniquement

### Flux Résumé

```
User                     Frontend                Backend                  Keycloak
 │                          │                       │                        │
 ├─ Email + Password ───────►│                       │                        │
 │                          │ POST /auth/login      │                        │
 │                          ├──────────────────────►│                        │
 │                          │                       │ Token endpoint +       │
 │                          │                       │ email + password       │
 │                          │                       ├───────────────────────►│
 │                          │                       │◄───────────────────────┤
 │                          │                       │ access_token + refresh │
 │                          │ Return tokens + user  │                        │
 │                          │◄──────────────────────┤                        │
 │ access_token + user ◄────┤                       │                        │
 │                          │                        │                        │
 │ [Appels API avec token]  │                        │                        │
 ├ Authorization: Bearer .. ►│                        │                        │
 │                          │ keycloakAuth MW       │                        │
 │                          ├──────────────────────►│ Valide via JWKS        │
 │                          │                       ├──────────────────────►│
 │                          │                       │◄──────────────────────┤
 │                          │                       │ Clés publiques RSA     │
 │                          │                       │                        │
 │                          │                       │ Vérifie signature+exp  │
 │                          │                       │                        │
 │                          │  ✅ Requête exécutée  │                        │
 │ Réponse ◄─────────────────┤◄──────────────────────┤                        │
 │                          │                        │                        │
```

---

## 🔍 Debug Checklist

Si vous rencontrez des problèmes d'authentification:

- [ ] Keycloak est accessible sur le port 8080
- [ ] Realm `ndjigi` existe dans Keycloak
- [ ] Client `ndjigi-backend` est créé (confidentiel)
- [ ] Client secret dans .env correspond à Keycloak
- [ ] JWKS endpoint accessible: `http://keycloak:8080/realms/ndjigi/protocol/openid-connect/certs`
- [ ] PostgreSQL a les deux bases: `ndjigi_db` et `keycloak_db`
- [ ] Variables d'environnement dans backend:
  - `KEYCLOAK_URL`
  - `KEYCLOAK_REALM`
  - `KEYCLOAK_CLIENT_ID`
  - `KEYCLOAK_CLIENT_SECRET`
- [ ] Utilisateurs créés dans Keycloak apparaissent dans `utilisateur` table (auto-provisioning)
- [ ] Redis accessible pour cache JWKS et sessions
- [ ] Certificats SSL valides en production

---

## 🔌 Socket.IO - Communication en Temps Réel

### État Actuel ⚠️

**Socket.IO n'est pas actuellement implémenté dans le codebase**, mais:
- ✅ Les **structures BDD existent** (tracking_vehicule, conversation, message)
- ✅ **nginx.conf** a les headers WebSocket configurés (`Upgrade`, `Connection`)
- ⏳ L'infrastructure est **prête pour l'implémentation**

### Cas d'Usage Prévus

Socket.IO serait utilisé pour:

| Feature | Use Case | Message Type |
|---------|----------|--------------|
| **GPS Tracking** | Localisation véhicule en temps réel | `vehicle:location:update` |
| **Chat** | Messages entre passager/chauffeur/support | `message:new`, `message:read` |
| **SOS** | Alertes d'urgence en direct | `incident:security:alert` |
| **Notifications** | Notifications push en temps réel | `notification:new` |
| **Trip Status** | État du trajet en direct | `trip:status:changed` |

### Architecture Socket.IO Recommandée

```javascript
// 1. Installation
npm install socket.io socket.io-redis-adapter

// 2. Initialisation dans app.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  adapter: createAdapter(
    redis,                    // Pub/Sub Redis pour scaling
    redisSubscriber           // Subscriber Redis séparé
  )
});

httpServer.listen(PORT, () => console.log(`Server with WebSocket on ${PORT}`));
```

### Flows Socket.IO

#### 1. GPS Tracking (Chauffeur → Frontend)

```javascript
// Backend: mise à jour GPS
io.to(`vehicle:${vehicleId}`).emit('vehicle:location:update', {
  id_vehicule: vehicleId,
  latitude: 14.6847,
  longitude: -14.4467,
  vitesse: 45,
  cap: 180,
  timestamp: new Date()
});

// Frontend: receive & update map
socket.on('vehicle:location:update', (location) => {
  updateMapMarker(location.id_vehicule, {
    lat: location.latitude,
    lng: location.longitude
  });
});
```

#### 2. Chat Passager-Chauffeur

```javascript
// Chauffeur envoie message
socket.emit('message:send', {
  id_conversation: conversationId,
  id_expediteur: chauffeurId,
  contenu: 'Je suis arrivé',
  date_envoi: new Date()
});

// Backend:
socket.on('message:send', async (payload) => {
  // 1. Sauvegarder en BDD
  const message = await prisma.message.create({
    data: {
      id_conversation: payload.id_conversation,
      id_expediteur: payload.id_expediteur,
      contenu: payload.contenu,
      date_envoi: new Date()
    }
  });
  
  // 2. Broadcast aux participants
  io.to(`conversation:${payload.id_conversation}`).emit('message:new', message);
  
  // 3. Notification
  emitNotification(otherParticipantId, 'Nouveau message');
});

// Passager reçoit
socket.on('message:new', (message) => {
  displayMessage(message);
  markAsRead(message.id_message);
});
```

#### 3. SOS - Incident Sécurité

```javascript
// Passager déclenche SOS
socket.emit('incident:security:alert', {
  id_trajet: tripId,
  id_declencheur: passagerId,
  type_incident: 'ASSAULT',
  description: 'Aide immédiate nécessaire',
  location: { lat: 14.6847, lng: -14.4467 }
});

// Backend:
socket.on('incident:security:alert', async (payload) => {
  // 1. Créer incident en BDD
  const incident = await prisma.incident_securite.create({
    data: payload
  });
  
  // 2. Notifier TOUS les agents support (room 'support')
  io.to('support').emit('incident:security:alert', {
    ...incident,
    priority: 'CRITICAL',
    timestamp: new Date()
  });
  
  // 3. Notifier chauffeur
  io.to(`user:${tripData.id_chauffeur}`).emit('trip:danger:alert', {
    message: 'Alerte sécurité sur votre trajet',
    action: 'STOP_IMMEDIATELY'
  });
});

// Support agent reçoit
socket.on('incident:security:alert', (incident) => {
  playAlert(); // Son d'alerte
  showIncidentModal(incident);
  updateMapMarker(incident.location, 'DANGER');
});
```

#### 4. Trip Status Updates

```javascript
// Quand trajet démarre
io.to(`trip:${tripId}`).emit('trip:status:changed', {
  id_trajet: tripId,
  statut: 'en_cours',
  date_heure_debut: new Date(),
  eta_minutes: 18
});

// Quand trajet termine
io.to(`trip:${tripId}`).emit('trip:status:changed', {
  id_trajet: tripId,
  statut: 'termine',
  date_heure_fin: new Date(),
  tarif_final: 2500,
  evaluation_pending: true
});
```

### Room Management

```javascript
// Rooms pour scaling horizontal (Redis)
socket.on('connect', async (socket) => {
  const { user_id } = socket.handshake.auth;
  
  // User joins personal room
  socket.join(`user:${user_id}`);
  
  // Support agents join support room
  if (user.roles.includes('support')) {
    socket.join('support');
  }
  
  // Chauffeur joins vehicle tracking room
  if (user.roles.includes('chauffeur')) {
    const vehicle = await getAssignedVehicle(user_id);
    socket.join(`vehicle:${vehicle.id_vehicule}`);
  }
});

// Pattern pour conversations
socket.on('join:conversation', ({ conversationId }) => {
  socket.join(`conversation:${conversationId}`);
});

socket.on('leave:conversation', ({ conversationId }) => {
  socket.leave(`conversation:${conversationId}`);
});
```

### Redis Adapter pour Pub/Sub

```javascript
// Redis configuration pour Socket.IO
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

const redisSubscriber = redis.duplicate();

const io = new Server(httpServer, {
  adapter: createAdapter(redis, redisSubscriber)
});

/**
 * Avantages du Redis Adapter:
 * ✅ Messages persistents sur crash
 * ✅ Scaling horizontal (plusieurs serveurs)
 * ✅ Load balancing avec nginx
 * ✅ Pub/Sub décentralisé
 * ✅ Session shared state (utilisateurs connectés)
 */
```

### Architecture Déploiement avec WebSocket

```
┌────────────────────────────────────────────┐
│  Load Balancer (Nginx)                     │
│  - Sticky sessions (socket.io)             │
│  - WebSocket upgrade headers               │
│  - Backward compatibility (polling)        │
└──────────┬──────────┬──────────┬───────────┘
           │          │          │
      ┌────▼──┐  ┌────▼──┐  ┌───▼────┐
      │Server │  │Server │  │Server  │
      │  #1   │  │  #2   │  │  #3    │
      │ 8000  │  │ 8000  │  │ 8000   │
      └────┬──┘  └────┬──┘  └───┬────┘
           │          │          │
           └──────────┴──────────┘
                  │
           ┌──────▼──────┐
           │   Redis     │  ← Shared state + Pub/Sub
           │  (Adapter)  │
           └─────────────┘
```

### Client-Side Socket Configuration

```typescript
// Frontend (React/TypeScript)
import io from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: {
    token: localStorage.getItem('access_token'),
    user_id: currentUser.id_utilisateur
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling']
});

// Event listeners
socket.on('connect', () => {
  console.log('Connected to Socket.IO');
  socket.emit('join:conversation', { conversationId: 'abc123' });
});

socket.on('message:new', (message) => {
  updateChatUI(message);
});

socket.on('vehicle:location:update', (location) => {
  updateMapMarker(location);
});

socket.on('incident:security:alert', (incident) => {
  triggerEmergencyUI(incident);
});
```

### Sécurité Socket.IO

| Aspect | Mesure |
|--------|--------|
| **Authentication** | Validation token JWT dans handshake |
| **Authorization** | Vérifier rôle avant broadcast |
| **Rate Limiting** | Limiter messages/sec par user |
| **Validation** | Valider payloads côté serveur |
| **CORS** | WebSocket CORS whitelist |
| **Encryption** | HTTPS/WSS en production |

```javascript
// Middleware Socket.IO pour auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const verified = await verifyKeycloakToken(token);
    socket.userId = verified.sub;
    socket.userRoles = verified.realm_access.roles;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Rate limiting
const messageRateLimit = new Map();

socket.on('message:send', (payload) => {
  const userId = socket.userId;
  const now = Date.now();
  
  if (!messageRateLimit.has(userId)) {
    messageRateLimit.set(userId, []);
  }
  
  const messages = messageRateLimit.get(userId)
    .filter(t => now - t < 1000);
  
  if (messages.length > 10) {
    socket.emit('error', 'Rate limit exceeded');
    return;
  }
  
  messages.push(now);
  messageRateLimit.set(userId, messages);
  
  // Process message...
});
```

### Monitoring Socket.IO

```javascript
// Statistiques
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected (${io.engine.clientsCount} total)`);
});

io.on('disconnect', (socket) => {
  console.log(`User ${socket.userId} disconnected`);
});

// Metrics pour Prometheus/DataDog
setInterval(() => {
  const stats = {
    connected_users: io.engine.clientsCount,
    rooms: Array.from(io.sockets.adapter.rooms.keys()),
    timestamp: new Date()
  };
  console.log(JSON.stringify(stats));
}, 30000);
```

### Checklist Implémentation

- [ ] Installer `socket.io` et `socket.io-redis-adapter`
- [ ] Configurer Redis pour pub/sub
- [ ] Créer initialisation Socket.IO dans app.js
- [ ] Ajouter middlewares d'auth/rate-limit
- [ ] Implémenter handlers pour: message, GPS, SOS
- [ ] Configurer rooms & namespaces
- [ ] Frontend: installer socket.io-client
- [ ] Tester avec multiple clients
- [ ] Monitoring et logs
- [ ] Load testing (stress test)

---

**Generated:** 2026-05-31  
**Maintainers:** Backend Team  
**Last Updated:** En cours de development
