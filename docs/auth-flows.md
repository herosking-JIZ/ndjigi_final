# Diagrammes de séquence des flows d'authentification

Tous les diagrammes sont en syntaxe Mermaid et peuvent être visualisés directement sur GitHub/GitLab/VSCode (avec l'extension Mermaid Preview).

---

## 1. Login admin/gestionnaire avec 2FA SMS

```mermaid
sequenceDiagram
    actor User as Admin/Gestionnaire
    participant Web as Frontend Web
    participant API as Backend Express
    participant KC as Keycloak
    participant Redis
    participant SMS as Service SMS

    User->>Web: Saisit email + password
    Web->>API: POST /auth/login {email, password}
    API->>KC: POST /token (grant_type=password)
    KC-->>API: {access_token, refresh_token, id_token}
    
    Note over API: Détecte rôle admin/gestionnaire<br/>→ 2FA obligatoire
    
    API->>API: Génère OTP 6 chiffres
    API->>Redis: SET login:abc123 {tokens, otp, attempts:0} TTL=5min
    API->>SMS: Envoie SMS (ou log console en dev)
    API-->>Web: {requires_2fa: true, login_token: "abc123"}
    
    Web->>User: Affiche écran "Saisir code SMS"
    User->>Web: Saisit code SMS
    Web->>API: POST /auth/verify-sms {login_token, sms_code}
    API->>Redis: GET login:abc123
    Redis-->>API: {tokens, otp, attempts}
    
    alt Code correct
        API->>Redis: DEL login:abc123
        API->>API: Log auth_log: login_success
        API-->>Web: {access_token, refresh_token, user}
        Web->>Web: Stocke tokens (localStorage si Remember Me)
        Web->>User: Redirige vers /dashboard
    else Code incorrect (tentative < 3)
        API->>Redis: INCR attempts
        API-->>Web: 401 {message: "Code invalide", attempts_left: 2}
    else 3 tentatives échouées
        API->>KC: POST /logout (invalide les tokens)
        API->>Redis: DEL login:abc123
        API->>API: Log auth_log: login_failed_2fa
        API-->>Web: 401 {message: "Trop de tentatives", blocked: true}
    end
```

---

## 2. Login passager/chauffeur/propriétaire avec OTP SMS + TOTP

```mermaid
sequenceDiagram
    actor User
    participant App as App Flutter
    participant API as Backend Express
    participant KC as Keycloak
    participant Redis
    participant SMS as Service SMS

    User->>App: Saisit numéro +226 70 12 34 56
    App->>API: POST /auth/otp/request {phone}
    API->>API: Normalise + valide format
    API->>Redis: Vérifie rate limit
    API->>API: Génère OTP 6 chiffres
    API->>Redis: SET otp:+22670123456 {code, attempts:0} TTL=5min
    API->>SMS: Envoie SMS (ou log en dev)
    API-->>App: 200 {message: "OTP envoyé"}
    
    App->>User: Affiche écran saisie OTP
    User->>App: Saisit OTP
    App->>API: POST /auth/otp/verify {phone, otp_code}
    API->>Redis: GET otp:+22670123456
    
    alt OTP correct
        API->>KC: GET /users?username=+22670123456 (Admin API)
        
        alt User n'existe pas (1er login)
            API->>KC: POST /users (créé user)
            API->>KC: PUT /users/{id}/role-mappings/realm (ajoute ndjigi-passager)
            API->>API: Crée ligne utilisateur en BDD locale
        end
        
        API->>KC: POST /token (grant_type=password avec password technique)
        KC-->>API: {access_token, refresh_token}
        
        alt TOTP non configuré (1er login)
            API->>KC: GET totp_secret du user
            API->>Redis: SET login:xyz789 {tokens} TTL=5min
            API-->>App: {requires_totp_setup: true, totp_secret, qr_code_url, login_token}
            App->>User: Affiche QR code à scanner
            User->>App: Scanne avec Google Authenticator, saisit code TOTP
            App->>API: POST /auth/totp/setup {login_token, totp_code}
            API->>KC: Valide TOTP via Admin API
            KC-->>API: OK
            API->>Redis: GET puis DEL login:xyz789
            API-->>App: {access_token, refresh_token, user}
        else TOTP déjà configuré
            API->>Redis: SET login:xyz789 {tokens} TTL=5min
            API-->>App: {requires_totp: true, login_token}
            User->>App: Saisit code TOTP
            App->>API: POST /auth/totp/verify {login_token, totp_code}
            API->>KC: Valide TOTP
            KC-->>API: OK
            API->>Redis: GET puis DEL login:xyz789
            API-->>App: {access_token, refresh_token, user}
        end
        
        App->>App: Stocke refresh_token dans flutter_secure_storage
        App->>User: Redirige vers Accueil
    else OTP incorrect ou expiré
        API-->>App: 401 {message, attempts_left}
    end
```

---

## 3. Appel API authentifié (n'importe quel rôle)

```mermaid
sequenceDiagram
    participant Client as Web/Mobile
    participant API as Backend Express
    participant Redis
    participant KC as Keycloak JWKS
    participant DB as PostgreSQL

    Client->>API: GET /api/v1/parkings<br/>Authorization: Bearer <access_token>
    
    API->>API: middleware checkBlacklist
    API->>Redis: GET blacklist:<jti>
    Redis-->>API: null (pas blacklisté)
    
    API->>API: middleware keycloakAuth
    
    alt JWKS pas en cache
        API->>KC: GET /protocol/openid-connect/certs
        KC-->>API: {keys: [...]}
        API->>API: Cache JWKS (1h)
    end
    
    API->>API: Vérifie signature RS256, exp, iss, aud
    
    alt Token valide
        API->>DB: SELECT user WHERE keycloak_id = sub
        
        alt User n'existe pas en BDD
            API->>DB: INSERT user (auto-provisioning)
        end
        
        API->>API: req.user = {id, roles, ...}
        API->>API: middleware authorize(...) si appliqué
        
        alt Rôle autorisé
            API->>API: Exécute le controller
            API-->>Client: 200 {data}
        else Rôle insuffisant
            API-->>Client: 403 {message: "Accès refusé"}
        end
    else Token expiré
        API-->>Client: 401 {error: "token_expired"}
        Note over Client: Interceptor déclenche auto-refresh<br/>(voir diagramme 4)
    else Token invalide
        API-->>Client: 401 {error: "invalid_token"}
    end
```

---

## 4. Refresh automatique du token (intercepteur frontend)

```mermaid
sequenceDiagram
    participant Client as Frontend (axios/dio)
    participant API as Backend
    participant KC as Keycloak

    Client->>API: GET /api/v1/protected (avec access_token expiré)
    API-->>Client: 401 {error: "token_expired"}
    
    Note over Client: Intercepteur détecte 401
    
    Client->>API: POST /auth/refresh {refresh_token}
    API->>KC: POST /token (grant_type=refresh_token)
    
    alt Refresh valide
        KC-->>API: {access_token, refresh_token (rotated)}
        API-->>Client: {access_token, refresh_token, expires_in}
        Client->>Client: Met à jour les tokens stockés
        Client->>API: REJOUE GET /api/v1/protected (nouveau access_token)
        API-->>Client: 200 {data}
    else Refresh expiré ou invalide
        KC-->>API: 400 {error: "invalid_grant"}
        API-->>Client: 401 {error: "refresh_failed"}
        Client->>Client: Efface les tokens, redirige vers /login
    end
```

---

## 5. Logout

```mermaid
sequenceDiagram
    actor User
    participant Client as Frontend
    participant API as Backend
    participant KC as Keycloak
    participant Redis

    User->>Client: Clique "Se déconnecter"
    Client->>API: POST /auth/logout<br/>Authorization: Bearer <access_token><br/>Body: {refresh_token}
    
    API->>API: Décode access_token, extrait jti, exp
    API->>KC: POST /logout {refresh_token}
    KC-->>API: 204 No Content (session invalidée côté KC)
    
    API->>Redis: SETEX blacklist:<jti> (exp - now()) "1"
    API->>API: Log auth_log: logout
    API-->>Client: 200 {success: true}
    
    Client->>Client: Efface tokens du storage
    Client->>User: Redirige vers /login
```

---

## 6. Reset password (admin/gestionnaire)

```mermaid
sequenceDiagram
    actor User
    participant Client as Frontend
    participant API as Backend
    participant KC as Keycloak
    participant Mail as Serveur Mail

    User->>Client: Page /forgot-password, saisit email
    Client->>API: POST /auth/forgot-password {email}
    API->>KC: GET /users?email=...
    KC-->>API: {user_id}
    API->>KC: PUT /users/{id}/execute-actions-email (UPDATE_PASSWORD)
    KC->>Mail: Envoie email avec lien {token}
    API-->>Client: 200 {message: "Email envoyé"}
    
    Note over User: Reçoit email, clique sur le lien
    
    User->>Client: Page /reset-password?token=xxx, saisit nouveau MDP
    Client->>API: POST /auth/reset-password {token, new_password}
    API->>KC: Valide le token (via endpoint custom ou Admin API)
    API->>KC: PUT /users/{id}/reset-password
    KC-->>API: 204 OK
    API-->>Client: 200 {message: "Mot de passe réinitialisé"}
    Client->>User: Redirige vers /login
```

---

## 7. Création d'un gestionnaire par un admin

```mermaid
sequenceDiagram
    actor Admin
    participant Web
    participant API as Backend
    participant KC as Keycloak
    participant DB as PostgreSQL
    participant Mail

    Admin->>Web: Page /admin/gestionnaires, formulaire création
    Web->>API: POST /api/v1/admin/gestionnaires<br/>Authorization: Bearer <admin_token><br/>{email, nom, prenom, phone, parkings_assignes}
    
    API->>API: authorize('ndjigi-admin')
    API->>API: Génère MDP temporaire aléatoire
    
    API->>KC: POST /users (créé user avec MDP temp + required_actions: UPDATE_PASSWORD)
    KC-->>API: {user_id}
    API->>KC: PUT /users/{id}/role-mappings/realm (ajoute ndjigi-gestionnaire)
    
    API->>DB: INSERT utilisateur (mirror)
    API->>DB: INSERT gestionnaire_parking (assignations)
    
    API->>Mail: Envoie email "Votre compte gestionnaire" avec MDP temporaire
    
    API-->>Web: 201 {gestionnaire}
    Web->>Admin: "Gestionnaire créé, email envoyé"
    
    Note over Admin: Le gestionnaire reçoit son email,<br/>se connecte avec MDP temp,<br/>est forcé à le changer,<br/>configure son 2FA SMS.
```
