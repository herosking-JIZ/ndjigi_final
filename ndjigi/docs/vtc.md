# VTC — Plan d'implémentation détaillé (v2, approuvé)

Ce document reformule techniquement la spécification du flux VTC pour la fonctionnalité "VTC" de l'accueil passager. Approuvé le 2026-07-10.

## 0. Découvertes faites en vérifiant la faisabilité de la spec

1. **Le statut `'confirme'` référencé dans le code backend (`STATUTS_DEMARRABLES = ['en_attente', 'confirme']`) n'existe en réalité pas dans l'enum Postgres `trajet_statut`**, qui ne contient aujourd'hui que 4 valeurs : `en_attente`, `en_cours`, `termine`, `annule`. C'est du code mort, pas une fonctionnalité à moitié faite. Pour implémenter le flux en deux temps (chauffeur trouvé → double confirmation → démarrage), il faut ajouter de nouvelles valeurs à cet enum (migration Prisma, section 4).
2. **`trajet` n'a pas de colonne `id_passager` directe.** Le lien trajet↔passager passe par la table `detail_trajet_passager` (`id_trajet`, `id_passager`, `date_embarquement`, `prix_paye`, `nb_places_reservees`) — conçue pour supporter plusieurs passagers par trajet (covoiturage), mais parfaitement utilisable pour un VTC solo avec une seule ligne. `prix_paye` est déjà prévu pour enregistrer ce que ce passager précis a payé.

## 1. Le flux confirmé

**Étape 0 — Le chauffeur se met en ligne.** Le bouton "En ligne" côté Flutter chauffeur appelle une requête qui met à jour `chauffeur.statut_disponibilite` : `hors_ligne ↔ en_ligne`. Pendant une course active, ce champ passe automatiquement à `en_course` (déjà géré par le code existant à l'annulation/fin de trajet).

**Étape 1 — Demande.** Le passager appuie sur VTC, indique départ (pré-rempli GPS) + destination, choisit une catégorie de véhicule.

**Étape 2 — Recherche d'éligibilité.** Le backend cherche les chauffeurs qui remplissent tous les critères suivants :
- `statut_disponibilite = 'en_ligne'`
- possèdent, pour la catégorie demandée, **soit** un `vehicule_course` (véhicule qu'ils exploitent en direct), **soit** un `affectation_vehicule` actif (`est_active = true`) — les deux chemins mènent à un `vehicule` dont on vérifie `id_categorie` et la position GPS connue.

**Étape 3 — Tri et proposition séquentielle.** Distance Haversine entre le point de départ du passager et chaque véhicule éligible, tri du plus proche au plus loin, on ne garde que les 15 premiers. Proposition à un seul chauffeur à la fois (jamais deux en parallèle), délai de réponse 1 minute, puis suivant. Arrêt dès qu'un chauffeur accepte, ou après épuisement des 15 candidats, ou après 15 minutes au total. Échec → "Aucun chauffeur disponible à proximité", invitation à changer de catégorie et réessayer.

**Étape 4 — Chauffeur trouvé, avant démarrage.** Dès qu'un chauffeur accepte la proposition initiale :
- Chat activé entre les deux (namespace socket `/course`, réutilise l'infra `/chat` existante).
- Chacun peut consulter le profil public de l'autre : le passager voit photo, note, carrousel de photos du véhicule, avis reçus (noms des auteurs partiellement masqués, ex. "Awa K."). Le chauffeur voit le profil du passager (photo, note, nombre de courses, avis).
- **Les deux parties doivent explicitement confirmer** avant que la course ne débute réellement (distinct de l'acceptation initiale). Annulation à ce stade → motif obligatoire, l'autre partie est notifiée avec ce motif.

**Étape 5 — Démarrage et suivi.** Une fois les deux confirmations reçues, le chauffeur démarre. Le passager suit sa position sur une carte OSM, distance restante réaffichée tous les 500 m parcourus.

**Étape 6 — Arrivée et vérification d'identité.** À l'arrivée du chauffeur, le passager confirme son identité (plaque, couleur du véhicule, cohérence avec la photo de profil) en une seule action.

**Étape 7 — Paiement à l'arrivée.** On paie à l'arrivée (destination), pas à la réservation. Le portefeuille du passager est débité du tarif final, le chauffeur crédité, 25% revient à N'Djigi (commission plateforme).

**Étape 8 — Notation mutuelle.** Les deux parties se notent et se commentent (système `avis` existant, réutilisé tel quel).

## 2. Écrans Flutter

1. **Recherche destination — saisie par la carte OSM** (pas juste du texte) — le départ et la destination se renseignent en interagissant directement avec la carte (flutter_map) : repère fixe au centre, l'utilisateur fait glisser la carte dessous, géocodage inverse au relâchement (`MapService.reverseGeocode`). Barre de recherche texte en complément pour recentrer rapidement la carte (`MapService.geocode`), la sélection finale reste toujours visuelle. Deux temps (départ pré-centré GPS, puis destination), puis choix de catégorie de véhicule. Étend le widget existant `AddressMapPicker` (aujourd'hui un simple tap-to-place) vers ce pattern "repère centré + glisser + géocodage inverse en direct".
2. **Recherche de chauffeur** — écran d'attente pendant les propositions séquentielles, annulable à tout moment. Échec après 15 min → message + retour à l'étape 1 avec suggestion de changer de catégorie.
3. **Chauffeur trouvé — profils & confirmation** — chat actif, accès aux deux profils détaillés, bouton "Confirmer la course".
4. **En attente du chauffeur** — après double confirmation, avant démarrage effectif ; carte avec position du chauffeur qui approche.
5. **Vérification d'identité** — à l'arrivée du chauffeur, confirmation plaque + couleur + photo en une seule action.
6. **Course en cours** — carte + tracé + position live (OSM), distance restante mise à jour tous les 500 m, bouton chat.
7. **Résumé de fin de course** — tarif final, débit confirmé.
8. **Notation** — étoiles + commentaire.
9. **Profil public** (chauffeur ou passager) — écran réutilisable des deux côtés : photo, note, carrousel photos véhicule (si chauffeur), avis avec noms partiellement masqués, nombre de courses.
10. **Historique des courses**.
11. **Chat** (réutilise l'infra `/chat` existante).

Le suivi de course utilise exclusivement OSM (flutter_map) — cohérent avec le reste de l'app, aucune autre solution de cartographie introduite.

### Exigence d'ergonomie

Chaque écran suit le système de design déjà en place (`AppColors`, `AppTextStyles`, `SectionCard`, `PrimaryButton`, `LoadingView`/`ErrorView`/`EmptyView`), avec de vrais états de chargement/erreur/vide. Alignement sur `AppColors.primary` (`0xFF00C853`) plutôt que sur le vert codé en dur `0xFF00A651` utilisé par endroits sur l'accueil passager.

Livraison par phase complète (backend d'abord, puis l'ensemble des écrans) plutôt qu'écran par écran, faute d'accès à un device pour prévisualiser — validation visuelle globale une fois le flux construit.

## 3. Ce que ça implique côté backend

- **Nouveau service de matching** (`matchingService.js`) : requête d'éligibilité (vehicule_course OU affectation_vehicule active, catégorie, position connue) + tri Haversine + plafond 15 candidats.
- **Mécanisme de proposition séquentielle avec délai** : balayage périodique (toutes les 10-15s) qui vérifie les propositions en attente dont le délai est dépassé et fait avancer à la suivante. Stocké en base pour survivre à un redémarrage du serveur pendant une recherche en cours.
- **Nouveaux endpoints** : `POST /api/trajets/demande`, `PATCH /api/trajets/:id/accepter`/`refuser`, `PATCH /api/trajets/:id/confirmer`, `PATCH /api/trajets/:id/confirmer-identite`. `PATCH /api/chauffeurs/disponibilite` existe déjà pour le bouton "En ligne" (à revérifier précisément à l'implémentation).
- **Socket.io `/course`** : `course:proposition`, `course:accepter`/`refuser`, `course:chauffeur_trouve`, `course:confirmation_recue`, `course:statut_change`, `course:position_chauffeur` (seuil 500 m).
- **Paiement** : débit passager / crédit chauffeur / 25% commission à `terminer`, dans la même transaction.
- **Correctifs bloquants nécessaires en premier** : 5 middlewares d'ownership avec import Prisma non déstructuré ; mauvais `include` Prisma (`vehicule` au lieu de `vehicule_course.vehicule`) qui cassent la quasi-totalité des lectures de trajet.

## 4. Migration Prisma

- Ajouter à l'enum `trajet_statut` (`en_attente | en_cours | termine | annule`) : une valeur intermédiaire "chauffeur trouvé, en attente de double confirmation" et une valeur `confirme`.
- Ajouter deux colonnes booléennes sur `trajet` pour suivre indépendamment la confirmation du chauffeur et celle du passager après le matching.
- Structure de suivi de la recherche séquentielle (liste ordonnée de candidats proposés, index courant, horodatage d'expiration de la proposition en cours), liée à `trajet`.

Noms exacts des statuts/colonnes choisis à l'implémentation, cohérents avec les conventions déjà en place dans le schéma (snake_case, français, `est_active`, `motif_fin`, etc.).

## 5. Ordre de réalisation

1. Bouton "En ligne" chauffeur (Flutter) branché sur l'endpoint existant de disponibilité.
2. Correctifs backend bloquants (bugs Prisma existants).
3. Migration Prisma.
4. Service de matching + endpoints + Socket.io `/course`.
5. Paiement de fin de course.
6. Écrans Flutter, dans l'ordre du flux (section 2).

## Commission plateforme

25% du tarif final revient à N'Djigi à chaque course terminée.
