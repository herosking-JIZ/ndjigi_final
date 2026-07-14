# Configuration Complète de Keycloak - Guide Étape par Étape

**Date:** 2026-05-18  
**Version:** 1.0  
**État:** Production

---

## 📋 Table des Matières

1. [Accès à Keycloak Admin Console](#accès-à-keycloak-admin-console)
2. [Créer le Realm "ndjigi"](#créer-le-realm-ndjigi)
3. [Configurer les Clients](#configurer-les-clients)
4. [Créer les Rôles](#créer-les-rôles)
5. [Créer l'Utilisateur Admin de Test](#créer-lutilisateur-admin-de-test)
6. [Tester la Configuration](#tester-la-configuration)
7. [Dépannage](#dépannage)

---

## 1️⃣ Accès à Keycloak Admin Console

### Étape 1.1 : Accédez à l'URL Keycloak

Ouvrez votre navigateur et allez à :
```
http://localhost:8080/admin
```

### Étape 1.2 : Identifiez-vous avec les credentials par défaut

**Écran de connexion :**
```
┌─────────────────────────────────────┐
│  Keycloak Admin Console             │
├─────────────────────────────────────┤
│                                     │
│  Username: │ admin               │  │
│  Password: │ ••••••••••••••••    │  │
│                                     │
│           [ Sign In ]               │
│                                     │
└─────────────────────────────────────┘
```

**Identifiants :**
- **Username:** `admin`
- **Password:** `admin`

Cliquez sur **Sign In**

---

## 2️⃣ Créer le Realm "ndjigi"

### Étape 2.1 : Accédez à la page de création de realm

En haut à gauche de l'écran, vous verrez un sélecteur de realm avec **"Master"** affiché.

```
┌──────────────────┐
│ Master ▼         │  ← Cliquez ici
└──────────────────┘
```

Cliquez sur le sélecteur pour afficher les options.

### Étape 2.2 : Créez un nouveau realm

Cliquez sur le bouton **"Create realm"** (il apparaît dans un menu déroulant).

```
┌──────────────────────────┐
│ Master            ▼      │
├──────────────────────────┤
│ Create realm             │  ← Cliquez ici
│ Add realm                │
└──────────────────────────┘
```

### Étape 2.3 : Remplissez le formulaire de création

Un formulaire s'affiche :

```
┌───────────────────────────────────────────┐
│  Create a new realm                       │
├───────────────────────────────────────────┤
│                                           │
│  Realm name:  │ ndjigi                 │ │
│                                           │
│               [ Create ]   [ Cancel ]     │
│                                           │
└───────────────────────────────────────────┘
```

**Remplissez :**
- **Realm name:** `ndjigi`

Cliquez sur **Create**

### Étape 2.4 : Vérifiez la création

Après la création, vous devriez voir le realm "ndjigi" sélectionné en haut à gauche.

```
┌──────────────────┐
│ ndjigi ▼         │  ← Confirmé
└──────────────────┘
```

---

## 3️⃣ Configurer les Clients

Les **clients** sont les applications qui se connectent à Keycloak (backend et frontend).

### Étape 3.1 : Allez à la section "Clients"

Dans le menu gauche, cliquez sur **Clients**

```
├─ Manage
│  ├─ Clients              ← Cliquez ici
│  ├─ Client Scopes
│  ├─ Roles
│  └─ ...
```

### Étape 3.2 : Créez le client backend

Cliquez sur le bouton **"Create client"** en haut à droite.

```
┌───────────────────────────────────────┐
│  Clients                     [Create] │
└───────────────────────────────────────┘
```

### Étape 3.3 : Configurer le client backend (ndjigi-backend)

**Onglet "General" :**

```
┌──────────────────────────────────────────┐
│  Create a client                         │
├──────────────────────────────────────────┤
│                                          │
│  Client ID: │ ndjigi-backend           │ │
│  Name:      │ N'DJIGI Backend          │ │
│                                          │
│               [ Create ]   [ Cancel ]    │
│                                          │
└──────────────────────────────────────────┘
```

**Remplissez :**
- **Client ID:** `ndjigi-backend`
- **Name:** `N'DJIJI Backend`

Cliquez sur **Create**

### Étape 3.4 : Configurer les paramètres du client backend

Une fois créé, vous êtes dans la page de configuration. Allez à l'onglet **"Settings"**.

**Paramètres à configurer :**

```
┌──────────────────────────────────────────┐
│  Clients > ndjigi-backend                │
├──────────────────────────────────────────┤
│  [General] [Settings] [Credentials] ...  │
│                                          │
│  Capability config                       │
│  ├─ Client authentication: ON            │
│  ├─ Authorization:        OFF            │
│  └─ Authentication flow:                 │
│     └─ Service accounts roles: ON        │
│                                          │
│  Valid Redirect URIs:                    │
│  ├─ http://localhost:3000/*             │
│  ├─ http://localhost:8000/*             │
│                                          │
│  Web Origins:                            │
│  ├─ http://localhost:3000               │
│  ├─ http://localhost:8000               │
│                                          │
│                        [ Save ]          │
└──────────────────────────────────────────┘
```

**À faire :**

1. **Client authentication:** Vérifiez que c'est **ON**
2. **Service accounts roles:** Vérifiez que c'est **ON**
3. **Valid Redirect URIs:** Ajouter
   - `http://localhost:3000/*`
   - `http://localhost:8000/*`
4. **Web Origins:** Ajouter
   - `http://localhost:3000`
   - `http://localhost:8000`

Cliquez sur **Save**

### Étape 3.5 : Obtenez le Client Secret

Allez à l'onglet **"Credentials"**

```
┌──────────────────────────────────────────┐
│  Clients > ndjigi-backend                │
├──────────────────────────────────────────┤
│  [General] [Settings] [Credentials] ...  │
│                                          │
│  Client Authenticator:                   │
│  ├─ Client ID and Secret  (selected)    │
│                                          │
│  Client Secret:                          │
│  ├─ G86nsu5BwsbS5no2HB76HWuTmprCorte  │ │  ← COPIER CETTE VALEUR
│                                          │
│  Regenerate:  [ Regenerate Secret ]      │
│                                          │
└──────────────────────────────────────────┘
```

**Vérifiez que le Client Secret est :**
```
G86nsu5BwsbS5no2HB76HWuTmprCorte
```

✅ C'est la bonne valeur (déjà dans votre `.env`)

### Étape 3.6 : Créez le client frontend

Retournez à **"Clients"** et créez un nouveau client.

**Onglet "General" :**
- **Client ID:** `ndjigi-web`
- **Name:** `N'DJIGI Frontend`
- **Client type:** `Public` (Important!)

Cliquez sur **Create**

### Étape 3.7 : Configurer le client frontend

**Onglet "Settings" :**

```
┌──────────────────────────────────────────┐
│  Clients > ndjigi-web                    │
├──────────────────────────────────────────┤
│  Client authentication: OFF              │
│  Authorization: OFF                      │
│                                          │
│  Valid Redirect URIs:                    │
│  ├─ http://localhost:3000/*              │
│                                          │
│  Web Origins:                            │
│  ├─ http://localhost:3000                │
│                                          │
│                        [ Save ]          │
└──────────────────────────────────────────┘
```

**À faire :**

1. **Client authentication:** OFF (car c'est un client public)
2. **Valid Redirect URIs:** Ajouter
   - `http://localhost:3000/*`
3. **Web Origins:** Ajouter
   - `http://localhost:3000`

Cliquez sur **Save**

---

## 4️⃣ Créer les Rôles

### Étape 4.1 : Allez à la section "Roles"

Dans le menu gauche, cliquez sur **Roles**

```
├─ Manage
│  ├─ Clients
│  ├─ Roles                ← Cliquez ici
│  └─ ...
```

### Étape 4.2 : Créez le rôle "admin"

Cliquez sur **"Create role"**

```
┌─────────────────────────────────┐
│  Roles              [Create role] │
└─────────────────────────────────┘
```

**Remplissez :**
- **Role name:** `admin`
- **Description:** `Rôle administrateur`

Cliquez sur **Create**

### Étape 4.3 : Créez le rôle "ndjigi-admin"

Créez un autre rôle :

**Remplissez :**
- **Role name:** `ndjigi-admin`
- **Description:** `Administrateur N'DJIGI`

Cliquez sur **Create**

### Étape 4.4 : Créez les autres rôles (optionnel mais recommandé)

Créez ces rôles également :

```
┌──────────────────────────────┐
│ Role            Description  │
├──────────────────────────────┤
│ gestionnaire    Gestionnaire  │
│ chauffeur       Chauffeur     │
│ passager        Passager      │
│ proprietaire    Propriétaire  │
└──────────────────────────────┘
```

---

## 5️⃣ Créer l'Utilisateur Admin de Test

### Étape 5.1 : Allez à la section "Users"

Dans le menu gauche, cliquez sur **Users**

```
├─ Manage
│  ├─ Users                ← Cliquez ici
│  └─ ...
```

### Étape 5.2 : Créez un nouvel utilisateur

Cliquez sur **"Create new user"**

```
┌────────────────────────────────────┐
│  Users                 [Create new] │
└────────────────────────────────────┘
```

### Étape 5.3 : Remplissez les informations

```
┌────────────────────────────────────┐
│  Create user                       │
├────────────────────────────────────┤
│                                    │
│  Username:   │ admin            │ │
│  Email:      │ admin@ndjigi.test│ │
│  First name: │ Test             │ │
│  Last name:  │ Admin            │ │
│                                    │
│  ☑ Email verified                 │
│  ☑ Enabled                        │
│                                    │
│         [ Create ]  [ Cancel ]     │
│                                    │
└────────────────────────────────────┘
```

**Remplissez :**
- **Username:** `admin`
- **Email:** `admin@ndjigi.test`
- **First name:** `Test`
- **Last name:** `Admin`
- **Email verified:** ✅ Coché
- **Enabled:** ✅ Coché

Cliquez sur **Create**

### Étape 5.4 : Définissez le mot de passe

Une fois créé, allez à l'onglet **"Credentials"**

```
┌──────────────────────────────────┐
│  Users > admin                   │
├──────────────────────────────────┤
│  [General] [Credentials] [Role M.] ...
│                                  │
│  Set password                    │
│  ├─ Password:  │ Admin@12345   │ │
│  ├─ Confirm:   │ Admin@12345   │ │
│  └─ Temporary: ☐ (décoché)     │
│                                  │
│                    [ Set Password ]
│                                  │
└──────────────────────────────────┘
```

**Remplissez :**
- **Password:** `Admin@12345`
- **Confirm password:** `Admin@12345`
- **Temporary:** ☐ (décoché - pour un mot de passe permanent)

Cliquez sur **Set Password**

### Étape 5.5 : Assignez les rôles

Allez à l'onglet **"Role mapping"**

```
┌──────────────────────────────────┐
│  Users > admin                   │
├──────────────────────────────────┤
│  [General] [Credentials] [Role M.]
│                                  │
│  Realm roles                     │
│  ├─ Available roles:             │
│  │  ├─ admin                     │
│  │  ├─ ndjigi-admin              │
│  │  ├─ chauffeur                 │
│  │  └─ ...                       │
│  │                               │
│  │  [ Select... ]                │
│  │                               │
│  ├─ Assigned roles:              │
│  │  (vide)                       │
│                                  │
└──────────────────────────────────┘
```

**À faire :**

1. Dans **"Available roles"**, sélectionnez :
   - `admin`
   - `ndjigi-admin`

2. Cliquez sur le bouton **"Add selected"**

3. Vérifiez que les rôles apparaissent dans **"Assigned roles"** :
   ```
   ✓ admin
   ✓ ndjigi-admin
   ```

---

## 6️⃣ Tester la Configuration

### Étape 6.1 : Accédez au frontend

Allez à :
```
http://localhost:3000/login
```

Vous devriez voir une page de connexion.

### Étape 6.2 : Connectez-vous avec l'utilisateur admin

```
┌──────────────────────────────────┐
│  Connexion                       │
├──────────────────────────────────┤
│                                  │
│  Email:    │ admin@ndjigi.test│ │
│  Password: │ •••••••••••••    │ │
│                                  │
│           [ Se connecter ]       │
│                                  │
└──────────────────────────────────┘
```

**Identifiants :**
- **Email:** `admin@ndjigi.test`
- **Password:** `Admin@12345`

Cliquez sur **Se connecter**

### Étape 6.3 : Vérifiez l'accès

Après la connexion, vous devriez :
- ✅ Accéder au dashboard
- ✅ Voir les pages admin
- ✅ Pouvoir créer des gestionnaires

---

## 7️⃣ Dépannage

### Problème : "Realm not found" ou "Client not found"

**Solution :**
1. Vérifiez que le realm `ndjigi` est sélectionné (en haut à gauche)
2. Vérifiez que les clients sont créés dans le bon realm
3. Vérifiez que les noms correspondent exactement (sensible à la casse)

### Problème : "Invalid client secret"

**Solution :**
1. Allez à **Clients > ndjigi-backend > Credentials**
2. Copiez le Client Secret affiché
3. Mettez-le à jour dans votre `.env` :
   ```
   KEYCLOAK_CLIENT_SECRET=<votre-secret>
   ```
4. Redémarrez le backend

### Problème : "Redirect URI mismatch"

**Solution :**
1. Allez à **Clients > ndjigi-web > Settings**
2. Vérifiez que **Valid Redirect URIs** contient :
   ```
   http://localhost:3000/*
   http://localhost:3000
   ```
3. Vérifiez que **Web Origins** contient :
   ```
   http://localhost:3000
   ```

### Problème : "Access Denied" après connexion

**Solution :**
1. Vérifiez que l'utilisateur a les rôles assignés (onglet Role Mapping)
2. Vérifiez que le rôle `admin` ou `ndjigi-admin` est assigné
3. Déconnectez et reconnectez-vous pour appliquer les changements

---

## 📝 Récapitulatif

### Configuration Keycloak

| Élément | Valeur |
|---------|--------|
| **Realm** | `ndjigi` |
| **Client Backend** | `ndjigi-backend` |
| **Client Frontend** | `ndjigi-web` |
| **Client Secret Backend** | `G86nsu5BwsbS5no2HB76HWuTmprCorte` |
| **Rôles** | `admin`, `ndjigi-admin`, `gestionnaire`, `chauffeur`, `passager`, `proprietaire` |

### Utilisateur de Test

| Paramètre | Valeur |
|-----------|--------|
| **Username** | `admin` |
| **Email** | `admin@ndjigi.test` |
| **Password** | `Admin@12345` |
| **Rôles** | `admin`, `ndjigi-admin` |

### URLs Importantes

| Service | URL |
|---------|-----|
| **Keycloak Admin** | http://localhost:8080/admin |
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/api/v1/docs |

---

## ✅ Vérification Finale

Après avoir complété toutes les étapes :

- [ ] Realm `ndjigi` créé
- [ ] Client `ndjigi-backend` configuré
- [ ] Client `ndjigi-web` configuré
- [ ] Rôles créés (`admin`, `ndjigi-admin`, etc.)
- [ ] Utilisateur `admin` créé
- [ ] Mot de passe configuré
- [ ] Rôles assignés à l'utilisateur
- [ ] Connexion au frontend réussie
- [ ] Accès au dashboard confirmé

---

**Date de completion:** [À remplir]  
**Status:** ✅ Configuration complète

