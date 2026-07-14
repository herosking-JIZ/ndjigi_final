# 📋 Guide Complet de Configuration du Realm Keycloak NDJIGI

> **⚠️ Important**: Ce guide est destiné à être suivi MANUELLEMENT. **NE PAS automatiser la création du realm** (respecter les règles strictes du projet).

---

## Table des matières
1. [Prérequis](#prérequis)
2. [Accès à Keycloak](#accès-à-keycloak)
3. [Créer le Realm NDJIGI](#créer-le-realm-ndjigi)
4. [Configurer les Clients](#configurer-les-clients)
5. [Créer les Utilisateurs](#créer-les-utilisateurs)
6. [Configurer les Rôles](#configurer-les-rôles)
7. [Paramètres de Sécurité](#paramètres-de-sécurité)
8. [Tests de Validation](#tests-de-validation)
9. [Checklist de Déploiement](#checklist-de-déploiement)

---

## 1. Prérequis

### Stack Docker active
Vérifier que les conteneurs sont en cours d'exécution:
```bash
docker-compose ps
```

**Résultat attendu**:
- ✅ ndjigi-postgres (running, healthy)
- ✅ ndjigi-keycloak (running)
- ✅ ndjigi-backend (running)
- ✅ ndjigi-web (running)
- ✅ ndjigi-redis (running, healthy)

### Accès réseau
- Keycloak Admin Console: `http://localhost:8080/admin` (ou `http://<IP>:8080/admin`)
- Navigateur moderne (Chrome, Firefox, Edge)
- Identifiants Keycloak admin:
  - **Username**: `admin`
  - **Password**: `Admin123456`

---

## 2. Accès à Keycloak

### Étape 1: Ouvrir la console d'administration

1. Accéder à: **http://localhost:8080/admin**
   - Si sur réseau distant: **http://<IP-locale>:8080/admin**
   
2. Cliquer sur "Administration Console"

3. Connexion:
   - **Username**: `admin`
   - **Password**: `Admin123456`

4. Accepter les conditions (si première visite)

**Résultat**: Vous êtes connecté à la console Keycloak

---

## 3. Créer le Realm NDJIGI

### Étape 1: Accéder au formulaire de création

1. En haut à gauche, survoler **"Master"** (realm par défaut)
2. Cliquer sur **"Create Realm"** (ou le bouton + if visible)

### Étape 2: Remplir les informations

| Champ | Valeur |
|-------|--------|
| **Realm name** | `ndjigi` |
| **Display name** | `NDJIGI - Partage de trajets` |
| **Enabled** | ✅ ON |
| **Frontend URL** | (laisser vide pour auto-détection) |

### Étape 3: Valider la création

Cliquer **"Create"**

**Résultat**: Realm `ndjigi` créé et actif. Le dropdown en haut à gauche affiche maintenant "ndjigi".

---

## 4. Configurer les Clients

### Client 1: `ndjigi-backend` (API Backend)

#### Étape 1: Créer le client

1. Menu gauche → **Clients** → **Create client**

2. Onglet **General**:
   - **Client ID**: `ndjigi-backend`
   - **Name**: `NDJIGI Backend API`
   - **Client type**: `OpenID Connect`
   - **Enabled**: ✅ ON

3. Cliquer **"Next"**

#### Étape 2: Configurer la sécurité

**Onglet "Capability config"**:
- ✅ Client authentication
- ✅ Authorization (permet les rôles/permissions)
- ❌ Disable PKCE (ne pas cocher)

Cliquer **"Next"**

#### Étape 3: Configurer les URLs

**Onglet "Login settings"**:

| Champ | Valeur |
|-------|--------|
| **Valid redirect URIs** | `http://localhost:8000/*` |
| **Valid post logout redirect URIs** | `http://localhost:8000/logout` |
| **Web origins** | `http://localhost:8000` |
| **Admin URL** | (laisser vide) |

Cliquer **"Save"**

#### Étape 4: Récupérer le Client Secret

1. Aller à l'onglet **"Credentials"**
2. Copier la **Client Secret** (ex: `W4HZH0Wf8TnGUjv6E2XMOrAl2hlXTzlM`)
3. **Mettre à jour** le `docker-compose.yml`:
   ```yaml
   KEYCLOAK_CLIENT_SECRET: W4HZH0Wf8TnGUjv6E2XMOrAl2hlXTzlM
   ```

#### Étape 5: Configurer le protocole Direct Access Grant

1. Onglet **"Advanced"**
2. Chercher **"Proof Key for Public Clients"** → ON (pour plus de sécurité)
3. **Sauvegarder**

---

### Client 2: `ndjigi-web` (Frontend React)

#### Étape 1: Créer le client

1. **Clients** → **Create client**

2. **General**:
   - **Client ID**: `ndjigi-web`
   - **Name**: `NDJIGI Web Frontend`
   - **Client type**: `OpenID Connect`
   - **Enabled**: ✅ ON

3. **Next**

#### Étape 2: Capacités

**Capability config**:
- ❌ Client authentication (c'est un client PUBLIC)
- ✅ Authorization
- ✅ Implicit flow enabled (pour SPA)
- ✅ Standard flow enabled

**Next**

#### Étape 3: URLs de redirection

**Login settings**:

| Champ | Valeur |
|-------|--------|
| **Valid redirect URIs** | `http://localhost:3000/*` |
| **Valid post logout redirect URIs** | `http://localhost:3000/logout` |
| **Web origins** | `http://localhost:3000` |

**Save**

#### Étape 4: Vérifier la configuration

- Onglet **"Advanced"**:
  - Access Token Lifespan: **15 minutes** (synchroniser avec JWT_EXPIRES_IN)
  - Refresh Token Lifespan: **7 days**
  - Idle Session Timeout: **30 minutes**

---

### Client 3: `ndjigi-admin-client` (Admin API - optionnel mais recommandé)

Ce client permet au backend de faire des appels Admin API Keycloak (créer users, reset passwords, etc).

#### Étape 1: Créer le client

1. **Clients** → **Create client**

2. **General**:
   - **Client ID**: `ndjigi-admin-client`
   - **Name**: `NDJIGI Admin Client`
   - **Client type**: `OpenID Connect`
   - **Enabled**: ✅ ON

3. **Next**

#### Étape 2: Sécurité

**Capability config**:
- ✅ Client authentication
- ✅ Service accounts enabled ⚠️ **IMPORTANT**

**Next**

#### Étape 3: URLs

**Login settings**: (laisser vide pour API-only)

**Save**

#### Étape 4: Récupérer le Client Secret

1. Onglet **"Credentials"**
2. Copier la **Client Secret**
3. **Ajouter au docker-compose.yml**:
   ```yaml
   KEYCLOAK_ADMIN_CLIENT_ID: ndjigi-admin-client
   KEYCLOAK_ADMIN_CLIENT_SECRET: <client-secret>
   ```

#### Étape 5: Attribuer les rôles Admin

1. Onglet **"Service Accounts Roles"**
2. Chercher **"realm-management"** client
3. Attribuer les rôles:
   - ✅ `manage-users`
   - ✅ `view-users`
   - ✅ `manage-realm` (optionnel)

**Save**

---

## 5. Créer les Utilisateurs

### Utilisateur Type 1: Chauffeur de Test

#### Étape 1: Créer l'utilisateur

1. Menu gauche → **Users** → **Add user**

2. **Username**: `test_chauffeur`
3. **Email**: `test_chauffeur@ndjigi.test`
4. **First name**: `Test`
5. **Last name**: `Chauffeur`
6. **Email verified**: ✅ ON
7. **Enabled**: ✅ ON

**Create**

#### Étape 2: Définir le mot de passe

1. Onglet **"Credentials"** (du nouvel utilisateur)
2. **Set password**:
   - **Password**: `test_chauffeur_123`
   - **Confirm**: `test_chauffeur_123`
   - **Temporary**: ❌ OFF (le user peut se connecter directement)

**Set password** → Confirmer

#### Étape 3: Assigner les rôles

1. Onglet **"Role mapping"**
2. **Assign role**:
   - Chercher: `chauffeur`
   - Sélectionner le rôle
   - **Assign**

---

### Utilisateur Type 2: Passager de Test

#### Étape 1: Créer l'utilisateur

1. **Users** → **Add user**

2. **Username**: `test_passager`
3. **Email**: `test_passager@ndjigi.test`
4. **First name**: `Test`
5. **Last name**: `Passager`
6. **Email verified**: ✅ ON
7. **Enabled**: ✅ ON

**Create**

#### Étape 2: Mot de passe

1. **Credentials** → **Set password**:
   - **Password**: `test_passager_123`
   - **Confirm**: `test_passager_123`
   - **Temporary**: ❌ OFF

**Set password**

#### Étape 3: Rôles

1. **Role mapping** → **Assign role**
2. Assigner: `passager`

---

### Utilisateur Type 3: Admin (optionnel)

#### Étape 1: Créer l'utilisateur

1. **Users** → **Add user**

2. **Username**: `admin_ndjigi`
3. **Email**: `admin@ndjigi.test`
4. **First name**: `Admin`
5. **Last name**: `NDJIGI`
6. **Email verified**: ✅ ON
7. **Enabled**: ✅ ON

**Create**

#### Étape 2: Mot de passe

1. **Credentials** → **Set password**:
   - **Password**: `admin_secure_pass_123`
   - **Temporary**: ❌ OFF

**Set password**

#### Étape 3: Rôles d'administration

1. **Role mapping** → **Assign role**
2. Attribuer:
   - `realm-management` > `manage-realm`
   - `realm-management` > `view-users`
   - `admin` (rôle custom si existant)

---

## 6. Configurer les Rôles

### Rôles du Realm

Accéder à: **Realm Roles** (menu gauche)

#### Rôle 1: `chauffeur`

1. **Create role**
2. **Role name**: `chauffeur`
3. **Description**: `Rôle pour les conducteurs de véhicules`
4. **Create**

#### Rôle 2: `passager`

1. **Create role**
2. **Role name**: `passager`
3. **Description**: `Rôle pour les passagers`
4. **Create**

#### Rôle 3: `admin` (optionnel)

1. **Create role**
2. **Role name**: `admin`
3. **Description**: `Rôle administrateur de la plateforme`
4. **Create**

#### Rôle 4: `support` (optionnel)

1. **Create role**
2. **Role name**: `support`
3. **Description**: `Rôle pour l'équipe support`
4. **Create**

---

### Mapper les rôles dans les tokens

Pour que les rôles apparaissent dans les JWT tokens:

1. **Clients** → Sélectionner **ndjigi-backend**
2. **Client Scopes** → **roles** (ou **ndjigi-backend-dedicated**)
3. Onglet **"Mappers"**
4. Chercher **"realm roles"** et vérifier:
   - ✅ **"Add to ID token"**: ON
   - ✅ **"Add to access token"**: ON
   - ✅ **"Add to userinfo"**: ON

5. **Save**

---

## 7. Paramètres de Sécurité

### CORS et Sécurité

1. **Realm settings** (menu gauche, sous ndjigi)
2. Onglet **"Security"**:
   - **Require HTTPS**: OFF (dev) / ON (prod)
   - **X-Frame-Options**: `ALLOW-FROM http://localhost:3000`
   - **Strict Transport Security (HSTS)**: OFF (dev)

### Sessions

1. **Sessions** tab:
   - **SSO Session Idle**: `30 minutes`
   - **SSO Session Max**: `12 hours`
   - **Offline Token Idle**: `30 days`

### Protocoles

1. **Clients Scopes** → **roles** → Vérifier:
   - ✅ `email`
   - ✅ `profile`
   - ✅ `openid`

### Email (optionnel pour notifications)

1. **Email** tab (dans Realm settings)
2. Configurer un serveur SMTP si nécessaire pour:
   - Reset password
   - Verify email

---

## 8. Tests de Validation

### Test 1: Connexion utilisateur (Direct Access Grant)

**Via cURL** (remplacer les valeurs):

```bash
curl -X POST http://localhost:8080/realms/ndjigi/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=ndjigi-backend&client_secret=<CLIENT_SECRET>&grant_type=password&username=test_chauffeur&password=test_chauffeur_123&scope=openid profile email"
```

**Résultat attendu**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

### Test 2: Vérifier les rôles dans le token

**Décoder le access_token** sur https://jwt.io

**Données attendues dans le payload**:
```json
{
  "sub": "<user-id>",
  "email": "test_chauffeur@ndjigi.test",
  "realm_access": {
    "roles": ["chauffeur", "default-roles-ndjigi"]
  },
  "iss": "http://localhost:8080/realms/ndjigi",
  "aud": "ndjigi-backend"
}
```

### Test 3: Login via l'API Backend

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_chauffeur@ndjigi.test",
    "password": "test_chauffeur_123"
  }'
```

**Résultat attendu**: `200 OK` avec les tokens

### Test 4: Accès endpoint sécurisé

```bash
curl -X GET http://localhost:8000/api/v1/chauffeurs/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Résultat attendu**: `200 OK` avec les données du profil

### Test 5: Validation JWKS (Backend)

Le backend valide automatiquement les tokens via le JWKS endpoint:
```
http://localhost:8080/realms/ndjigi/protocol/openid-connect/certs
```

Si les logs du backend affichent:
```
✅ Token Keycloak valide
```

C'est bon ✅

---

## 9. Checklist de Déploiement

### Avant de commencer
- [ ] Tous les conteneurs Docker sont actifs et sains
- [ ] Keycloak accessible sur `http://localhost:8080/admin`
- [ ] Identifiants admin: `admin` / `Admin123456`

### Création du Realm
- [ ] Realm `ndjigi` créé
- [ ] Display name configuré
- [ ] Realm actif et visible dans le dropdown

### Clients
- [ ] Client `ndjigi-backend` créé avec:
  - [ ] Client Secret récupéré et noté
  - [ ] URLs de redirection configurées
  - [ ] Service account optionnel activé
- [ ] Client `ndjigi-web` créé avec:
  - [ ] Type PUBLIC (sans client secret)
  - [ ] URLs de redirection configurées
  - [ ] Implicit flow activé
- [ ] Client `ndjigi-admin-client` créé (optionnel) avec:
  - [ ] Service accounts enabled
  - [ ] Rôles `manage-users` et `view-users` assignés

### Utilisateurs
- [ ] Utilisateur `test_chauffeur` créé avec:
  - [ ] Mot de passe défini et testé
  - [ ] Rôle `chauffeur` assigné
- [ ] Utilisateur `test_passager` créé avec:
  - [ ] Mot de passe défini et testé
  - [ ] Rôle `passager` assigné
- [ ] Utilisateur `admin_ndjigi` créé (optionnel)

### Rôles
- [ ] Rôle `chauffeur` créé
- [ ] Rôle `passager` créé
- [ ] Rôles mappés dans les tokens (mappers configurés)

### Sécurité
- [ ] Paramètres CORS configurés
- [ ] Sessions configurées
- [ ] Client Scopes incluent `email`, `profile`, `openid`

### Validation
- [ ] Test de connexion (cURL) réussi
- [ ] Token décodé montre les rôles corrects
- [ ] API Backend valide les tokens sans erreur
- [ ] Endpoint sécurisé accessible avec token valide

### Configuration fichiers projet
- [ ] `docker-compose.yml` mis à jour avec:
  - [ ] `KEYCLOAK_CLIENT_SECRET`
  - [ ] `KEYCLOAK_ADMIN_CLIENT_SECRET` (si utilisé)
- [ ] Backend redémarré après mise à jour des secrets
- [ ] Logs du backend affichent "✅ Token Keycloak valide"

---

## 📞 Troubleshooting

| Problème | Solution |
|----------|----------|
| **"Connexion impossible à Keycloak"** | Vérifier que le conteneur keycloak est actif: `docker-compose logs keycloak` |
| **"Invalid client secret"** | Vérifier que le client secret dans `docker-compose.yml` correspond exactement à celui généré |
| **"Token invalide"** | Vérifier que le token n'est pas expiré (< 15 min) |
| **"Rôles n'apparaissent pas dans le token"** | Vérifier que le mapper "realm roles" est configuré dans le Client Scope |
| **"CORS error en frontend"** | Vérifier que `ndjigi-web` a les bonnes URLs de redirection |

---

## 📝 Commandes utiles

### Redémarrer Keycloak (preserve realm)
```bash
docker-compose restart keycloak
```

### Voir les logs
```bash
docker-compose logs -f keycloak
```

### Réinitialiser complètement (⚠️ détruit les données!)
```bash
# ⛔ NE PAS FAIRE - viole les règles strictes du projet
# docker-compose down -v
```

### Backup du realm (manuel)

1. Aller dans **Realm settings** → **Import/Export**
2. Cliquer **"Export"** (télécharge un JSON)
3. Sauvegarder le fichier en sécurité

---

**Guide complété le 2026-06-05 | Realm NDJIGI v1.0**
