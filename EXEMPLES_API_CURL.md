# Exemples API - Commandes cURL pour Tester

Utilisez ces commandes pour tester l'API d'authentification directement.

---

## 🚀 Configuration Rapide

### Variables d'Environnement (Bash)
```bash
export API_BASE="http://localhost:8000/api/v1"
export EMAIL="ahmed.traore@example.com"
export PASSWORD="SecurePass@2026"
```

### Variables d'Environnement (PowerShell)
```powershell
$env:API_BASE = "http://localhost:8000/api/v1"
$env:EMAIL = "ahmed.traore@example.com"
$env:PASSWORD = "SecurePass@2026"
```

---

## 1️⃣ Authentification

### Login (Inscription + Connexion)

```bash
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "grant_type": "password"
  }'
```

**Réponse Réussie (201 ou 200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
    "email": "ahmed.traore@example.com",
    "prenom": "Ahmed",
    "nom": "Traoré",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["passager"],
    "statut_compte": "actif"
  }
}
```

### Sauvegarder les Tokens (Bash)
```bash
# Après le login, extraire et sauvegarder les tokens
export ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cC..."  # À copier depuis la réponse
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cC..."  # À copier depuis la réponse
```

---

### Rafraîchir le Token

```bash
curl -X POST "$API_BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'$REFRESH_TOKEN'"
  }'
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

---

### Déconnexion

```bash
curl -X POST "$API_BASE/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "refresh_token": "'$REFRESH_TOKEN'"
  }'
```

**Réponse:**
```json
{
  "message": "Déconnexion réussie"
}
```

---

## 2️⃣ Gestion du Mot de Passe

### Demander Réinitialisation

```bash
curl -X POST "$API_BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed.traore@example.com"
  }'
```

**Réponse:**
```json
{
  "message": "Si l'email existe, vous recevrez les instructions de réinitialisation",
  "email_sent": true
}
```

### Réinitialiser le Mot de Passe

```bash
curl -X POST "$API_BASE/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "reset_token": "token-recu-par-email",
    "nouveau_mot_de_passe": "NewSecurePass@2026",
    "confirmation_mot_de_passe": "NewSecurePass@2026"
  }'
```

**Réponse:**
```json
{
  "message": "Mot de passe réinitialisé avec succès",
  "can_login": true
}
```

---

### Changer Mot de Passe Temporaire (Gestionnaires)

```bash
curl -X POST "$API_BASE/auth/change-temporary-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "ancien_mot_de_passe": "TempPassword123!",
    "nouveau_mot_de_passe": "NewSecurePass@2026",
    "confirmation_mot_de_passe": "NewSecurePass@2026"
  }'
```

**Réponse:**
```json
{
  "message": "Mot de passe modifié avec succès",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

---

## 3️⃣ Authentification à Deux Facteurs (2FA)

### Demander Code OTP

```bash
curl -X POST "$API_BASE/auth/otp/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "numero_telephone": "+223XXXXXXXX"
  }'
```

**Réponse:**
```json
{
  "message": "Code OTP envoyé au numéro",
  "numero_telephone": "+223XXXXXXXX",
  "expires_in": 300,
  "attempts_remaining": 3
}
```

---

### Vérifier Code OTP

```bash
curl -X POST "$API_BASE/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "otp_code": "123456",
    "numero_telephone": "+223XXXXXXXX"
  }'
```

**Réponse:**
```json
{
  "message": "OTP vérifié avec succès",
  "deux_fa_activee": true,
  "auth_method_otp": true
}
```

---

### Setup TOTP (Google Authenticator)

```bash
curl -X POST "$API_BASE/auth/totp/setup" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Réponse:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "manual_entry_key": "JBSWY3DPEBLW64TMMQ======",
  "message": "Scannez le code QR avec Google Authenticator"
}
```

---

### Vérifier Code TOTP

```bash
curl -X POST "$API_BASE/auth/totp/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "totp_code": "123456"
  }'
```

**Réponse:**
```json
{
  "message": "TOTP configuré avec succès",
  "backup_codes": [
    "XXXX-XXXX",
    "XXXX-XXXX",
    "XXXX-XXXX",
    "XXXX-XXXX",
    "XXXX-XXXX"
  ]
}
```

---

## 4️⃣ Profil Utilisateur

### Récupérer Profil Actuel

```bash
curl -X GET "$API_BASE/utilisateur/profil" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Réponse Passager:**
```json
{
  "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ahmed.traore@example.com",
  "prenom": "Ahmed",
  "nom": "Traoré",
  "numero_telephone": "+223XXXXXXXX",
  "roles": ["passager"],
  "statut_compte": "actif",
  "deux_fa_activee": false,
  "passager": {
    "adresses": [
      {
        "id": "addr-001",
        "type": "domicile",
        "adresse": "Avenue de Mali, Bamako",
        "latitude": 12.6536,
        "longitude": -8.0029
      }
    ],
    "historique_trajets": 15,
    "note_moyenne": 4.8,
    "nombre_evaluations": 42
  }
}
```

**Réponse Chauffeur:**
```json
{
  "id_utilisateur": "660e8400-e29b-41d4-a716-446655440111",
  "email": "driver.moussa@example.com",
  "prenom": "Moussa",
  "nom": "Diallo",
  "numero_telephone": "+223XXXXXXXX",
  "roles": ["chauffeur"],
  "statut_compte": "actif",
  "deux_fa_activee": false,
  "chauffeur": {
    "numero_permis": "BK-2024-123456",
    "date_expiration_permis": "2028-06-15",
    "statut_chauffeur": "actif",
    "statut_verification": "verifie",
    "disponibilite": "disponible",
    "localisation_actuelle": {
      "latitude": 12.6536,
      "longitude": -8.0029,
      "accuracy": 10.5,
      "timestamp": "2026-06-03T15:45:00Z"
    },
    "note_moyenne": 4.9,
    "nombre_evaluations": 127,
    "nombre_trajets_effectues": 245,
    "vehicule_principal": {
      "id_vehicule": "veh-001",
      "marque": "Toyota",
      "modele": "Corolla",
      "immatriculation": "BA-5234-XX",
      "couleur": "Gris"
    }
  }
}
```

---

### Mettre à Jour le Profil

```bash
curl -X PATCH "$API_BASE/utilisateur/profil" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "prenom": "Ahmed",
    "nom": "Traoré",
    "numero_telephone": "+223XXXXXXXX",
    "photo_profil_url": "https://cdn.ndjigi.com/..."
  }'
```

**Réponse:**
```json
{
  "message": "Profil mis à jour avec succès",
  "user": { /* objet utilisateur complet */ }
}
```

---

## 5️⃣ Gestion des Utilisateurs (Admin)

### Lister les Utilisateurs

```bash
curl -X GET "$API_BASE/utilisateurs?page=1&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Réponse:**
```json
{
  "data": [
    {
      "id_utilisateur": "550e8400-e29b-41d4-a716-446655440000",
      "email": "ahmed.traore@example.com",
      "prenom": "Ahmed",
      "nom": "Traoré",
      "roles": ["passager"],
      "statut_compte": "actif",
      "created_at": "2026-01-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### Récupérer un Utilisateur Spécifique

```bash
curl -X GET "$API_BASE/utilisateurs/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Créer un Utilisateur (Admin)

```bash
curl -X POST "$API_BASE/utilisateurs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "gestionnaire@example.com",
    "prenom": "Mohamed",
    "nom": "Keita",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["gestionnaire"]
  }'
```

**Réponse:**
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id_utilisateur": "uuid-generated",
    "email": "gestionnaire@example.com",
    "prenom": "Mohamed",
    "nom": "Keita",
    "numero_telephone": "+223XXXXXXXX",
    "roles": ["gestionnaire"],
    "statut_compte": "actif",
    "mot_de_passe_temporaire": true
  },
  "invitation_sent": true,
  "temporary_password_details": {
    "email": "gestionnaire@example.com",
    "message": "Un email d'invitation avec mot de passe temporaire a été envoyé"
  }
}
```

---

## ⚠️ Gestion des Erreurs

### Erreur 401 - Token Expiré

```bash
# Avant rafraîchissement
curl -X GET "$API_BASE/utilisateur/profil" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cC..." # Token expiré
```

**Réponse:**
```json
{
  "error": "Unauthorized",
  "status_code": 401,
  "message": "Token expiré",
  "timestamp": "2026-06-03T15:45:30Z"
}
```

**Solution:** Utiliser le refresh_token pour obtenir un nouveau token

---

### Erreur 400 - Validation

```bash
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "short"
  }'
```

**Réponse:**
```json
{
  "error": "Bad Request",
  "status_code": 400,
  "message": "Format email invalide",
  "timestamp": "2026-06-03T15:45:30Z"
}
```

---

### Erreur 429 - Limite Atteinte

```bash
# Après 10 tentatives échouées en 15 minutes
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "wrong"}'
```

**Réponse:**
```json
{
  "error": "Too Many Requests",
  "status_code": 429,
  "message": "Trop de tentatives. Réessayez après 15 minutes.",
  "retry_after": 900
}
```

---

### Erreur 403 - Permissions Insuffisantes

```bash
# Utilisateur passager essayant d'accéder à admin
curl -X GET "$API_BASE/utilisateurs" \
  -H "Authorization: Bearer $PASSAGER_TOKEN"
```

**Réponse:**
```json
{
  "error": "Forbidden",
  "status_code": 403,
  "message": "Permissions insuffisantes",
  "required_roles": ["admin", "gestionnaire"]
}
```

---

## 🧪 Scénarios de Test Complets

### Scénario 1: Nouveau Passager

```bash
#!/bin/bash

# 1. Login (inscription)
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau.passager@example.com",
    "password": "SecurePass@2026",
    "grant_type": "password"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

echo "✓ Login réussi"
echo "Access Token: $ACCESS_TOKEN"

# 2. Récupérer profil
curl -s -X GET "http://localhost:8000/api/v1/utilisateur/profil" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo "✓ Profil récupéré"

# 3. Déconnexion
curl -s -X POST "http://localhost:8000/api/v1/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"refresh_token": "'$REFRESH_TOKEN'"}' | jq .

echo "✓ Déconnexion réussie"
```

---

### Scénario 2: Setup 2FA

```bash
#!/bin/bash

# 1. Login
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass@2026",
    "grant_type": "password"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')

# 2. Demander OTP
curl -s -X POST "http://localhost:8000/api/v1/auth/otp/request" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"numero_telephone": "+223XXXXXXXX"}' | jq .

echo "✓ OTP demandé - Code envoyé par SMS"
echo "Code reçu: (Simule la réception)"
OTP="123456"

# 3. Vérifier OTP
curl -s -X POST "http://localhost:8000/api/v1/auth/otp/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"otp_code": "'$OTP'", "numero_telephone": "+223XXXXXXXX"}' | jq .

echo "✓ OTP vérifié"

# 4. Setup TOTP
QR=$(curl -s -X POST "http://localhost:8000/api/v1/auth/totp/setup" \
  -H "Authorization: Bearer $TOKEN" | jq .)

echo "✓ TOTP configuré"
echo $QR | jq '.qr_code' # Afficher le code QR
```

---

## 📱 Collection Postman

Importer directement dans Postman:

```json
{
  "info": {
    "name": "N'DJIGI Authentication API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{base_url}}/auth/login",
          "host": ["{{base_url}}"],
          "path": ["auth", "login"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"{{email}}\", \"password\": \"{{password}}\", \"grant_type\": \"password\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000/api/v1"
    },
    {
      "key": "email",
      "value": "ahmed.traore@example.com"
    },
    {
      "key": "password",
      "value": "SecurePass@2026"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

---

## 💡 Tips & Tricks

### Décoder un JWT
```bash
# Décoder l'access_token
echo "eyJhbGciOiJSUzI1NiIsInR5cC..." | cut -d. -f2 | base64 -d | jq .
```

### Vérifier l'Expiration
```bash
# Extraire exp (en secondes depuis epoch)
EXP=$(curl -s "$API_BASE/utilisateur/profil" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.exp')

# Convertir en date humaine
date -d @$EXP
```

### Tester avec Variable d'Environnement
```bash
export API_BASE="http://localhost:8000/api/v1"
export TOKEN="votre-token-ici"

curl "$API_BASE/utilisateur/profil" \
  -H "Authorization: Bearer $TOKEN"
```

---

**Dernière mise à jour:** Juin 2026
