# N'DJIGI Hub — Interface d'administration

Panneau d'administration web pour la plateforme de mobilité N'DJIGI.  
**Deux profils :** Administrateur · Parkeur (agent terrain)

## 🚀 Démarrage en 3 commandes

```bash
npm install
# L'application démarre en mode démo (sans backend) par défaut
npm run dev
# → http://localhost:5173
```

**Comptes de démonstration :**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@ndjigi.bf | admin123 |
| Parkeur | parkeur@ndjigi.bf | parkeur123 |

## 🔌 Connexion au vrai backend

Dans `.env`, changer :
```env
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:3001
```

Voir `API_CONTRACT.md` pour le contrat complet des endpoints Node/Express attendus.

## 📦 Build production

```bash
npm run build
npm run preview
```

## 🏗️ Architecture

```
src/
├── data/
│   └── mockData.ts        # Données de démonstration (Burkina Faso)
├── services/
│   └── api.ts             # Couche API : réel OU mock selon VITE_DEMO_MODE
├── types/
│   └── index.ts           # Types TypeScript complets (AuthUser, Trajet, Parking…)
├── contexts/
│   └── AuthContext.tsx    # Session JWT (localStorage)
├── hooks/
│   ├── useToast.tsx       # Notifications toast
│   └── useMobile.ts       # Détection mobile
├── layouts/
│   └── AppLayout.tsx      # Sidebar collapsible + header responsive
├── components/
│   ├── AppSidebar.tsx     # Navigation contextuelle (admin / parkeur)
│   ├── KpiCard.tsx        # Carte KPI avec tendance
│   ├── StatusBadge.tsx    # Badge de statut (23 états supportés)
│   └── Toaster.tsx        # Notifications en bas à droite
└── pages/
    ├── Login.tsx
    ├── NotFound.tsx
    ├── admin/             # Dashboard · Users · Documents · Trips
    │                      # Finance · Parkings · Config · Support
    └── parkeur/           # ParkeurDashboard (réception · sortie · maintenance)
```

## 🎨 Design System

- **Couleur primaire :** Orange `hsl(24, 95%, 53%)`
- **Polices :** Space Grotesk (titres) + DM Sans (corps) + JetBrains Mono (codes)
- **Dark mode :** CSS variables, support complet
- **Animations :** fade-in sur pages, pulse sur skeletons

## 📡 Variables d'environnement

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_DEMO_MODE` | `true` / `false` | Mode démo sans backend |
| `VITE_API_URL` | `http://localhost:3001` | URL backend Node |
