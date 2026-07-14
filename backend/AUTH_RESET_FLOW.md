# AUTH RESET FLOW (N'DJIGI)

## 1) Diagramme ASCII

```text
FORGOT PASSWORD
---------------
Client -> POST /api/v1/auth/forgot-password { email }
   |
   |--[Rate limit IP: 3/15min + email: 5/15min]
   |-- Normalize email
   |-- Lookup user in PostgreSQL (utilisateur)
   |-- If missing in PG:
   |     -> optional lookup Keycloak by email
   |     -> log desync if found in KC only
   |     -> return generic 200 (no leak)
   |
   |-- If user exists but not actif:
   |     -> return generic 200 (no leak)
   |
   |-- Verify keycloak_id + user exists in Keycloak
   |-- Generate raw token (UUID) + sha256 hash
   |-- Persist token hash in password_reset_token (TTL)
   |-- Send branded reset email with /auth/reset-password?token=RAW
   |
   --> Always return 200 generic:
       "Si cette adresse existe, un email a ete envoye."


RESET PASSWORD
--------------
Client -> POST /api/v1/auth/reset-password { token, newPassword }
   |
   |--[Rate limit IP: 10/15min]
   |-- Validate password strength (12+, upper, lower, digit, special)
   |-- Hash token with sha256
   |-- Find token row by token_hash
   |-- Reject if not found / expired / already used
   |-- Verify linked user + keycloak user
   |-- Keycloak Admin API -> users.resetPassword(temporary=false)
   |-- Mark token used_at/used_ip
   |-- Send password-changed security notification
   |
   --> Return 200 success
```

## 2) Variables d'environnement requises

- `KEYCLOAK_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`
- `FRONTEND_URL` (utilisee pour le lien de reset)
- `APP_URL` (fallback si `FRONTEND_URL` absent)
- `PASSWORD_RESET_TOKEN_TTL_MINUTES` (defaut: `15`)
- `SUPPORT_WHATSAPP`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## 3) Procedure UI Keycloak - client admin dedie

Objectif: utiliser un client de service separe pour l'Admin API (reset password, gestion users).

1. Ouvrir la console Keycloak et selectionner le realm `ndjigi`.
2. Aller dans `Clients` -> `Create client`.
3. Renseigner:
   - `Client type`: `OpenID Connect`
   - `Client ID`: valeur de `KEYCLOAK_ADMIN_CLIENT_ID` (ex: `ndjigi-backend-admin`)
4. Creer le client puis configurer:
   - `Client authentication`: `ON`
   - `Service accounts roles`: `ON`
   - `Standard flow`: `OFF` (optionnel mais recommande pour client machine-to-machine)
   - `Direct access grants`: `OFF` (optionnel)
5. Sauvegarder.
6. Aller dans l'onglet `Credentials` et copier le `Client secret`.
7. Placer ce secret dans `KEYCLOAK_ADMIN_CLIENT_SECRET` (backend `.env`).
8. Aller dans `Service account roles`.
9. Selectionner le client `realm-management`.
10. Ajouter exactement ces roles:
    - `view-users`
    - `manage-users`
11. Verifier que les roles apparaissent bien dans `Assigned roles`.
12. Redemarrer le backend si necessaire.

## 4) Lancer les tests

Depuis le dossier `backend`:

```bash
npm test -- --runInBand __tests__/passwordReset.test.js
```

Ou tous les tests:

```bash
npm test
```

## 5) Checklist securite en place

- Reponse forgot-password generique (pas de fuite d'existence utilisateur)
- Double rate-limit forgot-password:
  - `3` requetes / `15 min` / IP
  - `5` requetes / `15 min` / email normalise
- Rate-limit reset-password:
  - `10` requetes / `15 min` / IP
- Tokens stockes hashes (`sha256`) en base (pas de token brut)
- Token single-use (`used_at`, `used_ip`)
- Expiration configurable (`PASSWORD_RESET_TOKEN_TTL_MINUTES`)
- Validation forte de mot de passe cote backend
- Notification email apres changement de mot de passe
- Job de cleanup periodique des tokens expirés / anciens utilises
- Logs structures JSON pour audit et debug

## 6) Si le flux echoue - logs a rechercher

### Forgot password

- `forgot_password_missing_email`
- `forgot_password_db_lookup_failed`
- `forgot_password_unknown_email`
- `forgot_password_desync_keycloak_without_pg`
- `forgot_password_desync_missing_keycloak_id`
- `forgot_password_keycloak_lookup_failed`
- `forgot_password_desync_keycloak_user_not_found`
- `forgot_password_token_persist_failed`
- `forgot_password_email_send_failed`
- `forgot_password_token_cleanup_failed`

### Reset password

- `reset_password_weak_password`
- `reset_password_token_lookup_failed`
- `reset_password_invalid_token`
- `reset_password_token_already_used`
- `reset_password_expired_token`
- `reset_password_expired_token_delete_failed`
- `reset_password_missing_local_user`
- `reset_password_desync_missing_keycloak_id`
- `reset_password_keycloak_lookup_failed`
- `reset_password_desync_keycloak_user_not_found`
- `reset_password_keycloak_update_failed`
- `reset_password_mark_token_used_failed`
- `reset_password_token_delete_after_update_failure_failed`
- `reset_password_notification_email_failed`
- `reset_password_success`

### Job cleanup

- `cleanup_expired_reset_tokens`
- `cleanup_expired_reset_tokens_failed`
