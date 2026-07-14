# 📦 Pack auth N'DJIGI — Mode d'emploi

Tu as dans ce pack **tout ce qu'il faut** pour implémenter le module d'authentification de N'DJIGI proprement, phase par phase, avec Claude Code.

## 🗂 Contenu

```
auth-module/
├── README.md                          ← Tu es ici
├── docs/
│   ├── AUTH_ARCHITECTURE.md           ← Spécification cible complète
│   ├── auth-migration-plan.md         ← Roadmap par phases (cases à cocher)
│   ├── auth-flows.md                  ← Diagrammes Mermaid des flows
│   └── CLAUDE_CODE_PROMPTS.md         ← Prompts prêts à copier-coller
└── scripts/
    └── setup-realm.sh                 ← Configure Keycloak en CLI (idempotent)
```

## 🚀 Procédure de démarrage

### 1. Copie le pack dans ton projet

```powershell
cd C:\Users\Kader SAWADOGO\Desktop\ndjigiv1

# Crée la structure
mkdir docs
mkdir scripts\keycloak
```

Puis copie :
- `docs/AUTH_ARCHITECTURE.md` → `ndjigiv1/docs/AUTH_ARCHITECTURE.md`
- `docs/auth-migration-plan.md` → `ndjigiv1/docs/auth-migration-plan.md`
- `docs/auth-flows.md` → `ndjigiv1/docs/auth-flows.md`
- `docs/CLAUDE_CODE_PROMPTS.md` → `ndjigiv1/docs/CLAUDE_CODE_PROMPTS.md`
- `scripts/setup-realm.sh` → `ndjigiv1/scripts/keycloak/setup-realm.sh`

### 2. Commit ces docs dans Git

```powershell
git add docs/ scripts/
git commit -m "docs(auth): architecture cible et roadmap migration auth"
```

C'est important : ces docs sont l'**état persistant** entre tes sessions Claude Code.

### 3. Ouvre Claude Code dans VS Code

Dans VS Code, ouvre le projet `ndjigiv1`, lance Claude Code dans le terminal intégré.

### 4. Envoie le prompt fondateur

Ouvre `docs/CLAUDE_CODE_PROMPTS.md`, copie le **"Prompt fondateur"** (tout en haut). Colle-le dans Claude Code.

Claude va :
- Lire les 3 documents de spec
- Explorer ton code existant
- Te faire une synthèse + identifier les écarts
- **Ne pas coder** (c'est exprès)

Tu valides sa compréhension, tu corriges si besoin, et seulement après tu passes à la Phase 0.

### 5. Démarre la Phase 0

Copie le **"Prompt Phase 0"** depuis `CLAUDE_CODE_PROMPTS.md`, colle-le.

Claude va te proposer un plan détaillé. Tu valides, tu réponds "go", il code.

À la fin de la Phase 0 :
- Tu **testes manuellement** (la checklist est dans `auth-migration-plan.md`)
- Tu **commits** : `git commit -m "feat(auth): phase 0 - infra (redis + keycloak setup)"`
- Tu **passes à la Phase 1**

### 6. Itère phase par phase

Une phase = un prompt = un commit = un test manuel. Pas de raccourci.

## 📌 Points critiques à retenir

### 1. Le mot de passe admin Keycloak

Le script `setup-realm.sh` a besoin de `KEYCLOAK_ADMIN_PASSWORD` :

```powershell
$env:KEYCLOAK_ADMIN_PASSWORD = "TonMotDePasseFort_2026"
bash scripts/keycloak/setup-realm.sh
```

Sur Windows tu devras peut-être passer par WSL ou Git Bash pour exécuter le `.sh`.

Alternative : le script peut être traduit en `setup-realm.ps1` (PowerShell) — demande à Claude Code de le faire en début de Phase 0 si besoin.

### 2. Le client secret backend

À la fin du script, il affiche :
```
📋 KEYCLOAK_CLIENT_SECRET=xxxxxxxxxxxxxxx
   → À copier dans backend/.env
```

**Copie-le immédiatement** dans `backend/.env`. Si tu fais `docker compose down -v` plus tard, le secret change ; il faudra relancer le script et remettre à jour le `.env`.

### 3. Le délai de 24h

Tu m'as dit "fais ce que tu dois faire" pour le délai. Mon estimation honnête : **3 à 5 jours de travail focus** pour faire toutes les phases proprement en solo. Si tu vois que tu prends du retard, **n'accélère pas en zappant des étapes** — c'est là que les bugs de sécurité s'installent. Reporte plutôt les phases 5-8 (mobile, tests, docs finales) et garde un MVP web admin/gestionnaire impeccable.

### 4. Le multi-rôles (passager + chauffeur + propriétaire = 1 compte)

Cette logique est **hors scope de l'auth pure**. Elle vit dans le module "élargissement de profil" que tu as mis à part. Le frontend mobile devra :
- Lire `user.roles` depuis le token
- Si l'user a 2+ rôles métier, afficher un sélecteur de "mode actif"
- Le mode actif est stocké dans `utilisateur.active_role` côté backend
- Toutes les actions sont contextualisées par ce mode

Quand tu attaqueras ce module, garde en tête que la **source de rôles** reste Keycloak. L'élargissement = appeler l'Admin API pour ajouter un realm role à l'user.

## 🐛 En cas de doute

Si à un moment tu te demandes "est-ce que je dois faire X ?", la réponse est dans cet ordre :

1. **`AUTH_ARCHITECTURE.md`** — spec définitive
2. **`auth-migration-plan.md`** — découpage en phases
3. **`auth-flows.md`** — comportement attendu pas à pas
4. **`CLAUDE_CODE_PROMPTS.md`** — comment formuler à Claude
5. **Si ambiguïté** : demande-moi, ne laisse pas Claude inventer

## ✅ Checklist avant de commencer

- [ ] Les 4 docs sont commités dans `/docs/` du projet
- [ ] Le script `setup-realm.sh` est dans `/scripts/keycloak/`
- [ ] Le mot de passe admin Keycloak est connu (variable d'env ou noté)
- [ ] `docker compose up -d` fonctionne (Postgres, Keycloak, backend, web tous up)
- [ ] Claude Code est ouvert dans VS Code, au bon dossier
- [ ] Tu as 4-6h devant toi avant d'attaquer (les premières phases demandent de l'attention)

Quand toutes les cases sont cochées : **envoie le prompt fondateur**, et c'est parti. 🚀

Bon dev !
