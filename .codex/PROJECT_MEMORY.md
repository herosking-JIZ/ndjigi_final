# Mémoire projet — N'DJIGI

Dernière mise à jour : 21 juillet 2026

## Finalité de ce document

Ce fichier conserve la prise en main fonctionnelle et technique du projet afin de pouvoir reprendre le développement sans refaire l'audit initial. Il décrit l'état observé du code, pas seulement la vision annoncée.

Le projet Flutter principal se trouve dans `ndjigi/`.

## Vision du produit

N'DJIGI est une plateforme de mobilité multi-services, pensée principalement pour le Burkina Faso. Un même compte peut cumuler plusieurs rôles et changer de rôle actif dans l'application :

- passager : rechercher et commander une course ;
- chauffeur : être disponible, recevoir des missions et gérer son activité ;
- propriétaire : enregistrer des véhicules et gérer les demandes de location.

La vision étendue comprend le VTC, le covoiturage, la réservation, la location de véhicules, le portefeuille/paiement, la sécurité, les notifications et le support. Toutes ces verticales ne sont cependant pas encore implémentées dans Flutter.

La proposition de valeur centrale retenue pour le MVP est : permettre à un passager de commander une course et à un chauffeur de la réaliser de façon fiable et sécurisée.

## Architecture Flutter

Le code est organisé par fonctionnalités, avec des couches légères :

```text
lib/
├── app/       démarrage, bootstrap et navigation
├── core/      configuration, réseau, stockage, services et thème
├── features/  modules métier par fonctionnalité
└── shared/    modèles et widgets réutilisables
```

Flux technique habituel :

```text
Écran -> Provider Riverpod -> Repository -> ApiService/Dio -> API REST
                                      \-> Socket.IO pour le temps réel
```

Technologies principales :

- Flutter/Dart ;
- Riverpod pour l'état et l'injection de dépendances ;
- GoRouter pour la navigation et les gardes d'authentification ;
- Dio pour l'API REST ;
- Freezed et JSON Serializable pour les modèles ;
- Keycloak avec OAuth2 Authorization Code + PKCE ;
- Socket.IO pour le suivi des courses ;
- Flutter Map/OpenStreetMap et Geolocator ;
- Flutter Secure Storage pour les jetons ;
- Drift/SQLite et SharedPreferences pour le stockage local ;
- notifications locales, biométrie et sélection de fichiers.

Fichiers structurants :

- `ndjigi/lib/main.dart`
- `ndjigi/lib/app/app.dart`
- `ndjigi/lib/app/router/app_router.dart`
- `ndjigi/lib/core/config/app_config.dart`
- `ndjigi/lib/core/network/api_service.dart`
- `ndjigi/lib/core/providers/app_providers.dart`
- `ndjigi/lib/features/auth/presentation/providers/auth_provider.dart`
- `ndjigi/lib/features/course/presentation/providers/course_provider.dart`

## Fonctionnalités réellement présentes

### Authentification et rôles

- accueil, connexion et inscription ;
- authentification Keycloak par PKCE et deep links `ndjigi-mobile://` ;
- stockage sécurisé et renouvellement automatique des jetons ;
- récupération du profil et déconnexion ;
- gestion des comptes suspendus ;
- collecte du téléphone après authentification sociale ;
- choix du rôle actif et changement de rôle ;
- demande d'extension vers chauffeur ou propriétaire avec justificatifs.

### Course VTC passager

Le parcours le plus avancé couvre :

- sélection du départ et de la destination ;
- recherche/sélection sur carte ;
- catégories de véhicules ;
- estimation de distance et durée ;
- demande de course et matching ;
- écoute des statuts et de la position chauffeur via Socket.IO ;
- confirmation, vérification d'identité et annulation ;
- résumé, notation et historique.

### Chauffeur

- tableau de bord ;
- disponibilité en ligne/hors ligne ;
- affichage de missions ;
- portefeuille/revenus et historique ;
- profil chauffeur ;
- liste, ajout et modification de véhicules ;
- ajout de photos et documents véhicule.

Le parcours complet d'acceptation et d'exécution d'une mission côté chauffeur doit encore être validé et probablement complété.

### Propriétaire

- tableau de bord et aperçu des revenus ;
- liste, création et modification des véhicules de location ;
- photos et documents ;
- liste et détail des demandes de location ;
- acceptation/refus d'une demande.

### Profil et services transverses

- informations personnelles ;
- adresses et sélection sur carte ;
- contacts de confiance ;
- portefeuille ;
- paramètres ;
- notifications avec lecture individuelle ou globale ;
- demandes d'extension de rôle et dépôt de documents.

## Fonctionnalités prévues mais non livrables

Les dossiers ou routes suivants représentent principalement une intention produit et ne constituent pas encore des parcours Flutter complets :

- covoiturage ;
- recherche/location côté locataire ;
- réservation ;
- paiement/recharge ;
- sécurité avancée ;
- support.

Plusieurs constantes existent dans `core/constants/routes.dart` sans route correspondante dans `app_router.dart`. Certains boutons conduisent donc vers des routes inexistantes, notamment covoiturage, réservation, recherche de location, recharge, messages et quelques raccourcis de profil.

Lors du travail sur le MVP, masquer ou désactiver ces entrées tant que leurs parcours ne sont pas implémentés.

## Périmètre MVP recommandé

Priorité produit : VTC passager-chauffeur uniquement.

Le MVP doit couvrir de bout en bout :

1. inscription et connexion ;
2. profils passager et chauffeur ;
3. demande et validation du rôle chauffeur ;
4. enregistrement/validation du véhicule ;
5. mise en disponibilité du chauffeur ;
6. choix départ/destination et estimation tarifaire ;
7. demande, matching et acceptation de course ;
8. suivi GPS et changements de statut en temps réel ;
9. démarrage et fin de course ;
10. annulation ;
11. paiement simple, avec espèces acceptable en première version ;
12. historique, notation et notifications essentielles.

À reporter après validation du MVP : covoiturage, location, réservation avancée, portefeuille complet, promotions, support conversationnel, Stripe et sécurité avancée.

## État technique observé

Audit réalisé le 21 juillet 2026 :

- environ 15 700 lignes de Dart applicatif hors code généré ;
- 150 fichiers Dart, dont 24 générés ;
- un seul test automatisé ;
- `flutter test` : le smoke test passe ;
- `flutter analyze` : aucune erreur de compilation, 46 remarques de lint, principalement des appels à `print` (`avoid_print`) et un `use_super_parameters`.

Points de vigilance :

- `main.dart` démarre toujours avec `Flavor.dev` ;
- les URL de développement ciblent par défaut `192.168.11.104` ;
- Firebase est désactivé dans `pubspec.yaml` ;
- Stripe est déclaré mais le parcours de paiement n'est pas réellement câblé ;
- Drift existe mais semble peu exploité ;
- la couverture de tests est très insuffisante ;
- le README Flutter est encore le README générique ;
- des routes mortes sont exposées dans l'interface ;
- le singleton Socket.IO doit être surveillé lors des changements de course/rôle et correctement nettoyer ses écouteurs ;
- toujours vérifier les contrats JSON Flutter/API avant de considérer un parcours comme fonctionnel.

## Principes pour les prochaines modifications

- Rester concentré sur le parcours VTC MVP avant d'élargir le produit.
- Distinguer systématiquement fonctionnalité affichée, fonctionnalité codée et fonctionnalité validée avec le backend.
- Ne pas casser le fonctionnement multi-rôles existant.
- Conserver l'organisation par feature et le flux écran/provider/repository/API.
- Centraliser les appels métier dans les repositories plutôt que dans les écrans lorsque le code est modifié.
- Ajouter des tests pour chaque flux métier corrigé ou finalisé.
- Tester les scénarios temps réel avec deux sessions distinctes : passager et chauffeur.
- Utiliser les flavors et `--dart-define` pour les environnements au lieu de figer de nouvelles adresses IP.
- Ne pas exposer dans le MVP les services non implémentés.

## Prochaine étape conseillée

Avant toute nouvelle verticale, établir une matrice du parcours VTC passager-chauffeur : écran, endpoint, événement Socket.IO, état métier, résultat attendu et statut réel. Corriger ensuite le parcours vertical complet jusqu'à ce qu'une course puisse être réalisée avec deux appareils sur un environnement de staging.

## Module gestionnaire de parking — état au 21 juillet 2026

Le terme UI « parkeur » correspond au rôle backend `gestionnaire`. Le parking affecté est fourni au web par `user.parking_id` et chaque endpoint métier vérifie désormais la table `gestionnaire_parking` ; un gestionnaire ne peut plus agir sur un autre parking.

Règles retenues :

- `vehicule.id_parking` représente le parking d'affectation courant ; une première entrée y affecte le véhicule ;
- la présence physique dépend du dernier `journal_parking` : `entree`, `maintenance` et `reprise` signifient présent, `sortie` signifie absent ;
- une entrée déjà active, une sortie sans présence, une entrée dans un parking plein et une capacité négative sont refusées ;
- l'identité du gestionnaire vient du jeton, jamais du payload web ;
- la capacité et les KPI du dashboard sont recalculés à partir des derniers mouvements ;
- une maintenance suit strictement `en_attente → confirmee → en_reparation → terminee → bon_etat`, avec historique et synchronisation du statut véhicule ;
- les photos de mouvement et de maintenance utilisent `mouvement_photo`, le stockage privé commun et des URLs protégées chargées avec le bearer token ;
- l'ancien endpoint générique `POST /parkings/:id/mouvement` est déprécié au profit de `/entree` et `/sortie`.

Le web propose la sélection réelle d'un véhicule présent pour créer une maintenance, les transitions de statut, l'historique paginé/recherché, ainsi que l'ajout et la consultation sécurisée des photos. Les routes `/parkeur/*` sont limitées au rôle gestionnaire.
