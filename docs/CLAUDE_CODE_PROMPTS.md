# Prompts Claude Code pour l'implémentation par phases

> Ce document contient les **prompts prêts à l'emploi** pour piloter Claude Code dans VS Code.
> 
> **Règle d'or** : à chaque phase, copie le prompt, attends que Claude te propose un plan, **valide**, puis seulement après laisse-le coder.

---

## 🎯 Prompt fondateur (à envoyer AVANT TOUT)

À envoyer en **première session** de Claude Code. C'est ce qui établit le contexte pour toutes les phases.

```
Je vais te confier le module d'authentification du projet N'DJIGI.

Avant de coder quoi que ce soit, lis attentivement ces 3 documents qui définissent 
la cible et le plan :

1. /docs/AUTH_ARCHITECTURE.md  → spécification complète
2. /docs/auth-migration-plan.md → roadmap par phases avec cases à cocher
3. /docs/auth-flows.md          → diagrammes de séquence pour chaque flow

Puis explore le code existant pour comprendre l'état actuel :
- docker-compose.yml
- backend/app.js
- backend/src/middlewares/
- backend/src/controllers/ (notamment auth)
- backend/src/routes/
- backend/prisma/schema.prisma
- backend/.env (note la structure, pas les valeurs)
- web/n-djigi/src/contexts/AuthContext.tsx
- web/n-djigi/src/services/ (notamment keycloak.ts et authService.ts si présents)

Ne code rien pour l'instant. Quand tu as fini, dis-moi :
1. Une synthèse en 5 lignes de ce que tu as compris de l'état actuel
2. Les écarts entre l'état actuel et l'architecture cible
3. Les points qui te semblent flous ou contradictoires entre les docs et le code
4. Confirme que tu vas suivre le plan phase par phase, en attendant mon "go" à chaque étape

Ne propose pas de raccourci, ne mélange pas les phases.
```

---

## ☐ Prompt Phase 0 — Préparation infrastructure

```
Phase 0 du plan : Préparation infrastructure.

Référence : /docs/auth-migration-plan.md section "Phase 0"

Ta mission :
1. Ajouter Redis au docker-compose.yml (image redis:7-alpine, healthcheck inclus, 
   volume redis_data, sur le réseau ndjigi-network)
2. Installer côté backend : ioredis, jwks-rsa, libphonenumber-js, 
   express-rate-limit, rate-limit-redis
3. Créer backend/src/config/redis.js (singleton ioredis avec reconnect logic)
4. Créer backend/src/config/keycloak.js exportant :
   - une instance @keycloak/keycloak-admin-client configurée
   - les constantes KEYCLOAK_URL, REALM, BACKEND_CLIENT_ID, BACKEND_CLIENT_SECRET
   - une fonction getJwksClient() pour la validation des tokens
5. Mettre à jour backend/.env.example avec les nouvelles variables (REDIS_URL, etc.)
6. Vérifier que docker compose up -d démarre tout sans erreur

Pour le script Keycloak setup-realm.sh, il existe déjà dans 
/scripts/keycloak/setup-realm.sh. Vérifie qu'il est exécutable et que les chemins 
matchent l'arborescence du projet. Si besoin, adapte-le.

Avant de coder, fais-moi :
1. La liste exhaustive des fichiers que tu vas créer/modifier
2. Un diff conceptuel du docker-compose.yml
3. Le contenu prévu de redis.js et keycloak.js (squelette)

Attends mon "go" avant d'écrire le code.

À la fin, mets à jour /docs/auth-migration-plan.md en cochant les tâches faites.
```

---

## ☐ Prompt Phase 1 — Auth Email+MDP Keycloak (admin/gestionnaire)

```
Phase 1 du plan : Auth Email+MDP via Keycloak pour admin/gestionnaire.

Référence : /docs/auth-migration-plan.md section "Phase 1" et /docs/auth-flows.md 
diagramme 1 (sans la partie 2FA pour cette phase, on l'ajoute en Phase 2).

⚠️ Garde le code JWT custom existant intact, on le supprimera en Phase 4.

Ta mission backend :
1. Créer backend/src/middlewares/keycloakAuth.js :
   - Extrait Bearer token
   - Valide via JWKS (avec jwks-rsa, cache 1h)
   - Algorithme RS256, vérifie iss, exp, aud
   - Si user inexistant en BDD locale : crée la ligne `utilisateur` avec keycloak_id + 
     email + nom + prenom (auto-provisioning)
   - À chaque requête, synchronise les rôles depuis token.realm_access.roles
   - Attache req.user = { id, keycloak_id, email, phone, roles, ... }

2. Créer backend/src/services/keycloakService.js qui encapsule :
   - login(email, password) : POST /token grant_type=password
   - refresh(refresh_token) : POST /token grant_type=refresh_token
   - logout(refresh_token) : POST /logout

3. Créer backend/src/controllers/keycloakAuthController.js :
   - POST /auth/login → appelle keycloakService.login
     ⚠️ Pour cette phase, retourne directement les tokens (pas encore de 2FA)
   - POST /auth/refresh
   - POST /auth/logout

4. Créer backend/src/routes/keycloakAuthRoutes.js et l'enregistrer dans app.js 
   sous /api/v1/auth/* (en parallèle des anciennes routes JWT — on les supprimera 
   en Phase 4)

5. Migration Prisma :
   - Ajouter à `Utilisateur` : keycloak_id (uuid, unique, nullable), phone (string, 
     unique, nullable), active_role (string, nullable)
   - Garder les anciens champs mot_de_passe_hash etc. pour l'instant
   - Créer le modèle AuthLog (voir spec dans AUTH_ARCHITECTURE.md section 5.3)

Ta mission frontend (web/n-djigi) :
1. Refactor src/contexts/AuthContext.tsx pour utiliser exclusivement le nouveau 
   flow Keycloak via backend (les endpoints créés ci-dessus). Retire la logique 
   "dual" (JWT vs Keycloak).
2. Stockage refresh_token : localStorage si Remember Me, sinon sessionStorage. 
   Access token uniquement en mémoire (state React).
3. Page /login : email + password + checkbox Remember Me. 
   Bouton "Se connecter" qui appelle authService.login.
4. Affichage des erreurs (401, compte désactivé, etc.) avec messages clairs en 
   français.

Avant de coder :
- Liste tous les fichiers que tu vas créer/modifier
- Donne-moi le contenu prévu de keycloakAuth.js (le middleware complet) — c'est 
  le composant le plus critique
- Confirme que tu ne touches PAS aux fichiers JWT custom existants

Attends mon "go" avant d'écrire le code.

À la fin :
- Donne-moi une checklist de tests manuels (curl + UI)
- Mets à jour /docs/auth-migration-plan.md
```

---

## ☐ Prompt Phase 2 — 2FA SMS pour admin/gestionnaire

```
Phase 2 du plan : Ajouter 2FA SMS au login admin/gestionnaire.

Référence : /docs/auth-migration-plan.md section "Phase 2" et /docs/auth-flows.md 
diagramme 1.

Approche : 2FA géré côté backend (pas dans Keycloak), avec Redis pour stocker 
l'état intermédiaire.

Ta mission backend :
1. Créer backend/src/services/smsService.js :
   - En NODE_ENV=development : log dans la console avec un format visible :
     ============================================================
       📱 OTP SMS [DEV MODE]
       Phone : +22670123456
       Code  : 458732
       Valid : 5 minutes
     ============================================================
   - En production : appel Orange SMS API (laisse un TODO, on l'implémentera 
     plus tard)
   - Fonction send(phone, code) qui retourne une Promise

2. Modifier authController.login :
   - Après réception des tokens Keycloak, vérifier si le user a un rôle 
     admin ou gestionnaire
   - Si oui : NE PAS retourner les tokens directement
   - Générer un OTP 6 chiffres (crypto.randomInt(100000, 999999))
   - Générer un login_token (UUID v4)
   - Stocker en Redis : key="login:<login_token>", 
     value={tokens, otp, phone, attempts:0}, TTL=5min
   - Récupérer le téléphone du user (depuis token claims ou BDD)
   - Appeler smsService.send(phone, otp)
   - Retourner au frontend : { requires_2fa: true, login_token, phone_masked: "+226 ** ** ** 56" }

3. Créer endpoint POST /auth/verify-sms :
   - Body : { login_token, sms_code }
   - Lit Redis, vérifie le code
   - Si OK : DEL la clé, retourne les tokens Keycloak stockés, log auth_log
   - Si KO : INCR attempts, max 3 tentatives, ensuite blocage 15 min + 
     invalidation session Keycloak

4. Créer endpoint POST /auth/resend-sms :
   - Body : { login_token }
   - Cooldown 60s (stocké en Redis sous key="cooldown:<login_token>")
   - Régénère un OTP et resend

Ta mission frontend :
1. Page /verify-sms (créer src/pages/VerifySMS.tsx) :
   - Champ de saisie 6 chiffres (composant avec auto-focus entre cases)
   - Affichage du numéro masqué
   - Bouton "Renvoyer le code" désactivé pendant 60s avec compte à rebours
   - Affichage du nombre de tentatives restantes
2. AuthContext : ajouter verifySMS(login_token, code) et resendSMS(login_token)
3. Après login, si requires_2fa, redirige vers /verify-sms avec le login_token 
   en state

Validation à faire :
- Login admin → SMS log apparait → saisie code → connecté
- Saisie code faux 3x → blocage
- Bouton Renvoyer fonctionne après 60s

Avant de coder :
- Liste les fichiers
- Confirme la structure exacte des données stockées en Redis

Attends mon "go".

À la fin, mets à jour /docs/auth-migration-plan.md
```

---

## ☐ Prompt Phase 3 — RBAC backend + frontend

```
Phase 3 du plan : Role-Based Access Control complet.

Référence : /docs/auth-migration-plan.md section "Phase 3".

Ta mission backend :
1. Créer backend/src/middlewares/authorize.js :
   - Signature : authorize(...allowedRoles)
   - Lit req.user.roles (alimenté par keycloakAuth)
   - 403 avec message clair si pas autorisé
   - Logge dans auth_logs un événement "access_denied"

2. Faire l'inventaire de TOUTES les routes existantes dans backend/src/routes/ 
   et me proposer un tableau (route → rôles autorisés) AVANT d'appliquer 
   authorize partout. Je veux valider.

3. Appliquer authorize sur toutes les routes selon le tableau validé.

Ta mission frontend (web) :
1. Créer src/components/ProtectedRoute.tsx :
   - Props : children, requiredRoles?: string[], requiredPermissions?: string[]
   - Si !user → redirect /login
   - Si requiredRoles non vide et pas de match → redirect /403
   - Sinon → render children

2. Créer src/pages/Forbidden.tsx (page 403)

3. Ajouter une fonction useAuth().hasRole(role) et useAuth().hasAnyRole(roles[])

4. Mettre à jour le routing pour appliquer ProtectedRoute sur les routes admin 
   et gestionnaire.

Avant de coder :
- L'inventaire des routes backend → rôles (tableau pour validation)
- Le squelette de ProtectedRoute.tsx

Attends mon "go".

À la fin, mets à jour /docs/auth-migration-plan.md
```

---

## ☐ Prompt Phase 4 — Sécurité + SUPPRESSION DU JWT CUSTOM

```
Phase 4 du plan : Sécurité (blacklist, rate limit, refresh auto) et nettoyage 
du JWT custom.

⚠️ Phase critique. À faire SEULEMENT quand les phases 1, 2, 3 sont 100% validées 
en manuel.

Référence : /docs/auth-migration-plan.md section "Phase 4" et /docs/auth-flows.md 
diagrammes 4 et 5.

PARTIE A — Sécurité

1. Créer backend/src/middlewares/checkBlacklist.js :
   - Extrait le jti du token
   - GET Redis blacklist:<jti>
   - Si présent → 401 token_revoked
   - Sinon → next()
   - À enregistrer AVANT keycloakAuth dans app.js

2. Modifier authController.logout :
   - Extrait jti et exp du access_token
   - SETEX Redis blacklist:<jti> (exp - now()) "1"
   - Appelle Keycloak /logout pour invalider la session côté KC
   - Logge auth_log

3. Rate limiting :
   - Créer backend/src/middlewares/rateLimiters.js
   - Limiter authLimiter : 10 req / 15min / IP sur /auth/*
   - Limiter strictLimiter : 5 req / 15min / IP sur /auth/login et 
     /auth/verify-sms (anti brute force)
   - Backend store = rate-limit-redis

4. Frontend intercepteur axios (web/n-djigi/src/services/api.ts) :
   - Sur 401 avec error="token_expired" : tente POST /auth/refresh
   - Si refresh OK : met à jour les tokens et rejoue la requête
   - Si refresh KO : efface tokens et redirect /login
   - Verrouillage : si plusieurs requêtes 401 en parallèle, ne refresh qu'une 
     fois et fait attendre les autres

PARTIE B — Suppression du JWT custom (NETTOYAGE)

Fais d'abord un audit. Liste-moi :
1. Tous les fichiers du backend qui contiennent "JWT_SECRET" ou "generateAccessToken" 
   ou "verifyAccessToken" ou similaire
2. Tous les fichiers du frontend qui contiennent "authMethod === 'jwt'" ou 
   référencent l'ancien flow
3. Toutes les variables .env JWT_*
4. Toutes les routes /auth/* legacy à supprimer

Une fois validé, supprime :
- backend/src/utils/jwt.js et fichiers similaires
- backend/src/middlewares/auth.js (ancien)
- dualAuth.js → renommer/supprimer
- Routes /auth/register (legacy si elle existe), /auth/login (ancienne version 
  sur ancien middleware), etc.
- Champs Prisma : mot_de_passe_hash, tentatives_echec, bloque_jusqu_a, 
  derniere_connexion_*
- Variables JWT_* du .env et docker-compose.yml
- Côté front : toute logique JWT custom dans AuthContext

Crée la migration Prisma correspondante (DROP COLUMN).

Validation finale :
- grep -r "JWT_SECRET" backend/ doit ne rien retourner
- grep -r "mot_de_passe_hash" backend/ doit ne rien retourner
- L'app fonctionne entièrement avec Keycloak

Avant de coder, donne-moi l'audit complet. Attends "go".

À la fin, mets à jour /docs/auth-migration-plan.md
```

---

## ☐ Prompt Phase 5 — OTP SMS pour passager/chauffeur/propriétaire

```
Phase 5 du plan : Auth par OTP SMS pour passager/chauffeur/propriétaire (apps 
Flutter).

Référence : /docs/auth-migration-plan.md section "Phase 5" et /docs/auth-flows.md 
diagramme 2 (sans la partie TOTP pour cette phase, on l'ajoute en Phase 6).

Approche choisie pour émettre des tokens Keycloak sans mot de passe :
Mot de passe technique aléatoire stocké en BDD chiffré (Approche B de la spec).

Ta mission backend :

1. Créer backend/src/services/otpService.js :
   - generateOtp() : 6 chiffres via crypto.randomInt
   - storeOtp(phone, code) : Redis SETEX otp:<phone> JSON{code, attempts:0} 300
   - verifyOtp(phone, code) : lit, compare, gère attempts (max 3), DEL si OK

2. Créer backend/src/services/phoneService.js :
   - normalize(phone) : utilise libphonenumber-js, force +226, retourne format E.164
   - validateBurkinaFaso(phone) : true/false

3. Endpoint POST /auth/otp/request :
   - Rate limit : 1 req / 60s / phone (Redis cooldown), max 5 / 24h / phone
   - Normalise + valide le téléphone
   - Génère OTP, stocke, envoie via smsService
   - Logge auth_log

4. Endpoint POST /auth/otp/verify :
   - Vérifie OTP
   - Si OK :
     a. Cherche user dans Keycloak via Admin API (search by username=phone)
     b. Si absent :
        - Génère un mot de passe technique aléatoire (32 chars)
        - Crée user dans Keycloak : username=phone, attributes.phone=phone, 
          credentials=[{type:password, value:tech_password, temporary:false}]
        - Assigne rôle ndjigi-passager
        - Crée ligne en BDD locale avec phone + keycloak_id + 
          tech_password chiffré (utiliser CRYPTO_SECRET du .env)
     c. Si présent : récupère le tech_password chiffré, déchiffre
     d. Appelle Keycloak grant_type=password avec phone + tech_password
     e. Pour cette Phase 5, retourne directement les tokens (sans TOTP)
     f. En Phase 6 on insérera l'étape TOTP

5. Endpoint POST /auth/otp/resend (cooldown 60s)

Ta mission Flutter (mobile-app/) :
1. Écran SaisieTelephone : champ avec préfixe +226 forcé, validation, bouton 
   "Recevoir le code"
2. Écran SaisieOtp : 6 cases, auto-focus, timer "Renvoyer dans 60s"
3. Service auth_service.dart avec methods requestOtp, verifyOtp, resendOtp
4. Stockage tokens : flutter_secure_storage
5. Intercepteur Dio pour refresh auto (similaire au web)

Avant de coder, donne-moi :
- Le schéma exact du champ chiffré en BDD (utiliser AES-256-GCM avec une clé 
  CRYPTO_SECRET)
- Le squelette de /auth/otp/verify (c'est le endpoint le plus complexe)
- Confirme la stratégie Token Exchange vs password technique

Attends "go".

À la fin, mets à jour /docs/auth-migration-plan.md
```

---

## ☐ Prompt Phase 6 — TOTP 2FA pour passager/chauffeur/propriétaire

```
Phase 6 du plan : Ajouter TOTP 2FA après l'OTP SMS pour les rôles passager/
chauffeur/propriétaire.

Référence : /docs/auth-migration-plan.md section "Phase 6" et /docs/auth-flows.md 
diagramme 2 (partie TOTP).

Ta mission backend :
1. Modifier authController.verifyOtp :
   - Après obtention des tokens Keycloak, vérifier si le user a TOTP configuré 
     (via Admin API : user.credentials contient un type "otp")
   - Si TOTP non configuré :
     a. Générer un secret TOTP via Keycloak Admin API ou côté backend (speakeasy)
     b. Générer l'URL otpauth://totp/...
     c. Stocker tokens + secret en Redis sous login:<uuid> TTL=5min
     d. Retourner { requires_totp_setup: true, totp_secret, qr_code_url, login_token }
   - Si TOTP configuré :
     a. Stocker tokens en Redis sous login:<uuid> TTL=5min
     b. Retourner { requires_totp: true, login_token }

2. Endpoint POST /auth/totp/setup :
   - Body : { login_token, totp_code }
   - Lit Redis, valide le TOTP avec le secret
   - Si OK : enregistre le credential TOTP dans Keycloak via Admin API, retourne 
     les tokens
   - Sinon : 401

3. Endpoint POST /auth/totp/verify :
   - Body : { login_token, totp_code }
   - Récupère le secret TOTP du user via Keycloak
   - Valide le code (avec une fenêtre de ±1 step pour la tolérance d'horloge)
   - Si OK : retourne les tokens
   - Sinon : 401, max 3 tentatives puis invalide la session

Ta mission Flutter :
1. Écran SetupTotp : affiche QR code (package qr_flutter), instructions pour 
   installer Google Authenticator, champ de saisie pour confirmer
2. Écran VerifyTotp : 6 cases, auto-focus, message "Ouvrez Google Authenticator"
3. Update du flow : après verify OTP, si requires_totp_setup → SetupTotp, sinon 
   si requires_totp → VerifyTotp, sinon → Accueil

Avant de coder :
- Décris le mapping exact entre les claims Keycloak et la détection "TOTP 
  configuré"
- Confirme la lib utilisée pour générer/valider TOTP côté backend (recommandation : 
  speakeasy ou otplib)

Attends "go".
```

---

## ☐ Prompt Phase 7 — Reset password + création gestionnaire

```
Phase 7 du plan : Reset password (admin/gestionnaire) + endpoint admin pour créer 
des gestionnaires.

Référence : /docs/auth-migration-plan.md section "Phase 7" et /docs/auth-flows.md 
diagrammes 6 et 7.

PARTIE A — Reset password

Backend :
1. POST /auth/forgot-password (public) : 
   - Body : { email }
   - Cherche user dans Keycloak, si existe : appelle PUT 
     /admin/realms/ndjigi/users/{id}/execute-actions-email avec 
     ["UPDATE_PASSWORD"]
   - Toujours retourner 200 (ne pas révéler si l'email existe ou non, sécurité)
2. La validation du lien email se fait directement côté Keycloak. Pas d'endpoint 
   /reset-password à créer côté backend (sauf si tu veux totalement custom le 
   flow, dans ce cas on devra creuser).

Frontend :
1. Page /forgot-password : champ email, bouton, message de confirmation 
   ("Un email a été envoyé si cette adresse existe")
2. Tester que l'email arrive bien (en dev, configurer Mailhog dans le 
   docker-compose ou utiliser une vraie boîte mail)

PARTIE B — Création gestionnaire par admin

Backend :
1. Endpoint POST /api/v1/admin/gestionnaires (authorize 'ndjigi-admin')
   - Body : { email, nom, prenom, phone, parkings_assignes: string[] }
   - Génère un mot de passe temporaire aléatoire (12 chars)
   - Crée user dans Keycloak : email, firstName, lastName, attributes.phone, 
     requiredActions=["UPDATE_PASSWORD", "VERIFY_EMAIL"], 
     credentials=[{type:password, value:temp_password, temporary:true}]
   - Assigne rôle ndjigi-gestionnaire
   - Crée la ligne utilisateur en BDD
   - Crée les entries gestionnaire_parking pour chaque parking assigné (table 
     dans Prisma — si elle n'existe pas, demande-moi avant de la créer)
   - Envoie un email au gestionnaire avec son MDP temporaire (utiliser nodemailer)

Frontend (admin) :
1. Page /admin/gestionnaires : liste avec recherche, bouton "Nouveau"
2. Modal/Page de création : formulaire complet, sélection multiple des parkings
3. Vue détail : info gestionnaire + parkings assignés + bouton "Désactiver"

Avant de coder :
- Vérifie si la table gestionnaire_parking existe déjà dans schema.prisma
- Vérifie si nodemailer est déjà configuré (regarde backend/src/services/ et .env 
  pour SMTP_*)
- Donne-moi le template d'email à envoyer (sujet + corps)

Attends "go".
```

---

## ☐ Prompt Phase 8 — Tests + documentation finale

```
Phase 8 du plan : Tests E2E + documentation finale.

Référence : /docs/auth-migration-plan.md section "Phase 8".

PARTIE A — Tests backend

1. Setup Jest + supertest si pas déjà fait
2. Créer backend/__tests__/auth.test.js couvrant :
   - Login admin success/fail
   - Verify SMS success/fail/blocked
   - OTP request/verify pour passager
   - TOTP setup/verify
   - Refresh token
   - Logout + blacklist
   - Routes protégées par rôle (403)
   - Rate limiting (429)
3. Setup d'une base de test isolée (SQLite ou Postgres séparé)
4. Mocks pour Keycloak (lib nock ou similaire) ET pour Redis (ioredis-mock)

PARTIE B — Tests E2E web

1. Setup Playwright si pas déjà fait
2. Scénarios :
   - Login admin complet (email/password + SMS) → /dashboard
   - Accès refusé sur route gestionnaire avec un admin et vice-versa
   - Logout → /login
   - Forgot password → email reçu (Mailhog)
   - Refresh token automatique après 5 min

PARTIE C — Documentation

1. Setup OpenAPI/Swagger via swagger-jsdoc + swagger-ui-express, route 
   /api/v1/docs
2. Annoter tous les endpoints /auth/* avec JSDoc OpenAPI
3. Créer /docs/AUTH.md (README final) avec :
   - Comment démarrer le projet
   - Comment créer un admin de test (rappel du script)
   - Comment voir l'OTP en dev (logs Docker)
   - Comment monitorer Redis (commandes utiles)
   - Comment refresh la config Keycloak (export/import)
   - Troubleshooting (5 problèmes courants)

Avant de coder, donne-moi :
- La liste des scénarios de tests prioritaires
- Le plan du README AUTH.md

Attends "go".

À la fin :
- Mets à jour /docs/auth-migration-plan.md pour cocher TOUTES les cases finales
- Faire un dernier audit : grep des termes interdits (JWT_SECRET, etc.)
- Bilan de fin de migration : ce qui marche, ce qui reste, ce qui pourrait être 
  amélioré post-MVP
```

---

## 🧭 Rappels de méthode pour piloter Claude Code

1. **Ne pas brûler les étapes** : une phase à la fois, validation manuelle entre chaque.
2. **"Plan avant code"** : Claude doit toujours te montrer son plan avant d'écrire la moindre ligne.
3. **Garder le doc de migration à jour** : c'est l'état persistant entre les sessions.
4. **Commit après chaque phase** : git tag `auth-phase-X-done`. Si une phase casse tout, tu peux revenir en arrière.
5. **Tester en manuel après chaque phase** : la checklist de chaque phase est non négociable.
6. **Ne pas mélanger les rôles** : si Claude commence à mêler la logique admin et passager dans le même fichier, recadre-le.
7. **Versionner Keycloak** : à chaque évolution de la config Keycloak (nouveau client, nouveau rôle, nouvelle required action), mettre à jour `setup-realm.sh` ET committer un export JSON dans `keycloak-exports/`.

---

## 🛟 Que faire si Claude se trompe

- **Il code avant d'avoir donné le plan** : "Stop. Annule ce que tu viens de faire. Suis le format demandé : plan d'abord, code après validation."
- **Il mélange deux phases** : "Tu déborde sur la Phase X. Restreins-toi strictement à la Phase Y."
- **Il propose une solution qui contredit AUTH_ARCHITECTURE.md** : "Relis le doc d'architecture. Ta proposition contredit la section Z. Soit tu suis le doc, soit tu argumentes pourquoi le doc devrait être modifié."
- **Il oublie de mettre à jour le plan** : "N'oublie pas de cocher les tâches dans /docs/auth-migration-plan.md."
- **Il sur-engineering** : "Reste sur l'approche la plus simple qui satisfait la spec. Pas de patterns inutiles."
