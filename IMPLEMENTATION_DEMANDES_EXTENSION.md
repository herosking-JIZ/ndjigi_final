# 📋 Implémentation : Gestion des Demandes d'Extension de Profil

## ✅ Résumé Exécutif

La fonctionnalité **complète** de gestion des demandes d'extension de profil a été implémentée dans le backend Node.js/Express/Prisma du projet N'DJIGI. 

**État :** ⚠️ **EN ATTENTE de mise à jour du schéma Prisma** (voir section [Prérequis](#prérequis))

---

## 📁 Fichiers Créés

### 1. **Erreurs Personnalisées**
📄 `backend/src/errors/MissingDocumentsError.js`
- Classe d'erreur pour documents manquants lors de la création de demande
- Contient tableau des documents manquants

### 2. **Validations (Joi)**
📄 `backend/src/validators/demandeExtension.validator.js`
- `createDemandeExtensionSchema` - Validation POST /demandes-extension
- `updateStatutSchema` - Validation PATCH /demandes-extension/:id/statut
- `listDemandesQuerySchema` - Filtres de recherche pour admin
- `demandeParamsSchema` - Validation des paramètres UUID

### 3. **Logique Métier (Service)**
📄 `backend/src/services/demandeExtension.service.js`

**Méthodes implémentées :**

#### `createDemandeExtension(idUtilisateur, extensionType)`
```javascript
// Crée une demande d'extension avec validation:
// ✓ Vérification absence demande EN_ATTENTE/ACCEPTEE existante
// ✓ Récupération des documents READY de l'utilisateur
// ✓ Validation des documents requis
// ✓ Création en transaction Prisma
// ✓ Assignation automatique des documents à la demande
```

**Documents Requis :**
| Type | Chauffeur | Propriétaire |
|------|-----------|--------------|
| permis-de-conduite | ✅ | ✅ |
| carte_grise | ✅ | ✅ |
| assurance | ✅ | ✅ |
| cni | ✅ | ✅ |
| contrat-nndjigi | ❌ | ✅ |

#### `updateStatutDemande(idDemande, statut, motifRejet, adminId)`
```javascript
// Met à jour le statut avec actions en cascade:
// ✓ Vérification demande existe et statut EN_ATTENTE
// ✓ Validation motif_rejet obligatoire si refus
// ✓ Transaction multi-table Prisma
//
// SI ACCEPTEE:
//   - Ajoute rôle à utilisateur_role (chauffeur/proprietaire)
//   - Crée profil métier (chauffeur ou proprietaire)
//   - Envoie notification de succès
//
// SI REFUSEE:
//   - Envoie notification de refus avec motif
```

#### `getDemandesByUtilisateur(idUtilisateur)`
```javascript
// Récupère toutes les demandes de l'utilisateur avec documents
```

#### `getAllDemandes(filtres)`
```javascript
// Admin: récupère TOUTES les demandes avec pagination
// Filtres: { statut?, extension_type?, page?, limit? }
```

### 4. **Controllers**
📄 `backend/src/controllers/demandeExtension.controller.js`

**Endpoints implémentés :**

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/demandes-extension` | User | Créer demande |
| GET | `/demandes-extension/mes-demandes` | User | Récupérer mes demandes |
| GET | `/demandes-extension/admin` | Admin | Récupérer TOUTES les demandes |
| PATCH | `/demandes-extension/:id/statut` | Admin | Accepter/refuser demande |

### 5. **Routes**
📄 `backend/src/routes/demandeExtension.routes.js`
- Route basée sur `/demandes-extension`
- Intégration middleware `authorize('admin')` pour routes admin
- Validation Joi pour tous les payloads

### 6. **Enregistrement Routes**
✏️ `backend/src/routes/index.js`
- Ligne 33 : Import des routes
- Ligne 95 : Enregistrement `router.use('/demandes-extension', demandeExtensionRoutes)`

---

## 🔧 Prérequis : Mise à Jour du Schéma Prisma

**⚠️ CRITIQUE** : Le schéma Prisma actuel est **INCOMPLET**. Vous DEVEZ ajouter les champs suivants :

```prisma
model demande_extension {
  id_demande_extension String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  extension_type       type_extension
  id_utilisateur       String      @db.Uuid
  statut               statut_extension @default(en_attente)
  
  // 👇 À AJOUTER ABSOLUMENT :
  motif_rejet          String?                    // Motif du refus (nullable)
  createdAt            DateTime    @default(now()) // Timestamp création
  updatedAt            DateTime    @updatedAt      // Timestamp mise à jour
  
  documents            document[]
  utilisateur          utilisateur @relation(fields: [id_utilisateur], references: [id_utilisateur], onDelete: NoAction, onUpdate: NoAction) 
}
```

**Commande à exécuter :**
```bash
cd backend
npx prisma migrate dev --name add_demande_extension_fields
```

---

## 📊 Flux de Fonctionnement

### 1️⃣ Création de Demande (Utilisateur)

```
POST /api/v1/demandes-extension
{
  "extension_type": "chauffeur" | "proprietaire"
}

↓ Service.createDemandeExtension() :
  • Vérifier absence demande en cours
  • Récupérer documents utilisateur (status=READY, deletedAt=null)
  • Valider documents requis
  • ✓ Créer demande (statut=en_attente)
  • ✓ Assigner documents à demande

↓ Response 201:
{
  "success": true,
  "message": "Demande d'extension créée avec succès",
  "data": {
    "id_demande_extension": "uuid",
    "extension_type": "chauffeur",
    "id_utilisateur": "uuid",
    "statut": "en_attente",
    "documents": [...]
  }
}
```

### 2️⃣ Acceptation de Demande (Admin)

```
PATCH /api/v1/demandes-extension/:id/statut
Authorization: Bearer <admin_token>
{
  "statut": "accepte"
}

↓ Service.updateStatutDemande() - TRANSACTION :
  ✓ Mettre à jour demande.statut = "accepte"
  ✓ Ajouter rôle "chauffeur" ou "proprietaire" à utilisateur_role
  ✓ Créer profil métier :
    • Si chauffeur: INSERT INTO chauffeur
    • Si proprietaire: INSERT INTO proprietaire
  ✓ Envoyer notification d'acceptation

↓ Response 200:
{
  "success": true,
  "message": "Statut de la demande mis à jour",
  "data": { /* demande_extension */ }
}
```

### 3️⃣ Refus de Demande (Admin)

```
PATCH /api/v1/demandes-extension/:id/statut
Authorization: Bearer <admin_token>
{
  "statut": "refuse",
  "motif_rejet": "Les documents fournis sont invalides."
}

↓ Service.updateStatutDemande() - TRANSACTION :
  ✓ Mettre à jour demande.statut = "refuse"
  ✓ Stocker motif_rejet (une fois champ ajouté au schéma)
  ✓ Envoyer notification de refus

↓ Response 200:
{
  "success": true,
  "message": "Statut de la demande mis à jour",
  "data": { /* demande_extension */ }
}
```

---

## 🚀 Utilisation - Exemples cURL

### Créer une demande
```bash
curl -X POST http://localhost:8000/api/v1/demandes-extension \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "extension_type": "chauffeur"
  }'
```

### Récupérer mes demandes
```bash
curl -X GET http://localhost:8000/api/v1/demandes-extension/mes-demandes \
  -H "Authorization: Bearer eyJhbGc..."
```

### Récupérer toutes les demandes (admin)
```bash
curl -X GET "http://localhost:8000/api/v1/demandes-extension/admin?statut=en_attente&extension_type=chauffeur" \
  -H "Authorization: Bearer eyJhbGc_admin..."
```

### Accepter une demande (admin)
```bash
curl -X PATCH http://localhost:8000/api/v1/demandes-extension/550e8400-e29b-41d4-a716-446655440000/statut \
  -H "Authorization: Bearer eyJhbGc_admin..." \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "accepte"
  }'
```

### Refuser une demande (admin)
```bash
curl -X PATCH http://localhost:8000/api/v1/demandes-extension/550e8400-e29b-41d4-a716-446655440000/statut \
  -H "Authorization: Bearer eyJhbGc_admin..." \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "refuse",
    "motif_rejet": "Les documents fournis ne sont pas conformes aux critères."
  }'
```

---

## 🔐 Sécurité et Architecture

### ✅ Respectée

- ✅ **Authentification Keycloak** : Middleware `keycloakAuth` appliqué
- ✅ **Autorisation** : Middleware `authorize('admin')` sur routes sensibles
- ✅ **Validation Joi** : Tous les payloads validés
- ✅ **Transactions Prisma** : Multi-table updates atomiques
- ✅ **Soft Delete** : Documents supprimés ignorés (deletedAt != null)
- ✅ **Error Handling** : Try-catch avec codes d'erreur métier
- ✅ **Response Format** : Standard { success, message, data, errors }

### ⚠️ Limitations Actuelles

- ❌ **motif_rejet non persisté** : Champ manquant dans schéma (à ajouter)
- ❌ **createdAt/updatedAt non disponibles** : Champs manquants dans schéma (à ajouter)
- ℹ️ **Pas d'orderBy createdAt** : Remplacé par Prisma ID ordering (provisoire)

---

## 📝 Notes d'Implémentation

### Patterns Respectés

1. **Service Layer** : Toute logique métier dans le service
2. **Controller Layer** : Controllers très minces, juste appel service + réponse
3. **Validator Layer** : Joi utilisé comme ailleurs dans le projet
4. **Error Handling** : Erreurs métier + status codes HTTP appropriés
5. **Database** : Prisma $transaction pour atomicité

### Enum statuts

```javascript
enum statut_extension {
  en_attente  // État initial
  accepte     // Validé par admin
  refuse      // Rejeté par admin
}
```

### Rôles assignés

- CHAUFFEUR → Rôle "chauffeur" ajouté à utilisateur_role
- PROPRIETAIRE → Rôle "proprietaire" ajouté à utilisateur_role

### Notifications Créées

- **EXTENSION_ACCEPTEE** : Titre + message de succès
- **EXTENSION_REFUSEE** : Titre + motif de refus en contenu

---

## 🧪 Prochaines Étapes

1. ✅ **Exécuter la migration Prisma** (ajouter champs manquants)
2. ✅ **Tester les endpoints avec Postman/cURL**
3. ✅ **Vérifier les notifications créées** dans la table notification
4. ✅ **Valider les rôles ajoutés** dans utilisateur_role
5. ✅ **Tester le flux complet end-to-end**

---

## 📞 Support

Pour toute question :
- Vérifier les logs du serveur (`console.log` dans les services/controllers)
- Utiliser les codes d'erreur retournés en réponse JSON
- Consulter le schéma Prisma pour les constraints

---

**Créé :** 2026-06-17 | **Status :** ✅ Complet (En attente migration schéma)
