# Audit Tracking N'DJIGI

## A. Infrastructure base de données

| Table | Champs pertinents | Index | Présent |
|-------|-------------------|-------|---------|
| `tracking_vehicule` | `id_tracking` (UUID PK), `id_vehicule` (UUID FK), `latitude` Decimal(10,7), `longitude` Decimal(10,7), `vitesse` Int?, `cap` Int?, `horodatage` DateTime (default now()) | `idx_tracking_vehicule_horodatage` sur (id_vehicule, horodatage) | ✅ |
| `vehicule` | `gps_actif` Boolean (default false), `latitude_actuelle` Decimal(10,7)?, `longitude_actuelle` Decimal(10,7)?, `statut` StatutVehicule | Indexes sur id_categorie, id_proprietaire | ✅ |
| `chauffeur` | `statut_disponibilite` StatutDisponibilite (default hors_ligne), `nb_courses_effectuees` Int | Aucun index sur statut_disponibilite | ✅ |
| `trajet` | `statut` trajet_statut (default en_attente), `date_heure_debut` DateTime?, `date_heure_fin` DateTime?, `polyline_trajet` String?, `coordonnees_depart` Json?, `coordonnees_arrivee` Json? | `idx_trajet_statut`, `idx_trajet_zone` | ✅ |
| `affectation_vehicule` | `id_vehicule` (unique conditionnel sur est_active=true), `id_chauffeur` FK, `est_active` Boolean, `date_debut`, `date_fin`?, `motif_fin`? | Relation chauffeur ↔ vehicule via vehicule_course | ✅ |

**Enums :**
- `StatutDisponibilite` : `en_ligne`, `hors_ligne`, `en_course`
- `trajet_statut` : `en_attente`, `en_cours`, `termine`, `annule`
- `StatutVehicule` : `disponible`, `en_course`, `en_location`, `maintenance`, `retire`

---

## B. Code backend existant

| Fichier | Rôle | Écrit position ? | Lit position ? |
|---------|------|-----------------|----------------|
| `controllers/vehiculeController.js` → `updatePosition()` | `PATCH /vehicules/:id/position` — écrit lat/lng dans vehicule ET crée enreg dans tracking_vehicule (transaction atomique) | ✅ OUI — `vehicule.latitude_actuelle`, `vehicule.longitude_actuelle`, `tracking_vehicule` | NON |
| `controllers/vehiculeController.js` → `tracking()` | `GET /vehicules/:id/tracking` — retourne l'historique de positions | NON | ✅ OUI — lit `tracking_vehicule` |
| `controllers/vehiculeController.js` → `findOne()` | `GET /vehicules/:id` — inclut le dernier tracking | NON | ✅ OUI — `tracking_vehicule { take: 1, orderBy: horodatage desc }` |
| `controllers/chauffeurController.js` → `changerDisponibilite()` | `PATCH /chauffeurs/disponibilite` — met à jour statut_disponibilite | NON | NON |
| `controllers/trajetController.js` → `demarrer()` | `PATCH /trajets/:id/demarrer` — passe statut à `en_cours`, set `date_heure_debut` | NON | NON |
| `controllers/trajetController.js` → `terminer()` | `PATCH /trajets/:id/terminer` — passe statut à `termine`, set `date_heure_fin`, incrémente nb_courses | NON | NON |
| `controllers/trajetController.js` → `annuler()` | `PATCH /trajets/:id/annuler` — passe statut à `annule`, annule réservations, notifie passagers | NON | NON |
| `controllers/trajetPartageController.js` → `getPositionLive()` | `GET /public/t/:token/position` — endpoint public de polling | NON | ✅ OUI — `vehicule.latitude_actuelle`, `vehicule.longitude_actuelle` |
| `middlewares/checkOwnershipTracking.js` | Vérifie que le demandeur est propriétaire du véhicule OU chauffeur affecté | NON | NON |
| `routes/vehiculeRoute.js` | Monte les endpoints véhicule dont `/position` et `/tracking` | NON | NON |
| `routes/chauffeurRoute.js` | Monte les endpoints chauffeur | NON | NON |
| `jobs/cleanupOrphans.js` | Nettoie les documents orphelins (pas de tracking) | NON | NON |
| `jobs/cleanupExpiredResetTokens.js` | Nettoie les tokens reset expirés (pas de tracking) | NON | NON |

### ⚠️ Anomalies identifiées dans le code existant

**Anomalie 1 — Mauvaise permission sur l'endpoint position :**  
`PATCH /vehicules/:id/position` utilise `can('vehicule:modifier')`, une permission réservée aux **propriétaires**.  
Or les chauffeurs ont `tracking:envoyer` dans leurs permissions (roles.js) — mais cet endpoint n'accepte pas cette permission.  
**Conséquence : les chauffeurs ne peuvent pas envoyer leur position via cet endpoint.**

**Anomalie 2 — Route chauffeur `/disponibilite` inaccessible :**  
Dans `chauffeurRoute.js`, la route `PATCH /disponibilite` est déclarée **après** `PATCH /:id`.  
Express capturera "disponibilite" comme valeur de `:id` → la route `changerDisponibilite` est de facto **jamais atteinte**.

**Anomalie 3 — Valeurs incorrectes dans `changerDisponibilite` :**  
Le controller valide `['disponible', 'occupe', 'hors_ligne']` mais l'enum Prisma est `en_ligne`, `hors_ligne`, `en_course`.  
`disponible` et `occupe` n'existent pas dans l'enum → toute écriture Prisma avec ces valeurs lèverait une erreur.

**Anomalie 4 — Import incorrect dans `checkOwnershipTracking.js` :**  
Le fichier utilise `const prisma = require('../config/db')` au lieu de `const { prisma } = require('../config/db')` — pattern destructuré utilisé partout ailleurs.

---

## C. Contrat avec le partage de trajet

- **Champs lus par `getPositionLive`** :  
  - `vehicule.latitude_actuelle` et `vehicule.longitude_actuelle`  
  - Chemin d'accès : `trajet_partage → trajet → affectation_vehicule → vehicule_course → vehicule`  
  - Aussi : `trajet.statut`, `trajet.date_heure_debut`, `trajet.duree_estimee_min`

- **Ces champs sont-ils écrits aujourd'hui ?** NON — en pratique.

- **Explication :**  
  Le code `vehiculeController.updatePosition()` existe et écrit correctement `latitude_actuelle` / `longitude_actuelle` + `tracking_vehicule` en transaction.  
  Mais il est protégé par `can('vehicule:modifier')` (permission propriétaire uniquement).  
  Les chauffeurs ont `tracking:envoyer` dans leurs rôles, mais **aucun endpoint n'accepte cette permission**.  
  **Résultat : `getPositionLive` retournera toujours `position: null`** jusqu'à correction de la permission ou création d'un endpoint dédié chauffeur.

---

## D. Ce qui MANQUE pour le tracking

1. **Endpoint dédié chauffeur pour envoyer sa position**  
   Ex : `PATCH /chauffeurs/me/position` avec `can('tracking:envoyer')`, sans vérification de propriété (le chauffeur envoie sa propre position).  
   OU corriger l'endpoint existant pour accepter `tracking:envoyer` en plus de `vehicule:modifier`.

2. **Mise à jour de `statut_disponibilite` lors des transitions de trajet**  
   - Au `demarrer` : passer `chauffeur.statut_disponibilite` → `en_course`  
   - Au `terminer` : passer `chauffeur.statut_disponibilite` → `en_ligne`  
   - Au `annuler` (si en_cours) : passer → `en_ligne`  
   Aujourd'hui aucune de ces transitions ne met à jour la disponibilité.

3. **Mise à jour de `vehicule.statut`** lors des transitions trajet  
   - `en_cours` → `vehicule.statut = en_course`  
   - `termine` / `annule` → `vehicule.statut = disponible`  
   Actuellement non géré.

4. **Correction des bugs existants** (Anomalies 1-4 ci-dessus)  
   - Reordonner la route `/disponibilite` avant `/:id` dans chauffeurRoute  
   - Corriger les valeurs valides dans `changerDisponibilite`  
   - Changer la permission de l'endpoint position  
   - Corriger l'import de checkOwnershipTracking

5. **Job de nettoyage pour `tracking_vehicule`**  
   La table grossit sans limite. Aucun TTL ni purge n'existe. À créer si volume important.

6. **Aucun WebSocket** — architecture 100% polling REST côté partage.  
   La fréquence est 1 requête / 5 sec depuis le client mobile (limiteur à 12/min).

---

## E. Ce qui EXISTE et est réutilisable

| Élément | Fichier | Utilité pour le tracking |
|---------|---------|--------------------------|
| `vehiculeController.updatePosition()` | `controllers/vehiculeController.js` | Logique d'écriture position + historique, transaction atomique — **réutilisable directement** |
| `vehiculeController.tracking()` | `controllers/vehiculeController.js` | Lecture historique — déjà complet |
| `checkOwnershipTracking` middleware | `middlewares/checkOwnershipTracking.js` | Vérifie chauffeur affecté OU propriétaire — réutilisable (après correction import) |
| Pattern `authenticate` + `can()` | `middlewares/authenticate.js`, `authorize.js` | Appliquer `can('tracking:envoyer')` sur le nouvel endpoint |
| `tracking:envoyer` permission | `config/roles.js` (rôle `chauffeur`) | Déjà définie — juste pas utilisée |
| `tracking:lire` permission | `config/roles.js` (rôle `proprietaire`) | Déjà définie — déjà utilisée sur GET |
| `prisma.$transaction()` | Pattern existant | updatePosition l'utilise déjà pour atomicité |
| Enum `StatutDisponibilite` | `schema.prisma` | En_ligne / hors_ligne / en_course — cohérent avec le besoin |

---

## F. Questions / décisions à trancher

1. **Polling vs WebSocket ?**  
   L'architecture actuelle est 100% REST polling. Le partage de trajet poll à 5 sec.  
   WebSocket permettrait push immédiat et moins de charge DB — mais requiert socket.io et refactor.  
   *Décision à prendre : garder le polling ou introduire WebSocket ?*

2. **Fréquence d'écriture tracking_vehicule ?**  
   L'app chauffeur envoie une position toutes les X secondes.  
   Faut-il écrire dans tracking_vehicule à **chaque ping** (historique complet mais croissance rapide) ou **échantillonner** (ex: toutes les 30 sec, ou si déplacement > N mètres) ?

3. **Qui peut envoyer une position ?**  
   Aujourd'hui : personne efficacement (bug permission).  
   À définir : chauffeur uniquement (via son propre ID), ou aussi propriétaire ?

4. **Nettoyage tracking_vehicule ?**  
   TTL proposé : conserver les 7 derniers jours ? 24h ? Ou par volume (max N entrées par véhicule) ?

5. **Faut-il corriger les bugs de chauffeurController/Route dans le même ticket que le tracking ?**  
   Les bugs (valeurs enum incorrectes, route inaccessible) bloquent la disponibilité.  
   Recommandation : les corriger en même temps que l'endpoint position.

---

## Résumé exécutif

**Ce qui existe :**
- Table `tracking_vehicule` prête avec index approprié
- Méthode `updatePosition()` fonctionnelle (écrit position + historique en transaction)
- Enums et schéma DB cohérents
- Endpoints de lecture (`GET /vehicules/:id/tracking`)
- Permissions `tracking:envoyer` et `tracking:lire` définies dans les rôles

**Ce qui manque (critique) :**
- **Endpoint d'écriture accessible aux chauffeurs** — `updatePosition()` verrouillé par permission propriétaire
- **Mise à jour de statut lors des transitions trajet** — demarrer/terminer ne changent pas la disponibilité
- **4 bugs** bloquant la disponibilité et l'historique

**Gap principal :**  
`getPositionLive` (partage de trajet) lit `vehicule.latitude_actuelle` mais aucun chauffeur ne peut l'écrire efficacement → **position toujours null en production**. L'infrastructure existe, seule la permission d'accès et les transitions d'état manquent.
