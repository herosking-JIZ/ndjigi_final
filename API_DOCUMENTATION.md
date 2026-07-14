# 📚 Documentation API N'DJIGI Backend

**Version:** 1.0.0  
**Framework:** Express.js + Prisma + Keycloak  
**Port:** 8000 (par défaut)  
**Base URL:** `http://localhost:8000/api/v1`

---

## 🔐 Authentification

L'API utilise deux systèmes d'authentification en parallèle :
1. **Keycloak OAuth2** - Pour les utilisateurs modernes
2. **JWT Local** - Pour les utilisateurs legacy (gestionnaires, admins)

### Headers Requis

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Structure de Réponse Standardisée

```json
{
  "success": true|false,
  "message": "Description de l'opération",
  "data": null|{},
  "errors": null|{}
}
```

---

## 🔑 Endpoints d'Authentification

### Routes de Base : `/auth`

#### 1. Login Local
```http
POST /auth/local/login
```
**Description:** Login avec email et mot de passe (gestionnaires, admins)

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id_utilisateur": "uuid",
      "email": "user@example.com",
      "nom": "Dupont",
      "prenom": "Jean",
      "roles": ["gestionnaire"]
    },
    "expires_in": 3600,
    "mot_de_passe_temporaire": false
  }
}
```

#### 2. Keycloak Login (avec fallback local)
```http
POST /auth/login
```
**Description:** Essaie Keycloak en premier, puis fallback sur local

**Body:** (même que local/login)

#### 3. Refresh Token
```http
POST /auth/refresh
```
**Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "new_token...",
    "expires_in": 3600
  }
}
```

#### 4. Logout
```http
POST /auth/logout
```
**Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 5. Changer Mot de Passe Temporaire
```http
POST /auth/change-temporary-password
Authorization: Bearer <token>
```
**Body:**
```json
{
  "ancien_mot_de_passe": "tempPassword123",
  "nouveau_mot_de_passe": "newSecurePass456"
}
```

---

## 📱 Authentification OTP/TOTP (Phase 5-6)

### OTP par SMS

#### 1. Demander OTP
```http
POST /auth/otp/request
```
**Body:**
```json
{
  "phone": "+212612345678"
}
```
**Rate Limit:** 1 par 60s, max 5 par 24h  
**Response:** SMS envoyé avec code OTP

#### 2. Vérifier OTP
```http
POST /auth/otp/verify
```
**Body:**
```json
{
  "phone": "+212612345678",
  "otp_code": "123456"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "login_token": "temp_token_for_next_step",
    "requires_totp": false,
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### 3. Renvoyer OTP
```http
POST /auth/otp/resend
```
**Body:**
```json
{
  "phone": "+212612345678"
}
```

### TOTP 2FA

#### 1. Setup TOTP
```http
POST /auth/totp/setup
```
**Body:**
```json
{
  "login_token": "temp_token_from_otp",
  "totp_code": "123456"
}
```
**Response:** { access_token, refresh_token, user }

#### 2. Vérifier TOTP
```http
POST /auth/totp/verify
```
**Body:**
```json
{
  "login_token": "temp_token",
  "totp_code": "123456"
}
```

---

## 👥 Système d'Invitation Gestionnaire

#### 1. Vérifier Token d'Invitation
```http
GET /auth/verify-invitation?token=uuid-invitation-token
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "email": "gestionnaire@example.com",
    "id_utilisateur": "uuid",
    "parking_nom": "Parking Casablanca"
  }
}
```

#### 2. Compléter Première Connexion
```http
POST /auth/complete-first-connection
```
**Body:**
```json
{
  "token": "uuid-invitation-token",
  "email": "gestionnaire@example.com",
  "nouveau_mot_de_passe": "SecurePass123",
  "accepte_conditions": true
}
```
**Rate Limit:** 5 tentatives par 15 min  
**Response:** { id_utilisateur, email, statut_compte }

#### 3. Renvoyer Invitation
```http
POST /auth/resend-invitation
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "id_utilisateur": "uuid"
}
```
**Permissions:** Admin seulement

#### 4. Créer Gestionnaire (Admin)
```http
POST /auth/admin/gestionnaires
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "email": "new.gestionnaire@example.com",
  "nom": "Dupont",
  "prenom": "Marie",
  "phone": "+212612345678",
  "parkings_assignes": ["parking_id_1", "parking_id_2"]
}
```

#### 5. Créer Utilisateur (Admin)
```http
POST /auth/admin/users
```
**Body:**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "user@example.com",
  "mot_de_passe": "TempPass123!",
  "role": "chauffeur",
  "numero_telephone": "+212612345678",
  "adresse": "123 Rue de la Paix"
}
```

---

## 👤 Utilisateurs

### Routes : `/utilisateurs`

#### 1. Voir Son Profil
```http
GET /utilisateurs/profil
Authorization: Bearer <token>
```
**Permissions:** profil:lire  
**Response:** { id_utilisateur, email, nom, prenom, ... }

#### 2. Modifier Son Profil
```http
PATCH /utilisateurs/profil
Authorization: Bearer <token>
```
**Permissions:** profil:modifier  
**Body:**
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prénom",
  "numero_telephone": "+212612345678",
  "adresse": "Nouvelle Adresse"
}
```

#### 3. Lister Tous les Utilisateurs (Admin)
```http
GET /utilisateurs
Authorization: Bearer <admin_token>
```
**Permissions:** admin  
**Response:** { success, data: [users] }

#### 4. Obtenir Un Utilisateur (Admin)
```http
GET /utilisateurs/:id
Authorization: Bearer <admin_token>
```
**Permissions:** admin

#### 5. Modifier Utilisateur (Admin)
```http
PATCH /utilisateurs/:id
Authorization: Bearer <admin_token>
```

#### 6. Supprimer Utilisateur (Admin)
```http
DELETE /utilisateurs/:id
Authorization: Bearer <admin_token>
```

#### 7. Changer Statut Utilisateur
```http
PATCH /utilisateurs/:id/statut
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "statut": "actif" | "inactif"
}
```

#### 8. Ajouter Rôle
```http
POST /utilisateurs/:id/roles
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "role": "chauffeur"
}
```

#### 9. Retirer Rôle
```http
DELETE /utilisateurs/:id/roles/:role
Authorization: Bearer <admin_token>
```

---

## 🚗 Trajets (Courses)

### Routes : `/trajets`

#### 1. Lister les Trajets
```http
GET /trajets
Authorization: Bearer <token>
```
**Permissions:** trajet:lire  
**Query Params:**
- `skip` (int) - Pagination
- `take` (int) - Limite

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id_trajet": "uuid",
      "depart": "Casablanca",
      "arrivee": "Rabat",
      "prix": 150.00,
      "date_depart": "2026-05-26T14:30:00Z",
      "chauffeur": { ... },
      "statut": "en_cours"
    }
  ]
}
```

#### 2. Historique Trajets
```http
GET /trajets/historique
Authorization: Bearer <token>
```
**Permissions:** trajet:lire

#### 3. Détail Trajet
```http
GET /trajets/:id
Authorization: Bearer <token>
```

#### 4. Créer Trajet
```http
POST /trajets
Authorization: Bearer <token>
```
**Permissions:** trajet:creer  
**Body:**
```json
{
  "depart": "Casablanca",
  "arrivee": "Rabat",
  "lieu_depart": "Place Mohammed V",
  "lieu_arrivee": "Gare Routière",
  "date_depart": "2026-05-26T14:30:00Z",
  "price": 150.00,
  "places_disponibles": 4,
  "description": "Course direct"
}
```

#### 5. Calculer Tarif
```http
POST /trajets/tarif
Authorization: Bearer <token>
```
**Body:**
```json
{
  "depart_lat": 33.5731,
  "depart_lng": -7.5898,
  "arrivee_lat": 34.0209,
  "arrivee_lng": -6.8416,
  "distance_km": 95
}
```
**Response:** { prix: 150.00 }

#### 6. Appliquer Promo
```http
POST /trajets/:id/promo
Authorization: Bearer <token>
```
**Permissions:** trajet:lire  
**Body:**
```json
{
  "code_promo": "PROMO20"
}
```

#### 7. Modifier Trajet
```http
PATCH /trajets/:id
Authorization: Bearer <token>
```
**Permissions:** trajet:modifier

#### 8. Démarrer Trajet
```http
PATCH /trajets/:id/demarrer
Authorization: Bearer <token>
```
**Permissions:** trajet:demarrer  
**Rôle:** Chauffeur uniquement

#### 9. Terminer Trajet
```http
PATCH /trajets/:id/terminer
Authorization: Bearer <token>
```
**Permissions:** trajet:terminer  
**Body:**
```json
{
  "lieu_arrivee_reel": "Gare Routière",
  "prix_final": 155.00
}
```

#### 10. Annuler Trajet
```http
PATCH /trajets/:id/annuler
Authorization: Bearer <token>
```
**Permissions:** trajet:annuler  
**Body:**
```json
{
  "raison": "Raison de l'annulation"
}
```

---

## 🅿️ Parkings

### Routes : `/parkings`

#### 1. Lister Parkings
```http
GET /parkings
Authorization: Bearer <token>
```
**Permissions:** parking:lire  
**Response:** Array de parkings avec capacité, location, etc.

#### 2. Détail Parking
```http
GET /parkings/:id
Authorization: Bearer <token>
```

#### 3. Créer Parking (Admin)
```http
POST /parkings
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "nom": "Parking Central",
  "adresse": "123 Rue Principale",
  "ville": "Casablanca",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "capacite_totale": 100,
  "prix_horaire": 5.00,
  "conditions": "Parking surveillé 24/7"
}
```

#### 4. Modifier Parking (Admin)
```http
PATCH /parkings/:id
Authorization: Bearer <admin_token>
```

#### 5. Mouvements Parking
```http
GET /parkings/mouvements
Authorization: Bearer <token>
```
**Query Params:** skip, take, id_parking, date_debut, date_fin

#### 6. Ajouter Mouvement
```http
POST /parkings/:id/mouvement
Authorization: Bearer <token>
```
**Permissions:** parking:gerer  
**Body:**
```json
{
  "id_vehicule": "uuid",
  "type_mouvement": "entree" | "sortie",
  "timestamp": "2026-05-26T14:30:00Z",
  "notes": "Mouvement normal"
}
```

### Endpoints Parkeur

#### 1. Détail Parking (Vue Parkeur)
```http
GET /parkings/:parkingId/detail-parkeur
Authorization: Bearer <token>
```

#### 2. Véhicules Garés
```http
GET /parkings/:parkingId/vehicules
Authorization: Bearer <token>
```

#### 3. Mouvements Parkeur
```http
GET /parkings/:parkingId/mouvements-parkeur
Authorization: Bearer <token>
```

#### 4. Enregistrer Entrée
```http
POST /parkings/:parkingId/entree
Authorization: Bearer <token>
```
**Permissions:** parking:gerer  
**Body:**
```json
{
  "numero_plaque": "ABC-1234",
  "nom_conducteur": "Jean Dupont",
  "tel_conducteur": "+212612345678",
  "type_vehicule": "berline"
}
```

#### 5. Enregistrer Sortie
```http
POST /parkings/:parkingId/sortie
Authorization: Bearer <token>
```
**Body:**
```json
{
  "id_mouvement": "uuid",
  "montant_paiement": 25.00
}
```

### Maintenance du Parking

#### 1. Lister Demandes de Maintenance
```http
GET /parkings/:parkingId/maintenance
Authorization: Bearer <token>
```

#### 2. Créer Demande de Maintenance
```http
POST /parkings/:parkingId/maintenance
Authorization: Bearer <token>
```
**Body:**
```json
{
  "type": "reparation" | "nettoyage" | "autre",
  "description": "Puissance d'eau défaillante",
  "priorite": "haute" | "moyenne" | "basse",
  "date_souhaitee": "2026-05-27"
}
```

#### 3. Obtenir Demande
```http
GET /parkings/:parkingId/maintenance/:maintenanceId
```

#### 4. Mettre à Jour Statut
```http
PATCH /parkings/:parkingId/maintenance/:maintenanceId
Authorization: Bearer <token>
```
**Body:**
```json
{
  "statut": "en_cours" | "termine" | "annule",
  "notes": "Réparation terminée"
}
```

### Photos

#### 1. Upload Photo
```http
POST /parkings/mouvements/:mouvementId/photos
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Field:** `photo` (file)

#### 2. Upload Photo Maintenance
```http
POST /parkings/maintenance/:maintenanceId/photos
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 3. Télécharger Photo
```http
GET /parkings/photos/:photoId
```

#### 4. Supprimer Photo
```http
DELETE /parkings/photos/:photoId
Authorization: Bearer <token>
```

---

## 🚙 Véhicules

### Routes : `/vehicules` ou `/vehicule`

#### 1. Lister Véhicules
```http
GET /vehicules
Authorization: Bearer <token>
```
**Permissions:** vehicule:lire

#### 2. Détail Véhicule
```http
GET /vehicules/:id
Authorization: Bearer <token>
```

#### 3. Créer Véhicule
```http
POST /vehicules
Authorization: Bearer <token>
```
**Permissions:** vehicule:creer  
**Body:**
```json
{
  "marque": "Toyota",
  "modele": "Camry",
  "annee": 2022,
  "numero_plaque": "ABC-1234",
  "numero_chassis": "XXXXXXXXXXXXXX",
  "type_carburant": "essence" | "diesel",
  "nombre_places": 5,
  "couleur": "blanc",
  "charge_utile_kg": 500
}
```

#### 4. Modifier Véhicule
```http
PATCH /vehicules/:id
Authorization: Bearer <token>
```
**Permissions:** vehicule:modifier

#### 5. Mettre à Jour Position
```http
PATCH /vehicules/:id/position
Authorization: Bearer <token>
```
**Permissions:** vehicule:modifier  
**Body:**
```json
{
  "latitude": 33.5731,
  "longitude": -7.5898,
  "vitesse": 60
}
```

#### 6. Tracking Véhicule
```http
GET /vehicules/:id/tracking
Authorization: Bearer <token>
```
**Permissions:** tracking:lire  
**Response:** { positions: [ { lat, lng, timestamp, vitesse } ] }

#### 7. Supprimer Véhicule
```http
DELETE /vehicules/:id
Authorization: Bearer <token>
```
**Permissions:** Selon rôle

---

## 👨‍✈️ Chauffeurs

### Routes : `/chauffeurs`

#### 1. Lister Chauffeurs
```http
GET /chauffeurs
Authorization: Bearer <token>
```
**Permissions:** profil:lire

#### 2. Détail Chauffeur
```http
GET /chauffeurs/:id
Authorization: Bearer <token>
```
**Permissions:** chauffeur:lire

#### 3. Modifier Chauffeur
```http
PATCH /chauffeurs/:id
Authorization: Bearer <token>
```
**Permissions:** chauffeur:modifier

#### 4. Valider Chauffeur (Admin)
```http
PATCH /chauffeurs/:id/valider
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "statut_validation": "approuve" | "rejete"
}
```

#### 5. Suspendre Chauffeur (Admin)
```http
PATCH /chauffeurs/:id/suspendre
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "raison": "Violation de règlement"
}
```

#### 6. Changer Disponibilité
```http
PATCH /chauffeurs/disponibilite
Authorization: Bearer <token>
```
**Permissions:** disponibilite:modifier  
**Body:**
```json
{
  "disponible": true | false
}
```

#### 7. Statistiques Chauffeur
```http
GET /chauffeurs/:id/statistiques
Authorization: Bearer <token>
```
**Permissions:** chauffeur:lire  
**Response:** { nb_trajets, rating_moyen, revenus_total, ... }

---

## 📋 Réservations

### Routes : `/reservation`

#### 1. Lister Réservations (Admin)
```http
GET /reservation
Authorization: Bearer <admin_token>
```
**Permissions:** admin

#### 2. Mes Réservations
```http
GET /reservation/mes-reservations
Authorization: Bearer <token>
```
**Permissions:** trajet:lire  
**Response:** Réservations de l'utilisateur connecté

#### 3. Réserver Trajet
```http
POST /reservation/:id_trajet/reserver
Authorization: Bearer <token>
```
**Permissions:** trajet:reserver  
**Body:**
```json
{
  "nombre_places": 2,
  "passagers": [
    {
      "nom": "Dupont",
      "prenom": "Alice",
      "tel": "+212612345678"
    }
  ]
}
```

#### 4. Annuler Réservation
```http
PATCH /reservation/:id/annuler
Authorization: Bearer <token>
```
**Permissions:** trajet:annuler  
**Body:**
```json
{
  "raison": "Raison de l'annulation"
}
```

---

## 💳 Paiements

### Routes : `/paiement`

#### 1. Lister Paiements (Admin)
```http
GET /paiement
Authorization: Bearer <admin_token>
```

#### 2. Mes Paiements
```http
GET /paiement/mes-paiements
Authorization: Bearer <token>
```
**Permissions:** paiement:lire

#### 3. Créer Paiement
```http
POST /paiement
Authorization: Bearer <token>
```
**Permissions:** paiement:creer  
**Body:**
```json
{
  "montant": 150.00,
  "moyen_paiement": "carte" | "portefeuille" | "especes",
  "id_trajet": "uuid",
  "reference": "REF123"
}
```

#### 4. Confirmer Paiement (Admin)
```http
PATCH /paiement/:id/confirmer
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "statut": "confirme" | "rejete"
}
```

### Portefeuille

#### 1. Mon Portefeuille
```http
GET /paiement/portefeuille
Authorization: Bearer <token>
```
**Permissions:** portefeuille:lire  
**Response:** { solde: 500.50, devise: "MAD", ... }

#### 2. Mouvements Portefeuille
```http
GET /paiement/portefeuille/mouvements
Authorization: Bearer <token>
```
**Permissions:** portefeuille:lire  
**Query Params:** skip, take

#### 3. Créditer Portefeuille (Admin)
```http
PATCH /paiement/portefeuille/:id/crediter
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "montant": 100.00,
  "raison": "Remboursement"
}
```

#### 4. Débiter Portefeuille (Admin)
```http
PATCH /paiement/portefeuille/:id/debiter
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "montant": 50.00,
  "raison": "Pénalité"
}
```

---

## 🎟️ Codes Promo

### Routes : `/code-promo`

#### 1. Lister Codes Promo (Admin)
```http
GET /code-promo
Authorization: Bearer <admin_token>
```
**Permissions:** admin  
**Query Params:** skip, take, actif

#### 2. Créer Code Promo (Admin)
```http
POST /code-promo
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "code": "PROMO20",
  "description": "20% de réduction",
  "type": "pourcentage" | "montant_fixe",
  "valeur": 20,
  "date_debut": "2026-05-26",
  "date_fin": "2026-12-31",
  "utilisations_max": 100,
  "utilisations_par_client": 1,
  "montant_min": 50.00,
  "actif": true
}
```

#### 3. Valider Code Promo
```http
GET /code-promo/:code/valider
Authorization: Bearer <token>
```
**Permissions:** trajet:reserver  
**Response:** { code, type, valeur, montant_reduction, ... }

#### 4. Modifier Code Promo
```http
PUT /code-promo/:id
Authorization: Bearer <admin_token>
```

#### 5. Toggle Actif/Inactif
```http
PATCH /code-promo/:id/toggle
Authorization: Bearer <admin_token>
```

---

## ⭐ Avis

### Routes : `/avis`

#### 1. Lister Avis
```http
GET /avis/avis
Authorization: Bearer <token>
```
**Permissions:** avis:lire

#### 2. Créer Avis
```http
POST /avis/avis
Authorization: Bearer <token>
```
**Permissions:** avis:creer  
**Body:**
```json
{
  "id_trajet": "uuid",
  "id_chauffeur": "uuid",
  "note": 5,
  "commentaire": "Très bon trajet !",
  "points_positifs": ["ponctualité", "propreté"],
  "points_negatifs": []
}
```

#### 3. Note Moyenne
```http
GET /avis/avis/:id/note
Authorization: Bearer <token>
```
**Permissions:** avis:lire  
**Response:** { note_moyenne: 4.7, nb_avis: 150, ... }

---

## 📋 Affectations Véhicule

### Routes : `/affectation`

#### 1. Assigner Véhicule (Admin)
```http
POST /affectation/affectations
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "id_vehicule": "uuid",
  "id_chauffeur": "uuid",
  "date_debut": "2026-05-26",
  "date_fin": "2026-06-26",
  "conditions": "Affectation permanente"
}
```

#### 2. Terminer Affectation (Admin)
```http
PATCH /affectation/affectations/:id/terminer
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "raison": "Fin de contrat"
}
```

#### 3. Historique Affectations Véhicule
```http
GET /affectation/:id_vehicule/affectations
Authorization: Bearer <token>
```
**Permissions:** vehicule:lire

#### 4. Affectation Actuelle Chauffeur
```http
GET /affectation/chauffeur/:id_chauffeur/affectation
Authorization: Bearer <token>
```
**Permissions:** vehicule:lire

---

## 📱 Notifications

### Routes : `/notification`

#### 1. Lister Notifications
```http
GET /notification
Authorization: Bearer <token>
```

#### 2. Marquer comme Lue
```http
PATCH /notification/:id/lire
Authorization: Bearer <token>
```

#### 3. Supprimer Notification
```http
DELETE /notification/:id
Authorization: Bearer <token>
```

---

## 📄 Documents

### Routes : `/documents`

#### 1. Lister Documents (Admin)
```http
GET /documents
Authorization: Bearer <admin_token>
```
**Permissions:** admin

#### 2. Mes Documents
```http
GET /documents/me
Authorization: Bearer <token>
```
**Permissions:** profil:lire

#### 3. Upload Document
```http
POST /documents
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Permissions:** profil:modifier  
**Fields:**
- `fichier` (file)
- `type_document` (string)

#### 4. Valider Document (Admin)
```http
PATCH /documents/:id/valider
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "statut": "approuve" | "rejete",
  "commentaires": "Document accepté"
}
```

#### 5. Rejeter Document (Admin)
```http
PATCH /documents/:id/rejeter
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "raison": "Document illisible"
}
```

#### 6. Télécharger Fichier
```http
GET /documents/:id/fichier
```

---

## 🎛️ Configuration

### Zones Tarifaires

#### Routes : `/config/zones`

```http
GET    /config/zones                    # Lister
POST   /config/zones                    # Créer (admin)
GET    /config/zones/:id                # Détail
PATCH  /config/zones/:id                # Modifier (admin)
DELETE /config/zones/:id                # Supprimer (admin)
```

### Catégories Véhicule

#### Routes : `/config/categories`

```http
GET    /config/categories               # Lister
POST   /config/categories               # Créer (admin)
GET    /config/categories/:id           # Détail
PATCH  /config/categories/:id           # Modifier (admin)
DELETE /config/categories/:id           # Supprimer (admin)
```

### Tarifs Zone/Catégorie

#### Routes : `/config/tarifs`

```http
GET    /config/tarifs                   # Lister avec filtres
POST   /config/tarifs                   # Créer (admin)
GET    /config/tarifs/:id               # Détail
PATCH  /config/tarifs/:id               # Modifier (admin)
DELETE /config/tarifs/:id               # Supprimer (admin)
```

---

## 📊 Dashboard & KPIs

### Routes : `/dashboard`

#### 1. KPIs Générales
```http
GET /dashboard/kpis
Authorization: Bearer <token>
```
**Response:**
```json
{
  "nb_trajets_jour": 45,
  "revenus_jour": 7500.00,
  "nb_chauffeurs_actifs": 23,
  "taux_satisfaction": 4.8
}
```

#### 2. Top Chauffeurs
```http
GET /dashboard/top-chauffeurs
Authorization: Bearer <token>
```

#### 3. Courses Semaine
```http
GET /dashboard/courses-semaine
Authorization: Bearer <token>
```

#### 4. Moyens de Paiement
```http
GET /dashboard/moyens-paiement
Authorization: Bearer <token>
```

#### 5. Évolution Mensuelle
```http
GET /dashboard/evolution-mensuelle
Authorization: Bearer <token>
```

---

## 🧑‍💼 Gestionnaire

### Routes : `/gestionnaire`

#### 1. Mon Parking
```http
GET /gestionnaire/me/parking
Authorization: Bearer <gestionnaire_token>
```
**Response:** { id_parking, nom, adresse, capacite, mouvements_jour, ... }

#### 2. Créer Gestionnaire (Admin)
```http
POST /admin/gestionnaires
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "email": "gestionnaire@example.com",
  "nom": "Dupont",
  "prenom": "Marie",
  "phone": "+212612345678",
  "parkings_assignes": ["parking_id_1"]
}
```

---

## 🎟️ Support Tickets

### Routes : `/support/tickets`

#### 1. Lister Tickets
```http
GET /support/tickets
Authorization: Bearer <token>
```

#### 2. Créer Ticket
```http
POST /support/tickets
Authorization: Bearer <token>
```
**Body:**
```json
{
  "sujet": "Problème de paiement",
  "description": "Je n'arrive pas à payer ma course",
  "priorite": "haute" | "normale" | "basse"
}
```

#### 3. Répondre Ticket
```http
POST /support/tickets/:id/reponses
Authorization: Bearer <token>
```
**Body:**
```json
{
  "contenu": "Voici la solution..."
}
```

#### 4. Fermer Ticket (Admin)
```http
PATCH /support/tickets/:id/fermer
Authorization: Bearer <admin_token>
```

---

## 💰 Finances

### Routes : `/finances`

#### 1. Rapport Financier
```http
GET /finances/rapport
Authorization: Bearer <admin_token>
```
**Query Params:** date_debut, date_fin

#### 2. Exportation Données
```http
GET /finances/export
Authorization: Bearer <admin_token>
```
**Query Params:** format (csv|excel), date_debut, date_fin

---

## 🔐 Rôles et Permissions

### Rôles Disponibles
- **admin** - Accès complet
- **gestionnaire** - Gestion du parking assigné
- **chauffeur** - Opérations de course
- **parkeur** - Opérations de parking (entrée/sortie)
- **passager** - Réservation et suivi
- **proprietaire** - Gestion des véhicules personnels
- **it** - Support technique

### Permissions Principales
```
profil:lire, profil:modifier
trajet:lire, trajet:creer, trajet:modifier, trajet:demarrer, trajet:terminer, trajet:annuler, trajet:reserver
vehicule:lire, vehicule:creer, vehicule:modifier, vehicule:supprimer
vehicule:tracking
chauffeur:lire, chauffeur:modifier
parking:lire, parking:gerer
parking:gerer, parking:incidents
disponibilite:modifier
paiement:lire, paiement:creer
portefeuille:lire
avis:lire, avis:creer
incident:lire, incident:declarer
```

---

## ⏱️ Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Login | 10 par 15 min |
| OTP Request | 1 par 60s, 5 par 24h |
| Forgot Password | 3 par 24h |
| Reset Password | 5 par 15 min |
| First Connection | 5 par 15 min |
| Document Upload | 10 par 24h |
| Global API | 1000 par 15 min |

---

## 📊 Codes de Réponse HTTP

| Code | Signification |
|------|---------------|
| 200 | OK - Opération réussie |
| 201 | Created - Ressource créée |
| 400 | Bad Request - Données invalides |
| 401 | Unauthorized - Non authentifié |
| 403 | Forbidden - Permissions insuffisantes |
| 404 | Not Found - Ressource introuvable |
| 409 | Conflict - Conflit (ex: entité déjà existe) |
| 429 | Too Many Requests - Rate limit dépassé |
| 500 | Internal Server Error - Erreur serveur |

---

## 🛡️ Sécurité

### Headers Importants
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
```

### Validations
- Email valide (RFC 5322)
- Numéro de téléphone international
- Mot de passe min. 8 caractères
- UUID pour les identifiants

### Protection CORS
- Domaines autorisés configurables
- Credentials supportés

---

## 📝 Exemples cURL

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Créer Trajet
```bash
curl -X POST http://localhost:8000/api/v1/trajets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "depart": "Casablanca",
    "arrivee": "Rabat",
    "lieu_depart": "Place Mohammed V",
    "date_depart": "2026-05-26T14:30:00Z",
    "price": 150.00,
    "places_disponibles": 4
  }'
```

### Upload Document
```bash
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fichier=@/path/to/file.pdf" \
  -F "type_document=permis_conduire"
```

---

## 🔄 Flux de Requête/Réponse

```
1. Client envoie requête avec Authorization header
2. Middleware authenticate vérifie le token
3. Middleware authorize vérifie les permissions
4. Middleware validate valide les données
5. Controller traite la requête
6. Response interceptor standardise la réponse
7. Client reçoit réponse standardisée
```

---

## 📚 Base de Données

**ORM:** Prisma  
**Database:** PostgreSQL  
**Version:** 12+

### Principales Entités
- Utilisateurs
- Trajets
- Véhicules
- Chauffeurs
- Parkings
- Mouvements (entrée/sortie)
- Paiements
- Réservations
- Avis
- Documents
- Notifications

---

## 🚀 Démarrage

```bash
# Installation
npm install

# Variables d'environnement
cp .env.example .env

# Migration BD
npx prisma migrate dev

# Seed données (DEV)
npm run seed

# Démarrage serveur
npm run dev
```

---

**Dernière mise à jour:** 26 mai 2026  
**Auteur:** N'DJIGI Backend Team
