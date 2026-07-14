# N'DJIGI — Architecture du module d'authentification

> **Statut** : Spécification cible — à implémenter par phases (voir `auth-migration-plan.md`)
> **Dernière mise à jour** : 2026-05-15

## 1. Vue d'ensemble

N'DJIGI utilise **Keycloak 26.6.1** comme unique fournisseur d'identité (IdP). Toute authentification — quel que soit le rôle ou le canal — passe par Keycloak. Le backend Node.js/Express ne gère plus de mots de passe ni de tokens en propre ; il se contente de valider les tokens signés par Keycloak.

L'auth JWT custom historique (`Option A`) est **supprimée** à la fin de la Phase 4.

## 2. Rôles et flows d'authentification

| Rôle | Plateforme | Méthode de login | 2FA | Inscription |
|---|---|---|---|---|
| **admin** | Web React | Email + Mot de passe | SMS obligatoire | Créé manuellement dans Keycloak Admin par l'IT |
| **gestionnaire** | Web React | Email + Mot de passe | SMS obligatoire | Créé par un admin via le frontend admin |
| **passager** | Mobile Flutter | OTP SMS sur téléphone | TOTP obligatoire (après 1er login) | Auto-inscription : numéro → OTP → compte créé |
| **chauffeur** | Mobile Flutter | OTP SMS sur téléphone | TOTP obligatoire | S'inscrit d'abord en tant que passager, élargit son profil ensuite (module séparé) |
| **propriétaire** | Mobile Flutter | OTP SMS sur téléphone | TOTP obligatoire | Idem chauffeur |

**Multi-rôles** : un même compte (un seul numéro de téléphone) peut cumuler les rôles passager + chauffeur + propriétaire. Le frontend permet de "switcher" entre rôles. Les rôles admin et gestionnaire sont exclusifs (ne se cumulent pas avec les rôles métier).

## 3. Stack technique

```
┌───────────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐
│  Frontend Admin/Gest      │       │  App Mobile Flutter       │       │  Keycloak 26.6.1         │
│  React + Vite + TS        │       │  passager/chauffeur/      │       │  Realm: ndjigi           │
│  keycloak-js              │       │  propriétaire             │       │  - Clients               │
│                           │       │                           │       │  - Realm Roles          │
│  Login: email + MDP + SMS │       │  Login: OTP SMS + TOTP    │       │  - Users (source of    │
└────────────┬──────────────┘       └────────────┬──────────────┘       │    truth identité)     │
             │                                   │                       └────────────┬───────────┘
             │ Bearer <kc_token>                 │ Bearer <kc_token>                  │
             ▼                                   ▼                                   │
┌────────────────────────────────────────────────────────────────┐                  │
│  Backend Node.js + Express                                     │ ◄────────────────┘
│  - Middleware keycloakAuth (valide JWT via JWKS)               │  Admin REST API
│  - Middleware authorize(...roles)                              │  pour CRUD users
│  - Endpoints OTP (request/verify/resend)                       │
│  - Service account Keycloak pour émettre tokens OTP            │
│  - Prisma ORM                                                  │
└──────┬──────────────────────────────┬──────────────────────────┘
       │                              │
       ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│  PostgreSQL     │          │  Redis              │
│  - Miroir users │          │  - OTP codes (TTL)  │
│  - auth_logs    │          │  - Token blacklist  │
│                 │          │  - Rate limiting    │
└─────────────────┘          └─────────────────────┘
```

## 4. Composants Keycloak

### 4.1 Realm

- **Nom** : `ndjigi`
- **Internationalization** : `fr` par défaut
- **Login theme** : `keycloak` (peut être customisé plus tard)
- **Forgot password** : activé (envoie un email avec lien)
- **Verify email** : activé pour admin/gestionnaire

### 4.2 Clients

| Client ID | Type | Direct Access Grants | Description |
|---|---|---|---|
| `ndjigi-backend` | Confidentiel | ✅ ON | Service account pour appeler l'Admin API et émettre des tokens en flow OTP |
| `ndjigi-web` | Public | ✅ ON | Frontend React admin/gestionnaire (login email/MDP) |
| `ndjigi-mobile` | Public | ✅ ON | App Flutter (login OTP) |

> Direct Access Grants est activé partout car les frontends gèrent leurs propres écrans de login (on n'utilise pas la page Keycloak hébergée).

### 4.3 Realm Roles

- `ndjigi-admin`
- `ndjigi-gestionnaire`
- `ndjigi-passager`
- `ndjigi-chauffeur`
- `ndjigi-proprietaire`

### 4.4 Authentication Flows

Un seul flow custom est créé : **`browser-2fa-required`** (clone de `browser`)

- Étape 1 : Cookie / Identity Provider Redirector
- Étape 2 : Username/Password Form (pour admin/gestionnaire) OU Direct Grant (pour OTP backend)
- Étape 3 : **Conditional - User Configured** → OTP Form (TOTP ou SMS)

Affectations :
- **Admin/Gestionnaire** : 2FA SMS obligatoire (configurée comme required action au premier login)
- **Passager/Chauffeur/Propriétaire** : 2FA TOTP obligatoire (configurée comme required action au premier login)

### 4.5 User Federation et Required Actions

Pour les **admin/gestionnaire** créés manuellement :
- Required Action : `CONFIGURE_TOTP` désactivé, à la place une required action custom `CONFIGURE_SMS_OTP` (créée par SPI léger OU contournée en utilisant un mapper côté backend)

Pour les **passager/chauffeur/propriétaire** :
- Required Action : `CONFIGURE_TOTP` au premier login

### 4.6 Token Lifespans

| Token | Durée |
|---|---|
| Access Token | 5 minutes |
| Refresh Token (standard) | 30 minutes (idle) / 10 heures (max) |
| Refresh Token (Remember Me) | 30 jours |
| SSO Session Idle | 30 minutes |
| SSO Session Max | 10 heures |
| Offline Session (Remember Me) | 30 jours |

## 5. Backend Node.js — composants

### 5.1 Middlewares

- **`keycloakAuth`** : extrait le Bearer token, le valide via JWKS de Keycloak, charge l'user depuis la BDD locale (auto-provisioning au premier appel), attache `req.user`
- **`authorize(...roles)`** : vérifie que `req.user.roles` contient au moins un des rôles autorisés
- **`checkBlacklist`** : vérifie que le JTI du token n'est pas dans Redis blacklist
- **`rateLimitAuth`** : limite les appels aux endpoints OTP (5 SMS/jour/numéro, 1/minute)

### 5.2 Endpoints d'authentification

#### Admin/Gestionnaire (email + MDP + SMS)

```
POST /api/v1/auth/login
  Body: { email, password }
  → Appelle Keycloak Direct Access Grant
  → Si 2FA requise : retourne { requires_2fa: true, sms_sent: true, login_token: <jti> }
  → Sinon : retourne { access_token, refresh_token, expires_in, user }

POST /api/v1/auth/verify-sms
  Body: { login_token, sms_code }
  → Vérifie le code SMS en Redis
  → Re-appelle Keycloak avec le code TOTP émis par le SPI/SMS
  → Retourne { access_token, refresh_token, expires_in, user }

POST /api/v1/auth/refresh
  Body: { refresh_token }
  → Appelle Keycloak token endpoint avec grant_type=refresh_token

POST /api/v1/auth/logout
  Header: Authorization: Bearer <access_token>
  Body: { refresh_token }
  → Invalide la session Keycloak + blacklist le JTI dans Redis

POST /api/v1/auth/forgot-password
  Body: { email }
  → Appelle Keycloak Admin API pour déclencher l'email de reset

POST /api/v1/auth/reset-password
  Body: { reset_token, new_password }
  → Validation puis update via Admin API
```

#### Passager/Chauffeur/Propriétaire (OTP SMS + TOTP)

```
POST /api/v1/auth/otp/request
  Body: { phone }
  → Normalise le numéro (libphonenumber-js, +226 only)
  → Génère OTP 6 chiffres
  → Stocke en Redis: key="otp:<phone>", value="<code>", TTL=5min
  → Envoie via Orange SMS API (en dev: log dans la console backend)
  → Rate limit: 1 SMS/min, max 5/jour/numéro

POST /api/v1/auth/otp/verify
  Body: { phone, otp_code }
  → Vérifie le code en Redis (max 3 tentatives)
  → Si user n'existe pas dans Keycloak: le crée via Admin API + assigne rôle passager
  → Émet les tokens via Keycloak Direct Access Grant (avec un user technique ou Token Exchange)
  → Si 2FA TOTP non configurée: retourne { requires_totp_setup: true, totp_secret, qr_code_url }
  → Sinon: retourne { requires_totp: true, login_token }

POST /api/v1/auth/totp/setup
  Body: { login_token, totp_code }
  → Confirme la configuration TOTP côté Keycloak
  → Émet les tokens finaux

POST /api/v1/auth/totp/verify
  Body: { login_token, totp_code }
  → Vérifie le TOTP
  → Émet les tokens finaux

POST /api/v1/auth/otp/resend
  Body: { phone }
  → Cooldown 60s
  → Renvoie un nouveau OTP
```

### 5.3 Schéma Prisma (miroir local)

```prisma
model Utilisateur {
  id_utilisateur     String   @id @default(uuid()) @db.Uuid
  keycloak_id        String   @unique @db.Uuid
  email              String?  @unique  // null pour passager/chauffeur/proprio sans email
  phone              String?  @unique  // format E.164: +22670123456
  nom                String?
  prenom             String?
  active_role        String?  // rôle actuellement sélectionné par le user
  cree_le            DateTime @default(now())
  modifie_le         DateTime @updatedAt

  // Remove mot_de_passe_hash, derniere_connexion_*, tentatives_*, bloque_*
  // (Keycloak gère tout ça maintenant)
}

model AuthLog {
  id           String   @id @default(uuid()) @db.Uuid
  user_id      String?  @db.Uuid
  event_type   String   // "login_success", "login_failed", "otp_sent", "otp_verified", "logout", etc.
  channel      String?  // "email_password", "otp_sms", "totp", "refresh"
  ip_address   String?
  user_agent   String?
  metadata     Json?
  created_at   DateTime @default(now())

  @@index([user_id])
  @@index([event_type])
  @@index([created_at])
}
```

> Les rôles ne sont **pas** stockés dans cette table. Ils sont lus depuis le token Keycloak à chaque requête (claim `realm_access.roles`).

## 6. Frontend Admin/Gestionnaire (React)

### 6.1 Bibliothèques

- `keycloak-js` : SDK officiel
- `axios` + intercepteur de refresh automatique
- `react-router-dom`
- Composant `<ProtectedRoute requiredRoles={[]} />`

### 6.2 Stockage

- `access_token` : en mémoire (state React)
- `refresh_token` : `localStorage` si "Remember me" coché, sinon `sessionStorage`
- **Pas de stockage de mot de passe**

### 6.3 AuthContext

Le contexte expose :
- `user`, `roles`, `isAuthenticated`, `loading`
- `login(email, password)`, `verifySMS(code)`, `logout()`
- `forgotPassword(email)`, `resetPassword(token, password)`
- `can(permission)` : vérifie une permission (mapping rôle → permissions chargé au démarrage)

## 7. App Mobile Flutter

### 7.1 Packages

- `flutter_secure_storage` pour stocker le refresh token
- `dio` + interceptor refresh
- `pin_code_fields` pour la saisie OTP
- `otp` pour la génération/validation TOTP locale (génération du secret côté backend)

### 7.2 Flow d'inscription/login

```
Écran 1: Saisie numéro téléphone (préfixe +226 forcé)
   │ POST /auth/otp/request
   ▼
Écran 2: Saisie OTP 6 chiffres (resend après 60s)
   │ POST /auth/otp/verify
   ▼
[Premier login uniquement]
Écran 3: Configuration TOTP
   - Affiche QR code généré côté backend
   - Demande de scanner avec Google Authenticator
   - Saisie du code TOTP pour confirmer
   │ POST /auth/totp/setup
   ▼
[Connexions suivantes]
Écran 3': Saisie TOTP 6 chiffres
   │ POST /auth/totp/verify
   ▼
Écran 4: Accueil app (logged in)
```

## 8. Sécurité

### 8.1 Token blacklist (Redis)

À chaque logout :
1. Le JTI (claim `jti` du token) est extrait
2. Stocké dans Redis : `key="blacklist:<jti>"`, `TTL = exp - now()`
3. La session Keycloak est invalidée via l'Admin API
4. À chaque requête, le middleware `checkBlacklist` vérifie l'absence du JTI

### 8.2 Rate limiting

- `express-rate-limit` + `rate-limit-redis`
- Endpoints `/auth/*` : 10 req / 15 min / IP
- Endpoint `/auth/otp/request` : 1 SMS/min/numéro, max 5/jour/numéro

### 8.3 Validation des tokens

- Algorithme : RS256 (asymétrique)
- Clé publique : récupérée via JWKS depuis `http://keycloak:8080/realms/ndjigi/protocol/openid-connect/certs`
- Cache du JWKS : 1 heure
- Vérifications : signature, expiration, issuer, audience

### 8.4 Multi-sessions

- Mode multi-sessions activé dans Keycloak (un user peut être connecté sur PC + mobile + tablette)
- Chaque session a son propre JTI et sa propre entrée dans `auth_logs`
- L'admin peut voir/révoquer les sessions actives d'un user via une UI dédiée (post-MVP)

## 9. Mode développement

### 9.1 Simulation OTP SMS

En `NODE_ENV=development` :
- Pas d'appel à Orange SMS API
- Le code OTP est généré normalement
- Le code est affiché dans la console backend avec un format visible :

```
============================================================
  📱 OTP SMS [DEV MODE]
  Phone : +22670123456
  Code  : 458732
  Valid : 5 minutes
============================================================
```

### 9.2 Service account credentials

Le client `ndjigi-backend` a un secret stocké dans `.env` (jamais committé). En dev, il est régénéré à chaque init du realm via le script `setup-keycloak.sh`.

## 10. Production (futur)

Hors scope MVP, mais à prévoir :
- HTTPS partout (Traefik ou nginx)
- Cookies httpOnly + Secure pour le refresh token (au lieu de localStorage)
- KC_HOSTNAME configuré sur le domaine prod
- Orange SMS API avec compte de prod
- Backups automatiques Postgres + export realm Keycloak régulier
- Monitoring (logs auth_logs → ELK ou Loki)
