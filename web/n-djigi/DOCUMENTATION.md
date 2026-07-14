# N'DJIGI Hub — Documentation Frontend Complète

## Table des matières
1. [Architecture générale](#1-architecture-générale)
2. [Contrat API et authentification](#2-contrat-api-et-authentification)
3. [Fichiers à modifier pour l'intégration backend](#3-fichiers-à-modifier-pour-lintégration-backend)
4. [Rôles et permissions](#4-rôles-et-permissions)
5. [Fonctionnalités existantes](#5-fonctionnalités-existantes)
6. [Comment ajouter une nouvelle fonctionnalité](#6-comment-ajouter-une-nouvelle-fonctionnalité)
7. [Pages et routes](#7-pages-et-routes)
8. [Mode démo vs production](#8-mode-démo-vs-production)

---

## 1. Architecture générale

```
src/
├── App.tsx                    ← Routeur principal, ProtectedRoute
├── main.tsx                   ← Point d'entrée React
├── index.css                  ← Variables CSS (couleurs, polices)
│
├── types/index.ts             ← TOUS les types TypeScript
│
├── services/api.ts            ← TOUTES les requêtes HTTP (axios)
├── data/mockData.ts           ← Données de démonstration
│
├── contexts/AuthContext.tsx   ← État global de l'utilisateur connecté
├── hooks/
│   ├── useToast.tsx           ← Notifications toast
│   └── useMobile.ts           ← Détection mobile
│
├── lib/utils.ts               ← Fonctions utilitaires (formatFCFA, formatDate…)
│
├── layouts/AppLayout.tsx      ← Layout principal (sidebar + header + outlet)
├── components/
│   ├── AppSidebar.tsx         ← Sidebar avec navigation par rôle
│   ├── KpiCard.tsx            ← Carte de KPI réutilisable
│   ├── StatusBadge.tsx        ← Badge de statut coloré
│   └── Toaster.tsx            ← Affichage des notifications
│
└── pages/
    ├── Login.tsx              ← Page de connexion (sans boutons démo)
    ├── NotFound.tsx           ← Page 404
    ├── auth/
    │   ├── ForgotPassword.tsx ← Demande de réinitialisation par email
    │   ├── ResetPassword.tsx  ← Formulaire reset (lit ?token= dans l'URL)
    │   └── ChangePassword.tsx ← Changer le mot de passe (connecté)
    ├── admin/
    │   ├── Dashboard.tsx      ← KPIs + graphiques
    │   ├── Users.tsx          ← Liste + créer + dépôt wallet
    │   ├── Documents.tsx      ← Valider / rejeter documents
    │   ├── Trips.tsx          ← Courses en cours + historique
    │   ├── Finance.tsx        ← KPIs finances + transactions
    │   ├── Parkings.tsx       ← Gestion des parkings
    │   ├── Support.tsx        ← Tickets + remboursements
    │   └── Config.tsx         ← Zones, catégories, codes promo
    └── parkeur/
        └── ParkeurDashboard.tsx ← Dashboard gestionnaire de parking
```

---

## 2. Contrat API et authentification

### Format de réponse standard

**Toutes** les réponses de votre backend doivent suivre ce format :

```json
{
  "success": true,
  "message": "Message lisible",
  "data": { ... },
  "errors": null
}
```

Le frontend unwrap automatiquement ce format dans `src/services/api.ts` via la fonction `extractData()` :

```typescript
// Si success=false, l'erreur est propagée avec err.message = message du backend
function extractData<T>(apiResponse: ApiResponse<T>): T {
  if (!apiResponse.success) {
    const err: any = new Error(apiResponse.message)
    err.backendErrors = apiResponse.errors
    throw err
  }
  return apiResponse.data
}
```

### Réponse de login (format exact attendu)

```json
{
  "success": true,
  "message": "Connexion réussie.",
  "data": {
    "user": {
      "id_utilisateur": "uuid",
      "numero_telephone": "string",
      "email": "string",
      "nom": "string",
      "prenom": "string",
      "photo_profil": null,
      "adresse": null,
      "tentatives_connexion": 0,
      "bloque_jusqu_au": null,
      "date_inscription": "ISO8601",
      "statut_compte": "actif",
      "auth_provider": "email",
      "note_moyenne": null,
      "deux_fa_activee": false,
      "supprime_le": null,
      "utilisateur_role": [
        {
          "id_utilisateur": "uuid",
          "role": "admin",
          "actif": true,
          "date_activation": "ISO8601",
          "date_desactivation": null
        }
      ]
    },
    "permissions": ["utilisateur:lire", "parking:gerer", ...],
    "tokens": {
      "accessToken": "jwt...",
      "refreshToken": "jwt..."
    }
  }
}
```

### Stockage côté frontend (localStorage)

| Clé | Contenu |
|-----|---------|
| `ndjigi_access_token` | JWT access token |
| `ndjigi_refresh_token` | JWT refresh token |
| `ndjigi_user` | Objet AuthUser sérialisé |
| `ndjigi_permissions` | Tableau de permissions JSON |

### Refresh token automatique

Quand un appel retourne 401, le frontend tente automatiquement un refresh :
```
POST /api/v1/auth/refresh
Body: { refreshToken: "..." }
Response: { success: true, data: { tokens: { accessToken: "..." } } }
```
Si le refresh échoue → déconnexion et redirection `/login`.

---

## 3. Fichiers à modifier pour l'intégration backend

### 3.1 `.env` — Variable principale à changer

```env
# Désactiver le mode démo pour utiliser le vrai backend
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:3001
```

### 3.2 `vite.config.ts` — Proxy (déjà configuré)

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // ← URL de votre backend
      changeOrigin: true,
    },
  },
},
```
Tous les appels `/api/v1/...` du frontend sont redirigés vers votre backend. En production, configurez nginx pour faire la même chose.

### 3.3 `src/services/api.ts` — URLs des endpoints

Chaque service correspond à un module de routes. Si votre backend utilise des URLs différentes, modifiez uniquement les lignes `api.get/post/put/patch/delete(...)` :

```typescript
// Exemple : si votre route liste d'utilisateurs est /users au lieu de /utilisateurs
const { data } = await api.get<ApiResponse<PaginatedResponse<Utilisateur>>>('/users', { params })
//                                                                             ^^^^^^ changer ici
```

### 3.4 Mapping des endpoints attendus

| Service frontend | Méthode | URL attendue |
|-----------------|---------|--------------|
| `authService.login` | POST | `/api/v1/auth/login` |
| `authService.logout` | POST | `/api/v1/auth/logout` |
| `authService.forgotPassword` | POST | `/api/v1/auth/forgot-password` |
| `authService.resetPassword` | POST | `/api/v1/auth/reset-password` |
| `authService.changePassword` | POST | `/api/v1/auth/change-password` |
| `utilisateursService.list` | GET | `/api/v1/utilisateurs` |
| `utilisateursService.create` | POST | `/api/v1/utilisateurs` |
| `utilisateursService.updateStatut` | PATCH | `/api/v1/utilisateurs/:id/statut` |
| `utilisateursService.depot` | POST | `/api/v1/utilisateurs/depot` |
| `utilisateursService.getWallet` | GET | `/api/v1/utilisateurs/:id/wallet` |
| `documentsService.listEnAttente` | GET | `/api/v1/documents?statut=en_attente` |
| `documentsService.valider` | PATCH | `/api/v1/documents/:id/valider` |
| `documentsService.rejeter` | PATCH | `/api/v1/documents/:id/rejeter` |
| `trajetsService.enCours` | GET | `/api/v1/trajets?statut=en_cours` |
| `trajetsService.historique` | GET | `/api/v1/trajets/historique` |
| `financesService.kpis` | GET | `/api/v1/finances/kpis` |
| `financesService.transactions` | GET | `/api/v1/finances/transactions` |
| `financesService.walletPlateforme` | GET | `/api/v1/finances/wallet-plateforme` |
| `financesService.rembourser` | POST | `/api/v1/finances/rembourser` |
| `supportService.list` | GET | `/api/v1/support/tickets` |
| `supportService.updateStatut` | PATCH | `/api/v1/support/tickets/:id/statut` |
| `parkingsService.list` | GET | `/api/v1/parkings` |
| `parkeurService.receptionVehicule` | POST | `/api/v1/parkings/:id/entree` |
| `parkeurService.sortieVehicule` | POST | `/api/v1/parkings/:id/sortie` |
| `parkeurService.declencherMaintenance` | POST | `/api/v1/parkings/:id/maintenance` |
| `configService.listZones` | GET | `/api/v1/config/zones` |
| `configService.listPromos` | GET | `/api/v1/config/promos` |
| `dashboardService.kpis` | GET | `/api/v1/dashboard/kpis` |

---

## 4. Rôles et permissions

### Rôles reconnus par le frontend

| Rôle | Interface | Routes accessibles |
|------|-----------|-------------------|
| `admin` | Tableau de bord admin complet | Toutes |
| `super_admin` | Idem admin | Toutes |
| `gestionnaire` | Dashboard parking | `/` uniquement |
| `chauffeur` | — (pas d'interface admin) | Refusé |
| `passager` | — | Refusé |
| `proprietaire` | — | Refusé |

### Comment le rôle est déterminé

Dans `src/contexts/AuthContext.tsx`, la fonction `getPrimaryRole()` analyse `utilisateur_role` et retourne le rôle principal :

```typescript
// Priorité : admin > super_admin > gestionnaire > chauffeur > proprietaire > passager
function getPrimaryRole(roles): UserRole {
  if (roles.includes('admin') || roles.includes('super_admin')) return 'admin'
  if (roles.includes('gestionnaire')) return 'gestionnaire'
  // ...
}
```

### Système de permissions

Le frontend expose `can(permission)` via `useAuth()` :

```typescript
const { can } = useAuth()
if (can('finance:rembourser')) { /* afficher bouton remboursement */ }
```

Pour utiliser dans un composant :
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MonComposant() {
  const { can } = useAuth()
  return (
    <div>
      {can('utilisateur:creer') && (
        <button>Créer un utilisateur</button>
      )}
    </div>
  )
}
```

---

## 5. Fonctionnalités existantes

### 5.1 Authentification
- **Login** : `POST /auth/login` → stockage tokens + user dans localStorage
- **Mot de passe oublié** : envoie email → lien `/auth/reset-password?token=XXXX`
- **Reset mot de passe** : lit le token dans l'URL, appelle `POST /auth/reset-password`
- **Changer mot de passe** : accessible via sidebar → `/profil/mot-de-passe`
- **Refresh token** : automatique sur 401
- **Déconnexion** : vide localStorage, redirige `/login`

### 5.2 Gestion des utilisateurs (admin)
- Liste paginée avec filtres (rôle, statut, recherche)
- **Créer un utilisateur** : bouton "Créer un utilisateur", modale complète
  - Rôles créables : gestionnaire, chauffeur, passager, propriétaire
  - Si rôle = gestionnaire : sélection du parking associé obligatoire
- Changer le statut (actif/suspendu/en_attente) inline
- **Dépôt wallet** : bouton 💰 sur les passagers/propriétaires → modale de dépôt

### 5.3 Support et remboursements
- Liste des tickets avec filtres (statut, recherche)
- Modale de détail : voir description, changer statut
- **Remboursement** : si `eligible_remboursement=true` sur le ticket, bouton visible → formulaire montant + motif → `POST /finances/rembourser` → ticket passé en "résolu"

### 5.4 Dashboard gestionnaire
- Véhicules présents dans son parking
- Réception / sortie de véhicule
- Déclenchement maintenance
- Historique des mouvements

---

## 6. Comment ajouter une nouvelle fonctionnalité

### Exemple A : Ajouter un wallet global plateforme dans Finance

**Étape 1** — Ajouter le type si nécessaire dans `src/types/index.ts` :
```typescript
// Déjà présent dans FinanceKpis :
export interface FinanceKpis {
  // ...
  solde_wallet_plateforme?: number  // ← déjà là
}
```

**Étape 2** — Ajouter la méthode dans `src/services/api.ts` :
```typescript
// Déjà présent dans financesService :
walletPlateforme: async () => {
  const { data } = await api.get('/finances/wallet-plateforme')
  return extractData(data)
}
```

**Étape 3** — Utiliser dans `src/pages/admin/Finance.tsx` :
```tsx
const [wallet, setWallet] = useState<{ solde: number } | null>(null)

useEffect(() => {
  financesService.walletPlateforme().then(setWallet)
}, [])

// Dans le JSX :
<KpiCard
  title="Wallet Plateforme"
  value={wallet ? formatFCFA(wallet.solde) : '—'}
  icon={Wallet}
/>
```

---

### Exemple B : Ajouter une fonctionnalité de remboursement direct depuis Finance

**Étape 1** — La méthode existe déjà dans `src/services/api.ts` :
```typescript
financesService.rembourser({ id_utilisateur, montant, motif })
```

**Étape 2** — Ajouter un bouton dans la page Finance (ligne de transaction) :
```tsx
// Dans Finance.tsx, dans le tableau des transactions :
<button onClick={() => setRembTarget(t)} className="...">
  Rembourser
</button>
```

**Étape 3** — Ajouter la modale de remboursement (même pattern que DepotModal dans Users.tsx).

---

### Exemple C : Ajouter une nouvelle page

1. Créer `src/pages/admin/MaPage.tsx`
2. L'importer dans `src/App.tsx`
3. Ajouter la route :
```tsx
<Route path="ma-page" element={<ProtectedRoute adminOnly><MaPage /></ProtectedRoute>} />
```
4. Ajouter l'item de navigation dans `src/components/AppSidebar.tsx` :
```tsx
const ADMIN_NAV = [
  // ... existants
  { to: '/ma-page', label: 'Ma Page', icon: MonIcone },
]
```

---

### Exemple D : Utiliser les permissions pour conditionner l'affichage

```tsx
import { useAuth } from '@/contexts/AuthContext'

function ActionSensible() {
  const { can } = useAuth()

  // N'afficher que si l'admin a la permission
  if (!can('finance:rembourser')) return null

  return <button>Rembourser</button>
}
```

---

## 7. Pages et routes

### Routes publiques (sans authentification)

| URL | Page | Description |
|-----|------|-------------|
| `/login` | `Login.tsx` | Connexion |
| `/auth/forgot-password` | `ForgotPassword.tsx` | Demande de reset par email |
| `/auth/reset-password?token=XXX` | `ResetPassword.tsx` | Formulaire nouveau mot de passe |

### Routes protégées (tous les rôles connectés)

| URL | Page | Description |
|-----|------|-------------|
| `/` | `Dashboard.tsx` ou `ParkeurDashboard.tsx` | Selon le rôle |
| `/profil/mot-de-passe` | `ChangePassword.tsx` | Changer son mot de passe |

### Routes admin uniquement

| URL | Page | Description |
|-----|------|-------------|
| `/utilisateurs` | `Users.tsx` | Liste + créer + dépôt |
| `/documents` | `Documents.tsx` | Valider / rejeter |
| `/trajets` | `Trips.tsx` | Courses en cours + historique |
| `/finances` | `Finance.tsx` | KPIs + transactions |
| `/parkings` | `Parkings.tsx` | Gestion parkings |
| `/support` | `Support.tsx` | Tickets + remboursements |
| `/configuration` | `Config.tsx` | Zones, catégories, promos |

---

## 8. Mode démo vs production

### Activer le vrai backend

```env
# .env
VITE_DEMO_MODE=false
VITE_API_URL=http://votre-backend.com
```

### Fonctionnement du mode démo

Quand `VITE_DEMO_MODE=true`, chaque méthode dans `api.ts` utilise des données in-memory de `mockData.ts`. Les mutations (créer, modifier, supprimer) fonctionnent et persistent pendant la session du navigateur.

Comptes démo disponibles :
- Admin : `admin@ndjigi.bf` / `admin123`
- Gestionnaire : `gestionnaire@ndjigi.bf` / `gestionnaire123`

### Pattern de chaque service (example)

```typescript
export const monService = {
  maMethode: async (params) => {
    if (IS_DEMO) {
      // ← code mock, retourne des données locales
      await delay()
      return donneesMock
    }
    // ← code réel, appel HTTP
    const { data } = await api.get<ApiResponse<MonType>>('/mon-endpoint', { params })
    return extractData(data)  // ← unwrap { success, data }
  }
}
```

Pour ajouter une méthode : copiez ce pattern dans `src/services/api.ts`, ajoutez la logique mock dans `src/data/mockData.ts`, et définissez le type dans `src/types/index.ts`.

---

## Résumé des modifications apportées

| Fichier | Modification |
|---------|-------------|
| `types/index.ts` | Aligné sur contrat backend réel (`BackendUser`, `LoginResponseData`, `tokens`, rôle `gestionnaire`) |
| `contexts/AuthContext.tsx` | Lit `data.tokens.accessToken`, construit `AuthUser` depuis `utilisateur_role`, expose `can()` |
| `services/api.ts` | Unwrap `{ success, data }` auto, refresh token, + nouvelles méthodes (create user, depot, rembourser, support, wallet) |
| `data/mockData.ts` | Adapté au format réel du backend, ajout tickets support |
| `pages/Login.tsx` | Suppression boutons démo, ajout lien "mot de passe oublié" |
| `pages/auth/ForgotPassword.tsx` | **NOUVEAU** — Demande reset par email |
| `pages/auth/ResetPassword.tsx` | **NOUVEAU** — Formulaire reset (lit `?token=`) |
| `pages/auth/ChangePassword.tsx` | **NOUVEAU** — Changer mot de passe (connecté) |
| `pages/admin/Users.tsx` | + Bouton "Créer un utilisateur", modale complète, dépôt wallet |
| `pages/admin/Support.tsx` | **REMPLACÉ** — Tickets réels + remboursement depuis ticket |
| `components/AppSidebar.tsx` | Rôle `gestionnaire`, lien "Mot de passe" |
| `components/StatusBadge.tsx` | Ajout statuts tickets (ouvert, resolu, ferme), dépôt, remboursement |
| `App.tsx` | Nouvelles routes auth, route `/profil/mot-de-passe`, gestion `gestionnaire` |
