OLL# AUDIT DES APPELS API FLUTTER
## Écrans Profil et Centre d'Assistance — App Passager N'DJIGI

**Date:** 2026-06-05  
**Statut:** Audit complet  
**Auteur:** Claude Code

---

## TABLE DES MATIÈRES
1. [ÉCRAN PROFIL PASSAGER](#écran-profil-passager)
2. [ÉCRAN CENTRE D'ASSISTANCE](#écran-centre-dassistance)
3. [Hypothèses et notes générales](#hypothèses-et-notes-générales)

---

# ÉCRAN PROFIL PASSAGER

## Vue d'ensemble
Écran scrollable organisé en sections distinctes. L'utilisateur peut consulter et modifier ses informations personnelles, ses adresses, son portefeuille, ses paramètres de sécurité, etc.

---

## SECTION 1 : EN-TÊTE DU PROFIL

### 1.1 — Afficher la photo de l'utilisateur et les informations de base

**Endpoint:** `GET /utilisateurs/profil`

**Objectif:** Récupérer les données du profil connecté (photo, nom, prénom, téléphone, statut de vérification).

**Moment d'exécution:** Lors du chargement initial de l'écran.

**Paramètres envoyés:** Aucun (l'authentification se fait via le token JWT en header).

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "uuid",
    "prenom": "Jean",
    "nom": "Dupont",
    "email": "jean.dupont@example.com",
    "numero_telephone": "+221770000000",
    "photo_profil": "https://cdn.ndjigi.com/photos/...",
    "adresse": "123 Rue de la Paix, Dakar",
    "deux_fa_activee": true,
    "statut_compte": "actif",
    "note_moyenne": 4.5,
    "date_inscription": "2025-03-15T10:30:00Z"
  }
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token expiré ou invalide → rediriger vers login
- `403 Forbidden` : Compte suspendu ou supprimé
- `500 Internal Server Error` : Afficher un message d'erreur avec bouton "Réessayer"

---

### 1.2 — Modifier la photo de profil

**Endpoint:** `POST /photos`

**Objectif:** Uploader une nouvelle photo de profil.

**Moment d'exécution:** Au clic sur le bouton crayon pour changer la photo.

**Paramètres envoyés:**
- `ownerType` (form-data): `"utilisateur"`
- `ownerId` (form-data): ID de l'utilisateur (optionnel si owner = utilisateur connecté)
- `isPrincipale` (form-data): `"true"`
- `photos` (form-data, multipart): Fichier image (JPEG, PNG, WebP recommandés)

**Corps de requête:**
```
Form-Data:
- ownerType: "utilisateur"
- isPrincipale: "true"
- photos: [file]
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id_photo": "uuid",
        "fileKey": "2025-06/userId/uuid.jpg",
        "filename": "profile.jpg",
        "filepath": "/photos/...",
        "mimeType": "image/jpeg",
        "fileSize": 245000,
        "is_principale": true,
        "uploadedAt": "2026-06-05T14:30:00Z"
      }
    ]
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Format de fichier invalide, fichier trop volumineux (max ~5MB recommandé)
- `413 Payload Too Large` : Implémenter un message "Fichier trop volumineux"
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de l'upload

---

## SECTION 2 : INFORMATIONS PERSONNELLES

### 2.1 — Afficher les informations personnelles (Prénom, Nom, Téléphone, E-mail)

**Endpoint:** `GET /utilisateurs/profil`

**Objectif:** Utiliser les données déjà récupérées en 1.1. Les informations personnelles sont incluses dans la même réponse.

**Moment d'exécution:** Déjà chargé à l'initialisation de l'écran.

**Paramètres envoyés:** N/A

**Corps de requête:** N/A

**Réponse attendue:** Voir 1.1

**Gestion des erreurs:** Voir 1.1

---

### 2.2 — Modifier une information personnelle (Prénom, Nom, Téléphone ou E-mail)

**Endpoint:** `PATCH /utilisateurs/profil`

**Objectif:** Mettre à jour un ou plusieurs champs du profil.

**Moment d'exécution:** Après validation du formulaire d'édition (au clic sur l'icône crayon puis confirmation).

**Paramètres envoyés:** Aucun

**Corps de requête:**
```json
{
  "prenom": "Jean (optionnel)",
  "nom": "Dupont (optionnel)",
  "numero_telephone": "+221770000000 (optionnel)",
  "email": "jean.dupont@example.com (optionnel)",
  "adresse": "123 Rue de la Paix, Dakar (optionnel)"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "uuid",
    "prenom": "Jean",
    "nom": "Dupont",
    "email": "jean.dupont@example.com",
    "numero_telephone": "+221770000000",
    "adresse": "123 Rue de la Paix, Dakar"
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Validation échouée (format e-mail, numéro invalide, etc.)
- `409 Conflict` : L'e-mail ou le numéro de téléphone existe déjà
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la mise à jour

---

## SECTION 3 : ADRESSES FAVORITES

### 3.1 — Lister les adresses favorites

**Endpoint:** `GET /addresses` ou `GET /addresses?favorite=true`

**Objectif:** Récupérer la liste des adresses favorites (Domicile, Travail, etc.).

**Moment d'exécution:** Lors du chargement initial de l'écran ou au besoin (refresh).

**Paramètres envoyés:**
- `favorite` (query): `true` (optionnel, pour filtrer uniquement les favorites)
- `page` (query): `1`
- `limit` (query): `10`

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id_address": "uuid",
      "label": "Domicile",
      "address": "123 Rue de la Paix, Dakar, Sénégal",
      "latitude": 14.7167,
      "longitude": -17.4674,
      "isfavorite": true,
      "createdAt": "2025-03-15T10:30:00Z",
      "updatedAt": "2025-06-01T08:45:00Z"
    },
    {
      "id_address": "uuid2",
      "label": "Travail",
      "address": "456 Avenue Bourguiba, Dakar",
      "latitude": 14.7000,
      "longitude": -17.4500,
      "isfavorite": true,
      "createdAt": "2025-04-20T14:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la récupération

---

### 3.2 — Ajouter une adresse favorite

**Endpoint:** `POST /addresses`

**Objectif:** Créer une nouvelle adresse favorite (Domicile, Travail, etc.).

**Moment d'exécution:** Au clic sur le bouton "Ajouter une adresse".

**Paramètres envoyés:** Aucun

**Corps de requête:**
```json
{
  "label": "Domicile",
  "address": "123 Rue de la Paix, Dakar, Sénégal",
  "latitude": 14.7167,
  "longitude": -17.4674,
  "isfavorite": true
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_address": "uuid-new",
    "label": "Domicile",
    "address": "123 Rue de la Paix, Dakar, Sénégal",
    "latitude": 14.7167,
    "longitude": -17.4674,
    "isfavorite": true,
    "createdAt": "2026-06-05T14:30:00Z"
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Validation échouée (adresse trop courte, coordonnées invalides, etc.)
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la création

---

### 3.3 — Modifier une adresse favorite

**Endpoint:** `PATCH /addresses/{id}`

**Objectif:** Mettre à jour une adresse existante.

**Moment d'exécution:** Au clic sur l'icône crayon d'une adresse.

**Paramètres envoyés:**
- `id` (path): ID de l'adresse (UUID)

**Corps de requête:**
```json
{
  "label": "Maison (optionnel)",
  "address": "789 Boulevard, Dakar (optionnel)",
  "latitude": 14.7200,
  "longitude": -17.4700,
  "isfavorite": true
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_address": "uuid",
    "label": "Maison",
    "address": "789 Boulevard, Dakar",
    "latitude": 14.7200,
    "longitude": -17.4700,
    "isfavorite": true,
    "updatedAt": "2026-06-05T14:35:00Z"
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Validation échouée
- `404 Not Found` : Adresse non trouvée
- `401 Unauthorized` : Token expiré

---

### 3.4 — Supprimer une adresse favorite

**Endpoint:** `DELETE /addresses/{id}`

**Objectif:** Supprimer une adresse favorite.

**Moment d'exécution:** Au clic sur l'icône corbeille d'une adresse (avec confirmation).

**Paramètres envoyés:**
- `id` (path): ID de l'adresse (UUID)

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Adresse supprimée avec succès"
}
```

**Gestion des erreurs:**
- `404 Not Found` : Adresse non trouvée
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la suppression

---

## SECTION 4 : PORTEFEUILLE N'DJIGI

### 4.1 — Afficher le solde du portefeuille

**Endpoint:** `GET /paiement/portefeuille`

**Objectif:** Récupérer le solde disponible du portefeuille de l'utilisateur.

**Moment d'exécution:** Lors du chargement initial de l'écran.

**Paramètres envoyés:** Aucun

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_portefeuille": "uuid",
    "id_utilisateur": "uuid",
    "solde": 25500.50,
    "dette_commission": 0.00,
    "devise": "XOF",
    "statut": "actif"
  }
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token expiré
- `404 Not Found` : Portefeuille non trouvé (créer un nouveau si absent)
- `500 Internal Server Error` : Erreur lors de la récupération

---

### 4.2 — Naviguer vers l'écran de recharge (Bouton "Recharger")

**Endpoint:** Pas d'appel API direct ; naviguer vers `/paiement/recharge` via go_router.

**Objectif:** Rediriger l'utilisateur vers l'écran de recharge du portefeuille.

**Moment d'exécution:** Au clic sur le bouton "Recharger".

**Navigation:** `context.push('/paiement/recharge')`

---

### 4.3 — Naviguer vers l'historique des paiements (Bouton "Historique")

**Endpoint:** Pas d'appel API direct ; naviguer vers `/paiement/historique` ou `/paiement/mouvements`.

**Objectif:** Afficher l'historique des mouvements du portefeuille.

**Moment d'exécution:** Au clic sur le bouton "Historique".

**Navigation:** `context.push('/paiement/historique')`

---

## SECTION 5 : CENTRE DE SÉCURITÉ

### 5.1 — Lister les contacts de confiance

**Endpoint:** `GET /contacts-confiance`

**Objectif:** Récupérer la liste des contacts de confiance (jusqu'à 3).

**Moment d'exécution:** Lors du chargement initial de l'écran.

**Paramètres envoyés:**
- `page` (query): `1`
- `limit` (query): `10` (ou tout nombre ≥ 3)

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id_contact": "uuid",
      "nom": "Dupont",
      "prenom": "Marie",
      "country_code": "+221",
      "phone": "770123456",
      "relation": "mere",
      "createdAt": "2025-06-01T10:30:00Z"
    },
    {
      "id_contact": "uuid2",
      "nom": "Martin",
      "prenom": "Pierre",
      "country_code": "+221",
      "phone": "770234567",
      "relation": "ami",
      "createdAt": "2025-06-02T14:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la récupération

---

### 5.2 — Ajouter un contact de confiance

**Endpoint:** `POST /contacts-confiance`

**Objectif:** Ajouter un nouveau contact de confiance (limité à 3 max, à valider côté Flutter).

**Moment d'exécution:** Au clic sur "Ajouter un contact" (si < 3 contacts).

**Paramètres envoyés:** Aucun

**Corps de requête:**
```json
{
  "nom": "Dupont",
  "prenom": "Marie",
  "country_code": "+221",
  "phone": "770123456",
  "relation": "mere"
}
```

**Relations valides:** `parent`, `enfant`, `conjoint`, `frere`, `soeur`, `cousin`, `copain`, `copine`, `autre`

**Codes pays:** Voir le fichier `contact.validator.js` (inclut +221 pour Sénégal, +33 pour France, etc.)

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_contact": "uuid-new",
    "nom": "Dupont",
    "prenom": "Marie",
    "country_code": "+221",
    "phone": "770123456",
    "relation": "mere",
    "createdAt": "2026-06-05T14:30:00Z"
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Validation échouée (relation invalide, numéro mal formaté, etc.)
- `401 Unauthorized` : Token expiré
- `409 Conflict` : Contact en doublon (même numéro)
- `500 Internal Server Error` : Erreur lors de la création

---

### 5.3 — Modifier un contact de confiance

**Endpoint:** `PATCH /contacts-confiance/{id}`

**Objectif:** Mettre à jour un contact existant.

**Moment d'exécution:** Au clic sur l'icône crayon d'un contact.

**Paramètres envoyés:**
- `id` (path): ID du contact (UUID)

**Corps de requête:**
```json
{
  "nom": "Dupont (optionnel)",
  "prenom": "Marie (optionnel)",
  "country_code": "+221 (optionnel)",
  "phone": "770123456 (optionnel)",
  "relation": "mere (optionnel)"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_contact": "uuid",
    "nom": "Dupont",
    "prenom": "Marie",
    "country_code": "+221",
    "phone": "770123456",
    "relation": "tante",
    "updatedAt": "2026-06-05T14:35:00Z"
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Validation échouée
- `404 Not Found` : Contact non trouvé
- `401 Unauthorized` : Token expiré

---

### 5.4 — Supprimer un contact de confiance

**Endpoint:** `DELETE /contacts-confiance/{id}`

**Objectif:** Supprimer un contact de confiance.

**Moment d'exécution:** Au clic sur l'icône corbeille d'un contact (avec confirmation).

**Paramètres envoyés:**
- `id` (path): ID du contact (UUID)

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Contact supprimé avec succès"
}
```

**Gestion des erreurs:**
- `404 Not Found` : Contact non trouvé
- `401 Unauthorized` : Token expiré

---

### 5.5 — Afficher tutoriel SOS (BottomSheet)

**Objectif:** Afficher les instructions sur le bouton SOS en cas d'urgence.

**Moment d'exécution:** Au clic sur "Tutoriel SOS".

**Implémentation:** Contenu statique en dur dans le widget Flutter (pas d'appel API).

---

### 5.6 — Partage automatique avec contacts de confiance (Toggle)

**Endpoint:** `PATCH /utilisateurs/profil`

**Objectif:** Activer/désactiver le partage automatique du trajet avec les contacts de confiance.

**Moment d'exécution:** Au toggle du switch "Confidentialité du trajet".

**Paramètres envoyés:** Aucun

**Corps de requête:**
```json
{
  "partage_trajet_automatique": true
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "uuid",
    "partage_trajet_automatique": true
  }
}
```

**Gestion des erreurs:** Voir 2.2

---

## SECTION 6 : DEVENIR CHAUFFEUR / PROPRIÉTAIRE

### 6.1 — Afficher les options (Chauffeur, Propriétaire, Ajouter rôle propriétaire)

**Objectif:** Afficher les options pour devenir chauffeur ou propriétaire.

**Implémentation:** 
- Si l'utilisateur n'est pas chauffeur : afficher "Devenir chauffeur"
- Si l'utilisateur n'est pas propriétaire : afficher "Devenir propriétaire"
- Si l'utilisateur est chauffeur mais pas propriétaire : afficher "Ajouter le rôle propriétaire"

**Détermination des rôles:** À partir du champ `roles` ou `active_role` du profil (1.1).

---

### 6.2 — Ouvrir formulaire de soumission de documents

**Endpoint:** Pas d'appel API pour ouvrir le bottomSheet ; la soumission des documents est un écran séparé.

**Objectif:** Afficher un bottomSheet expliquant les documents requis et rediriger vers le formulaire de soumission.

**Moment d'exécution:** Au clic sur l'une des options (Chauffeur, Propriétaire, Ajouter propriétaire).

**Navigation:** `context.push('/documents/submission?role=chauffeur')` ou `/documents/submission?role=proprietaire`

---

## SECTION 7 : PARAMÈTRES

### 7.1 — Notifications (Toggle Autoriser/Refuser)

**Endpoint:** `PATCH /utilisateurs/profil` (à confirmer avec le backend)

**Objectif:** Activer/désactiver les notifications.

**Moment d'exécution:** Au toggle du switch "Notifications".

**Paramètres envoyés:** Aucun

**Corps de requête:**
```json
{
  "notifications_activees": true
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_utilisateur": "uuid",
    "notifications_activees": true
  }
}
```

**Gestion des erreurs:** Voir 2.2

**HYPOTHÈSE:** Ce champ n'existe peut-être pas dans le modèle. À confirmer avec le backend.

---

### 7.2 — Langue (Afficher valeur actuelle)

**Implémentation:** Valeur stockée localement dans SharedPreferences/Hive (pas d'appel API).

**Objectif:** Permettre à l'utilisateur de changer la langue de l'application.

**Moment d'exécution:** Au clic sur "Langue".

---

### 7.3 — Paramètres de confidentialité (Redirection)

**Endpoint:** Pas d'appel API direct ; redirection vers `/settings/privacy`.

**Objectif:** Afficher les options de visibilité du profil et partage de données.

**Moment d'exécution:** Au clic sur "Paramètres de confidentialité".

**Navigation:** `context.push('/settings/privacy')`

---

### 7.4 — Conditions d'utilisation (WebView/PDF)

**Endpoint:** Pas d'appel API direct ; ouvrir un WebView vers un PDF ou une URL statique.

**Objectif:** Afficher les conditions d'utilisation.

**Moment d'exécution:** Au clic sur "Conditions d'utilisation".

**Navigation:** `_launchURL('https://ndjigi.com/terms')` via `url_launcher`

---

### 7.5 — Version de l'application

**Implémentation:** Valeur statique (ex: "v1.0.0") définie dans `pubspec.yaml`.

**Affichage:** Non cliquable, affichage uniquement.

---

### 7.6 — Déconnexion

**Endpoint:** `POST /auth/logout` (à confirmer)

**Objectif:** Déconnecter l'utilisateur et supprimer les tokens.

**Moment d'exécution:** Au clic sur "Déconnexion" avec confirmation.

**Paramètres envoyés:** Aucun

**Corps de requête:** Optionnel

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token déjà invalide (accepter et continuer)
- `500 Internal Server Error` : Afficher message d'erreur, proposer de réessayer ou accepter la déconnexion locale

**Après déconnexion:**
- Supprimer les tokens stockés (SecureStorage)
- Rediriger vers `/login`

---

### 7.7 — Supprimer mon compte

**Endpoint:** `DELETE /utilisateurs/{id}` ou endpoint dédié comme `DELETE /utilisateurs/profil`

**Objectif:** Supprimer définitivement le compte utilisateur (soft delete).

**Moment d'exécution:** Au clic sur "Supprimer mon compte" avec double confirmation.

**Paramètres envoyés:**
- `id` (path): ID de l'utilisateur (UUID)

**Corps de requête:** Optionnel (peut contenir un motif de suppression)

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Compte supprimé avec succès"
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Compte ayant des trajets en cours
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la suppression

**Après suppression:**
- Supprimer les tokens stockés
- Rediriger vers `/login`

---

## SECTION 8 : BOTTOM NAVIGATION BAR

### Navigation
- Onglet 0 (Accueil) : `/` ou `/home`
- Onglet 1 (Trajets) : `/course/history`
- Onglet 2 (Location) : `/location/search`
- Onglet 3 (Profil) : `/profil` (actuellement actif)

**Implémentation:** Navigation via go_router, pas d'appel API.

---

---

# ÉCRAN CENTRE D'ASSISTANCE

## Vue d'ensemble
Écran avec 3 onglets (FAQ, Signalement, Contact) et un FAB pour le chat en direct.

---

## ONGLET 1 : FAQ

### 1.1 — Lister les FAQs avec recherche

**Endpoint:** `GET /faqs` ou `GET /faqs/search`

**Objectif:** Récupérer la liste des FAQs, potentiellement filtrées par catégorie ou recherche.

**Moment d'exécution:** 
- Lors du chargement initial du tab FAQ
- Lors de la soumission de la recherche (champ texte)

**Paramètres envoyés (pour recherche):**
- `q` (query): Texte à rechercher (min 2 caractères)
- `page` (query): `1`
- `limit` (query): `20`

**Paramètres envoyés (pour listing):**
- `categorie` (query): Catégorie à filtrer (optionnel)
- `page` (query): `1`
- `limit` (query): `20`

**Corps de requête:** N/A

**Réponse attendue (GET /faqs):**
```json
{
  "success": true,
  "data": [
    {
      "id_faq": "uuid1",
      "question": "Comment créer un compte ?",
      "reponse": "Pour créer un compte, cliquez sur ...",
      "categorie": "Compte",
      "ordre": 1,
      "isActive": true,
      "helpfulCount": 45,
      "notHelpfulCount": 3,
      "viewCount": 200,
      "createdAt": "2025-03-01T10:00:00Z"
    },
    {
      "id_faq": "uuid2",
      "question": "Quels sont les modes de paiement acceptés ?",
      "reponse": "Nous acceptons les cartes bancaires, Mobile Money, ...",
      "categorie": "Paiements",
      "ordre": 5,
      "isActive": true,
      "helpfulCount": 78,
      "notHelpfulCount": 5,
      "viewCount": 350,
      "createdAt": "2025-03-05T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

**Réponse attendue (GET /faqs/search):**
```json
{
  "success": true,
  "data": [
    {
      "id_faq": "uuid1",
      "question": "Comment payer ma course ?",
      "reponse": "Vous pouvez payer via ...",
      "categorie": "Paiements",
      "ordre": 2,
      "isActive": true,
      "helpfulCount": 120,
      "notHelpfulCount": 8,
      "viewCount": 500,
      "createdAt": "2025-03-10T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Paramètres invalides
- `500 Internal Server Error` : Afficher "Aucun résultat"

---

### 1.2 — Voter sur l'utilité d'une FAQ

**Endpoint:** `PATCH /faqs/{id}/vote/helpful` ou `PATCH /faqs/{id}/vote/not-helpful`

**Objectif:** Enregistrer si la réponse a été utile.

**Moment d'exécution:** Au clic sur le pouce haut (utile) ou le pouce bas (non utile) en bas de la FAQ dépliée.

**Paramètres envoyés:**
- `id` (path): ID de la FAQ (UUID)

**Corps de requête:** N/A (ou vide)

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_faq": "uuid",
    "helpfulCount": 46,
    "notHelpfulCount": 3,
    "userVote": "helpful"
  }
}
```

**Gestion des erreurs:**
- `404 Not Found` : FAQ non trouvée
- `500 Internal Server Error` : Erreur lors du vote

---

## ONGLET 2 : SIGNALEMENT

### 2.1 — Lister les trajets récents pour le dropdown

**Endpoint:** `GET /trajets/historique` ou `GET /trajets?limit=20`

**Objectif:** Récupérer la liste des trajets récents pour la sélection dans le dropdown "Course concernée".

**Moment d'exécution:** Lors du chargement du tab Signalement ou au clic sur le dropdown.

**Paramètres envoyés:**
- `page` (query): `1`
- `limit` (query): `20`

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id_trajet": "uuid1",
      "adresse_depart": "123 Rue, Dakar",
      "adresse_arrivee": "456 Boulevard, Dakar",
      "date_heure_debut": "2026-06-03T14:30:00Z",
      "date_heure_fin": "2026-06-03T14:45:00Z",
      "statut": "termine",
      "tarif_final": 5500.00
    },
    {
      "id_trajet": "uuid2",
      "adresse_depart": "789 Avenue, Dakar",
      "adresse_arrivee": "Aéroport, Dakar",
      "date_heure_debut": "2026-06-02T10:00:00Z",
      "date_heure_fin": "2026-06-02T10:20:00Z",
      "statut": "termine",
      "tarif_final": 8500.00
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47
  }
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la récupération

---

### 2.2 — Upload de pièces jointes (photos)

**Endpoint:** `POST /photos`

**Objectif:** Uploader des photos en pièces jointes pour le signalement.

**Moment d'exécution:** Au clic sur le bouton d'upload de photos optionnel.

**Paramètres envoyés:**
- `ownerType` (form-data): `"support"` ou `"signalement"` (à confirmer avec le backend)
- `photos` (form-data, multipart): Tableau de fichiers (max 5-10 fichiers)

**Corps de requête:**
```
Form-Data:
- ownerType: "support"
- photos: [file1.jpg, file2.jpg, ...]
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id_photo": "uuid",
        "fileKey": "2026-06/support/uuid.jpg",
        "filename": "evidence.jpg",
        "mimeType": "image/jpeg",
        "fileSize": 512000
      }
    ]
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Format invalide, fichier trop volumineux
- `500 Internal Server Error` : Erreur lors de l'upload

**HYPOTHÈSE:** Le `ownerType` pour les photos de support n'est peut-être pas `"support"`. À confirmer avec le backend.

---

### 2.3 — Créer un ticket de signalement

**Endpoint:** `POST /support/tickets`

**Objectif:** Soumettre un nouveau ticket de signalement.

**Moment d'exécution:** Au clic sur le bouton "Envoyer le signalement".

**Paramètres envoyés:** Aucun

**Corps de requête:**
```json
{
  "sujet": "probleme_technique",
  "description": "Lors de ma course du 3 juin, le chauffeur a pris un itinéraire anormal et a augmenté le tarif en milieu de trajet.",
  "id_trajet": "uuid (optionnel)",
  "id_paiement": "uuid (optionnel)",
  "id_location": "uuid (optionnel)",
  "photos": ["uuid-photo1", "uuid-photo2"]
}
```

**Sujets valides:** `probleme_technique`, `question_sur_une_course`, `reclamation`, `autre`

**Notes:** 
- Au moins un des `id_trajet`, `id_paiement`, ou `id_location` doit être fourni (ou aucun si `sujet` = `autre`)
- Les IDs des photos sont optionnels (si des uploads ont été effectués en 2.2)

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id_ticket": "uuid-new",
    "sujet": "probleme_technique",
    "description": "Lors de ma course...",
    "statut": "ouvert",
    "eligible_remboursement": false,
    "date_creation": "2026-06-05T14:30:00Z"
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Validation échouée (description trop courte, sujet invalide, etc.)
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la création

**Après succès:**
- Afficher un SnackBar de confirmation avec le numéro/ID du ticket
- Optionnellement, rediriger vers le détail du ticket

---

## ONGLET 3 : CONTACT

### 3.1 — Afficher les informations de contact (Téléphone, E-mail)

**Implémentation:** Valeurs statiques en dur dans le code Flutter (configuration de l'app).

**Objectif:** Afficher le numéro de téléphone et l'e-mail du support cliquables.

**Moment d'exécution:** Lors du chargement du tab Contact.

**Valeurs suggérées:**
- Téléphone support : `+221 XX XXX XXXX` (à définir)
- E-mail support : `support@ndjigi.com` (à définir)

---

### 3.2 — Appeler le support

**Implémentation:** Utiliser `url_launcher` pour lancer un appel.

**Objectif:** Permettre à l'utilisateur d'appeler le support directement.

**Moment d'exécution:** Au clic sur la card Téléphone.

**Code Flutter:** `launchUrl(Uri(scheme: 'tel', path: '+221XXXXXXXX'))`

---

### 3.3 — Envoyer un e-mail au support

**Implémentation:** Utiliser `url_launcher` pour ouvrir le client mail.

**Objectif:** Ouvrir le client e-mail par défaut pré-rempli avec l'adresse du support.

**Moment d'exécution:** Au clic sur la card E-mail.

**Code Flutter:** `launchUrl(Uri(scheme: 'mailto', path: 'support@ndjigi.com'))`

---

### 3.4 — Lister les tickets de l'utilisateur (Mes tickets)

**Endpoint:** `GET /support/tickets`

**Objectif:** Récupérer la liste des tickets de signalement soumis par l'utilisateur.

**Moment d'exécution:** Lors du chargement du tab Contact.

**Paramètres envoyés:**
- `page` (query): `1`
- `limit` (query): `20`
- `statut` (query): Optionnel (filtrer par statut)

**Corps de requête:** N/A

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id_ticket": "uuid1",
      "sujet": "probleme_technique",
      "description": "Erreur lors du paiement...",
      "statut": "en_cours",
      "eligible_remboursement": false,
      "date_creation": "2026-06-03T10:30:00Z",
      "date_resolution": null
    },
    {
      "id_ticket": "uuid2",
      "sujet": "reclamation",
      "description": "Comportement chauffeur inapproprié...",
      "statut": "resolu",
      "eligible_remboursement": true,
      "date_creation": "2026-05-28T14:15:00Z",
      "date_resolution": "2026-06-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```

**Gestion des erreurs:**
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de la récupération

**Statuts possibles:** `ouvert`, `en_cours`, `resolu`, `ferme`

---

## FAB (FLOATING ACTION BUTTON) : CHAT EN DIRECT

### FAB.1 — Ouvrir le chat en direct

**Endpoint:** Pas d'appel API direct pour ouvrir le chat ; navigation vers un écran de chat dédié.

**Objectif:** Ouvrir un écran pleine page avec un chat en direct avec le support.

**Moment d'exécution:** Au clic sur le FAB chat.

**Navigation:** `context.push('/support/chat')` ou `context.push('/assistance/chat')`

---

### FAB.2 — Charger les messages de la conversation

**Endpoint:** Pas d'endpoint existant pour les messages (utiliser WebSocket ou polling).

**Objectif:** Récupérer l'historique des messages avec le support.

**Moment d'exécution:** Lors du chargement de l'écran de chat.

**HYPOTHÈSE CRITIQUE:** Le backend dispose de tables `conversation`, `message`, et `conversation_participant` dans le schema Prisma, mais aucun contrôleur/service n'a été trouvé pour gérer les messages.

**À clarifier avec le backend:**
- Quel endpoint pour récupérer les messages ?
- WebSocket pour le chat en temps réel ou polling ?
- Structure de la conversation ?

**Implémentation temporaire suggérée:**
```
GET /support/tickets/{id}/messages
GET /conversations/{id}/messages
```

---

### FAB.3 — Envoyer un message

**Endpoint:** À déterminer (voir FAB.2)

**Objectif:** Envoyer un message dans la conversation de support.

**Moment d'exécution:** Au clic sur le bouton "Envoyer" après saisie du message.

**Paramètres envoyés:** À déterminer

**Corps de requête (suggestion):**
```json
{
  "contenu": "Bonjour, j'ai toujours un problème avec mon paiement.",
  "id_conversation": "uuid (optionnel)"
}
```

**Réponse attendue (suggestion):**
```json
{
  "success": true,
  "data": {
    "id_message": "uuid",
    "contenu": "Bonjour, j'ai toujours un problème avec mon paiement.",
    "date_envoi": "2026-06-05T14:30:00Z",
    "lu": false
  }
}
```

**Gestion des erreurs:**
- `400 Bad Request` : Message vide
- `401 Unauthorized` : Token expiré
- `500 Internal Server Error` : Erreur lors de l'envoi

---

---

# HYPOTHÈSES ET NOTES GÉNÉRALES

## Hypothèses réalisées

1. **Authentification JWT:** Le frontend utilise un token JWT stocké dans SecureStorage et automatiquement ajouté à chaque requête via l'intercepteur de Dio.

2. **Structures de réponse:** Toutes les réponses suivent le format `{ success: true, data: {...} }` ou `{ success: false, message: "...", errors: {...} }`.

3. **Pagination:** Les endpoints qui retournent des listes incluent une pagination avec `page`, `limit`, et `total`.

4. **Timestamps ISO 8601:** Les dates sont au format ISO 8601 (ex: `2026-06-05T14:30:00Z`).

5. **Messages de chat:** L'implémentation du chat en direct n'a pas d'endpoint backend identifié. À clarifier.

6. **Photo pour support:** Les photos des signalements seront uploadées avec `ownerType: "support"` (à confirmer).

7. **Modification profil:** Tous les champs modifiables du profil passent par `PATCH /utilisateurs/profil`.

8. **Adresses sans authentification:** Les adresses sont des entités liées à l'utilisateur connecté (ajout automatique d'`id_user` via le middleware d'authentification).

9. **Contacts limités à 3:** À valider côté Flutter (afficher un message d'erreur si l'utilisateur tente d'en ajouter plus).

10. **Suppression de compte:** Utilise probablement un soft delete (ajout d'une colonne `supprime_le` ou `deletedAt`).

---

## Points à clarifier avec le backend

| Point | Détail |
|-------|--------|
| **Endpoints messages** | Quelle endpoint pour récupérer/envoyer des messages de support ? WebSocket ou REST ? |
| **Notifications** | Existe-t-il un champ pour désactiver les notifications ? Comment gérer les préférences ? |
| **Upload photos support** | Quel `ownerType` utiliser pour les photos des signalements ? |
| **Logique "max 3 contacts"** | Validation côté backend ou Flutter ? |
| **Langue de l'app** | Stockée localement ou sur le profil utilisateur ? |
| **Déconnexion** | Existe-t-il un endpoint `/auth/logout` ? |
| **Suppression compte** | Quel endpoint exact ? `DELETE /utilisateurs/{id}` ou `DELETE /utilisateurs/profil` ? |
| **Portefeuille retrait** | Le bouton "Retirer" doit être désactivé pour les passagers. Comment valider ce rôle ? |
| **Partage trajet** | Quel champ du profil pour stocker cette préférence ? |

---

## Sécurité et bonnes pratiques

1. **HTTPS obligatoire:** Utiliser le chiffrement TLS pour tous les appels API.

2. **Validation côté client:** Valider les inputs avant d'envoyer (longueur, format, etc.).

3. **Gestion des tokens:** Renouveler les access tokens via le refresh token en cas d'expiration (déjà implémenté).

4. **Confidentialité:** Ne pas stocker les données sensibles (tokens, numéros de téléphone) en clair dans SharedPreferences.

5. **Rate limiting:** Implémenter un rate limiting côté client pour éviter les envois massifs.

6. **Erreurs sensibles:** Ne pas exposer les détails techniques des erreurs côté utilisateur.

---

## Performance et optimisation

1. **Mise en cache:** Cacher le profil et les adresses pour réduire les requêtes (staleness toléré).

2. **Pagination:** Utiliser la pagination pour limiter les données retournées.

3. **Lazy loading:** Charger les sections au besoin (FAQs lors du clic sur le tab).

4. **Images:** Compresser les photos avant upload (recommandé < 2 MB par fichier).

5. **Timeouts:** Configurer des timeouts appropriés pour les requêtes (déjà à 15s dans ApiService).

---

## Gestion des erreurs recommandée

```dart
try {
  // Appel API
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    // Rediriger vers login
  } else if (e.response?.statusCode == 400) {
    // Afficher erreur de validation
  } else {
    // Erreur serveur : afficher message générique
  }
}
```

---

## Ressources de configuration suggérées

- **URL du support:** À définir dans `app_config.dart` ou `constants.dart`
- **Max taille d'image:** ~5 MB pour uploads
- **Max contacts:** 3
- **Versions accept:** FAQs avec `isActive: true` uniquement

---

## Conclusion

Cet audit couvre **tous les appels API identifiables** pour les deux écrans demandés. Les points d'incertitude (chat, notifications) sont explicitement marqués et peuvent être clarifiés avec le backend.

**Nombre total d'appels API identifiés:** ~35 endpoints/actions
- **Profil:** 17 endpoints/actions
- **Assistance:** 18 endpoints/actions

