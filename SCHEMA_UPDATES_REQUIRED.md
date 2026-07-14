# ⚠️ Modifications Requises au Schéma Prisma

## Résumé

La fonctionnalité de **gestion des demandes d'extension de profil** a été implémentée, mais le schéma Prisma actuel est incomplet. Les champs suivants **DOIVENT** être ajoutés au modèle `demande_extension` :

## Champs Manquants

- `motif_rejet` (String, nullable) - Pour stocker le motif du refus
- `createdAt` (DateTime) - Timestamp de création
- `updatedAt` (DateTime) - Timestamp de mise à jour

## Migration Prisma à Exécuter

Ajoutez les lignes suivantes au modèle `demande_extension` dans `backend/prisma/schema.prisma` :

```prisma
model demande_extension {
  id_demande_extension String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  extension_type       type_extension
  id_utilisateur       String      @db.Uuid
  statut               statut_extension @default(en_attente)
  motif_rejet          String?                           // ← À AJOUTER
  createdAt            DateTime    @default(now())       // ← À AJOUTER
  updatedAt            DateTime    @updatedAt            // ← À AJOUTER
  documents            document[]
  utilisateur          utilisateur @relation(fields: [id_utilisateur], references: [id_utilisateur], onDelete: NoAction, onUpdate: NoAction) 
}
```

## Commandes Prisma à Exécuter

```bash
# 1. Créer et réviser la migration
cd backend
npx prisma migrate dev --name add_demande_extension_fields

# OU si vous ne souhaitez que mettre à jour le generé Prisma:
npx prisma generate
```

## Fichiers Implémentés

✅ **Créés avec succès :**

1. `backend/src/errors/MissingDocumentsError.js` - Erreur personnalisée pour documents manquants
2. `backend/src/validators/demandeExtension.validator.js` - Validation Joi des requêtes
3. `backend/src/services/demandeExtension.service.js` - Logique métier
4. `backend/src/controllers/demandeExtension.controller.js` - Endpoints API
5. `backend/src/routes/demandeExtension.routes.js` - Routes HTTP

**Mis à jour :**

6. `backend/src/routes/index.js` - Enregistrement des nouvelles routes

## Endpoints API

Après la mise à jour du schéma, les endpoints suivants seront disponibles :

### 1. Créer une demande d'extension
```
POST /api/v1/demandes-extension
Authorization: Bearer <token>
Content-Type: application/json

{
  "extension_type": "chauffeur" | "proprietaire"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Demande d'extension créée avec succès",
  "data": { /* demande_extension object */ }
}
```

### 2. Récupérer mes demandes
```
GET /api/v1/demandes-extension/mes-demandes
Authorization: Bearer <token>
```

### 3. Récupérer toutes les demandes (admin)
```
GET /api/v1/demandes-extension/admin?statut=en_attente&extension_type=chauffeur&page=1&limit=20
Authorization: Bearer <admin_token>
```

### 4. Mettre à jour le statut (admin)
```
PATCH /api/v1/demandes-extension/:id/statut
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "statut": "accepte" | "refuse",
  "motif_rejet": "Raison du refus..." // Obligatoire si statut = "refuse"
}
```

## Règles Métier Implémentées

✅ **Création de demande :**
- Vérification qu'aucune demande EN_ATTENTE ou ACCEPTEE n'existe pour cet utilisateur + type
- Validation des documents requis (permis, assurance, CNI, carte grise, contrat si proprio)
- Transaction Prisma pour atomicité

✅ **Acceptation de demande :**
- Ajout du rôle (chauffeur/proprietaire) à utilisateur_role
- Création du profil métier (chauffeur ou proprietaire)
- Notification de succès à l'utilisateur

✅ **Refus de demande :**
- Validation du motif_rejet (obligatoire)
- Stockage du motif de refus
- Notification d'échec à l'utilisateur

## Documents Requis

**Pour CHAUFFEUR:**
- permis-de-conduite
- carte_grise
- assurance
- cni

**Pour PROPRIETAIRE:**
- permis-de-conduite
- carte_grise
- assurance
- cni
- contrat-nndjigi

## Statuts de Demande

- `en_attente` - État initial
- `accepte` - Demande validée par admin
- `refuse` - Demande rejetée avec motif

## Notes Importantes

1. **Authentification:** Toutes les routes protégées requièrent un token Keycloak valide
2. **Admin:** Les routes admin utilisent le middleware `authorize('admin')`
3. **Notifications:** Les notifications sont créées automatiquement dans la table `notification`
4. **Soft Delete:** Les documents supprimés (deletedAt != null) ne sont pas pris en compte
5. **Validation:** Joi est utilisée pour la validation (voir validators/*)

---

**⚠️ ETAPE CRITIQUE:** Exécutez la migration Prisma dès que possible pour compléter l'implémentation.
