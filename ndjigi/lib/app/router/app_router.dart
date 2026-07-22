import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/routes.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/welcome_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/role_selection_screen.dart';
import '../../features/auth/presentation/screens/compte_suspendu_screen.dart';
import '../../features/auth/presentation/screens/keycloak_callback_screen.dart';
import '../../features/auth/presentation/screens/phone_collection_screen.dart';
import '../../features/home/presentation/screens/home_passager_screen.dart';
import '../../features/location/data/models/vehicule_location_detail.dart';
import '../../features/location/presentation/screens/demande_detail_screen.dart';
import '../../features/location/presentation/screens/location_rating_screen.dart';
import '../../features/location/presentation/screens/mes_locations_screen.dart';
import '../../features/location/presentation/screens/nouvelle_demande_screen.dart';
import '../../features/location/presentation/screens/recherche_vehicules_screen.dart';
import '../../features/location/presentation/screens/vehicule_location_detail_screen.dart';
import '../../features/chat/presentation/screens/chat_screen.dart';
import '../../features/chauffeur/presentation/screens/chauffeur_hub_screen.dart';
import '../../features/chauffeur/presentation/screens/chauffeur_vehicules_screen.dart';
import '../../features/chauffeur/presentation/screens/chauffeur_course_screen.dart';
import '../../features/proprietaire/data/models/location_acceptation_result.dart';
import '../../features/proprietaire/presentation/screens/proprietaire_hub_screen.dart';
import '../../features/vehicule/presentation/screens/vehicule_form_screen.dart';
import '../../features/vehicule/presentation/screens/vehicule_detail_screen.dart';
import '../../features/proprietaire/presentation/screens/location_detail_screen.dart';
import '../../features/proprietaire/presentation/screens/location_paiement_confirmation_screen.dart';
import '../../features/proprietaire/presentation/screens/location_rating_screen.dart';
import '../../features/proprietaire/presentation/screens/proprietaire_locations_hub_screen.dart';
import '../../features/profil/presentation/screens/profil_hub_screen.dart';
import '../../features/profil/presentation/screens/mes_informations_screen.dart';
import '../../features/profil/presentation/screens/mes_adresses_screen.dart';
import '../../features/profil/presentation/screens/portefeuille_screen.dart';
import '../../features/profil/presentation/screens/securite_contacts_screen.dart';
import '../../features/profil/presentation/screens/parametres_screen.dart';
import '../../features/profil/presentation/screens/devenir_partenaire_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/course/presentation/screens/destination_search_screen.dart';
import '../../features/course/presentation/screens/searching_driver_screen.dart';
import '../../features/course/presentation/screens/driver_found_screen.dart';
import '../../features/course/presentation/screens/trip_screen.dart';
import '../../features/course/presentation/screens/trip_summary_screen.dart';
import '../../features/course/presentation/screens/rating_screen.dart';
import '../../features/course/presentation/screens/course_history_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authListenable = ValueNotifier<AuthState>(ref.read(authProvider));
  ref.listen<AuthState>(authProvider, (previous, next) {
    authListenable.value = next;
  });
  ref.onDispose(authListenable.dispose);

  return GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: authListenable,
    onException: (context, state, router) {
      if (state.uri.scheme == 'ndjigi-mobile') {
        // Deep link custom — app_links s'en occupe, GoRouter ignore
        return;
      }
      // Toute autre erreur de routing → splash
      router.go(Routes.splash);
    },
    redirect: (context, state) {
      // ✅ Ignorer les URLs avec scheme non-http dans le redirect
      final scheme = state.uri.scheme;
      if (scheme != 'http' && scheme != 'https' && scheme != '') {
        return null; // GoRouter ne touche pas à ces URLs
      }

      final authState = authListenable.value;

      final isSplash = state.matchedLocation == Routes.splash;
      final isAuth = [
        Routes.welcome,
        Routes.login,
        Routes.register,
      ].contains(state.matchedLocation);
      final isRoleSelection = state.matchedLocation == Routes.roleSelection;
      final isCompteSuspendu = state.matchedLocation == Routes.compteSuspendu;
      final isKeycloakCallback =
          state.matchedLocation == Routes.keycloakCallback;
      final isPhoneCollection = state.matchedLocation == Routes.phoneCollection;
      final isHome = state.matchedLocation.startsWith('/home/');

      if (authState.isLoading) {
        return isSplash ? null : Routes.splash;
      }

      if (authState.isAuthenticated &&
          authState.user?.statutCompte == 'suspendu') {
        return isCompteSuspendu ? null : Routes.compteSuspendu;
      }

      if (authState.isAuthenticated) {
        if (isHome) return null;
        if (isAuth || isSplash) {
          return '/home/${authState.activeRole ?? "passager"}';
        }
        return null;
      }

      if (isAuth ||
          isSplash ||
          isRoleSelection ||
          isKeycloakCallback ||
          isPhoneCollection) {
        return null;
      }
      return Routes.splash;
    },
    routes: [
      GoRoute(
        path: Routes.splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: Routes.welcome,
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: Routes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: Routes.register,
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: Routes.roleSelection,
        name: 'role-selection',
        builder: (context, state) => const RoleSelectionScreen(),
      ),
      GoRoute(
        path: Routes.compteSuspendu,
        name: 'compte-suspendu',
        builder: (context, state) => const CompteSuspendoScreen(),
      ),
      GoRoute(
        path: Routes.keycloakCallback,
        name: 'keycloak-callback',
        builder: (context, state) => KeycloakCallbackScreen(
          code: state.uri.queryParameters['code'],
          state: state.uri.queryParameters['state'],
          error: state.uri.queryParameters['error'],
        ),
      ),
      GoRoute(
        path: Routes.phoneCollection,
        name: 'phone-collection',
        builder: (context, state) => const PhoneCollectionScreen(),
      ),
      GoRoute(
        path: '/home/passager',
        name: 'home-passager',
        builder: (context, state) => const HomePassagerScreen(),
        routes: [
          GoRoute(
            path: 'location',
            name: 'passager-location-recherche',
            builder: (context, state) => const RechercheVehiculesScreen(),
          ),
          GoRoute(
            path: 'location/mes-locations',
            name: 'passager-location-mes-locations',
            builder: (context, state) => const MesLocationsScreen(),
          ),
          GoRoute(
            path: 'location/mes-locations/:id',
            name: 'passager-location-demande-detail',
            builder: (context, state) =>
                DemandeDetailScreen(idLocation: state.pathParameters['id']!),
          ),
          GoRoute(
            path: 'location/mes-locations/:id/noter',
            name: 'passager-location-noter',
            builder: (context, state) => LocationRatingScreen(
              idLocation: state.pathParameters['id']!,
              idProprietaire: state.extra as String,
            ),
          ),
          GoRoute(
            path: 'location/:id/demande',
            name: 'passager-location-nouvelle-demande',
            builder: (context, state) => NouvelleDemandeScreen(
              idVehicule: state.pathParameters['id']!,
              vehicule: state.extra is VehiculeLocationDetail
                  ? state.extra as VehiculeLocationDetail
                  : null,
            ),
          ),
          GoRoute(
            path: 'location/:id',
            name: 'passager-location-detail',
            builder: (context, state) => VehiculeLocationDetailScreen(
              idVehicule: state.pathParameters['id']!,
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/home/chauffeur',
        name: 'home-chauffeur',
        builder: (context, state) => const ChauffeurHubScreen(),
        routes: [
          GoRoute(
            path: 'vehicules',
            name: 'chauffeur-vehicules',
            builder: (context, state) => const ChauffeurVehiculesScreen(),
          ),
          GoRoute(
            path: 'vehicules/nouveau',
            name: 'chauffeur-vehicule-nouveau',
            builder: (context, state) =>
                const VehiculeFormScreen(type: 'course'),
          ),
          GoRoute(
            path: 'vehicules/:id/modifier',
            name: 'chauffeur-vehicule-modifier',
            builder: (context, state) => VehiculeFormScreen(
              type: 'course',
              idVehicule: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: 'vehicules/:id',
            name: 'chauffeur-vehicule-detail',
            builder: (context, state) => VehiculeDetailScreen(
              idVehicule: state.pathParameters['id']!,
              basePath: '/home/chauffeur/vehicules',
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/home/proprietaire',
        name: 'home-proprietaire',
        builder: (context, state) => const ProprietaireHubScreen(),
        routes: [
          GoRoute(
            path: 'vehicule/nouveau',
            name: 'proprietaire-vehicule-nouveau',
            builder: (context, state) =>
                const VehiculeFormScreen(type: 'location'),
          ),
          GoRoute(
            path: 'vehicule/:id/modifier',
            name: 'proprietaire-vehicule-modifier',
            builder: (context, state) => VehiculeFormScreen(
              type: 'location',
              idVehicule: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: 'vehicule/:id',
            name: 'proprietaire-vehicule-detail',
            builder: (context, state) => VehiculeDetailScreen(
              idVehicule: state.pathParameters['id']!,
              basePath: '/home/proprietaire/vehicule',
            ),
          ),
          GoRoute(
            path: 'locations',
            name: 'proprietaire-locations-hub',
            builder: (context, state) => const ProprietaireLocationsHubScreen(),
          ),
          GoRoute(
            path: 'locations/:id',
            name: 'proprietaire-location-detail',
            builder: (context, state) =>
                LocationDetailScreen(idLocation: state.pathParameters['id']!),
          ),
          GoRoute(
            path: 'locations/:id/paiement',
            name: 'proprietaire-location-paiement',
            builder: (context, state) => LocationPaiementConfirmationScreen(
              idLocation: state.pathParameters['id']!,
              resultat: state.extra as LocationAcceptationResult?,
            ),
          ),
          GoRoute(
            path: 'locations/:id/noter',
            name: 'proprietaire-location-noter',
            builder: (context, state) => ProprietaireLocationRatingScreen(
              idLocation: state.pathParameters['id']!,
              idPassager: state.extra as String,
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/chat/:id',
        name: 'chat',
        builder: (context, state) =>
            ChatScreen(idConversation: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/chauffeur/course/:id',
        name: 'chauffeur-course',
        builder: (context, state) =>
            ChauffeurCourseScreen(idTrajet: state.pathParameters['id']!),
      ),
      GoRoute(
        path: Routes.destinationSearch,
        name: 'course-destination-search',
        builder: (context, state) => const DestinationSearchScreen(),
      ),
      GoRoute(
        path: Routes.searchingDriver,
        name: 'course-searching-driver',
        builder: (context, state) => const SearchingDriverScreen(),
      ),
      GoRoute(
        path: Routes.driverMatching,
        name: 'course-driver-matching',
        builder: (context, state) => const DriverFoundScreen(),
      ),
      GoRoute(
        path: Routes.driverEnRoute,
        name: 'course-driver-en-route',
        builder: (context, state) => const TripScreen(),
      ),
      GoRoute(
        path: Routes.tripInProgress,
        name: 'course-trip-in-progress',
        builder: (context, state) => const TripScreen(),
      ),
      GoRoute(
        path: Routes.tripSummary,
        name: 'course-trip-summary',
        builder: (context, state) => const TripSummaryScreen(),
      ),
      GoRoute(
        path: Routes.rating,
        name: 'course-rating',
        builder: (context, state) => const RatingScreen(),
      ),
      GoRoute(
        path: Routes.courseHistory,
        name: 'course-history',
        builder: (context, state) => const CourseHistoryScreen(),
      ),
      GoRoute(
        path: '/profil',
        name: 'profil',
        builder: (context, state) => const ProfilHubScreen(),
        routes: [
          GoRoute(
            path: 'mes-informations',
            name: 'profil-mes-informations',
            builder: (context, state) => const MesInformationsScreen(),
          ),
          GoRoute(
            path: 'mes-adresses',
            name: 'profil-mes-adresses',
            builder: (context, state) => const MesAdressesScreen(),
          ),
          GoRoute(
            path: 'portefeuille',
            name: 'profil-portefeuille',
            builder: (context, state) => const PortefeuilleScreen(),
          ),
          GoRoute(
            path: 'securite-contacts',
            name: 'profil-securite-contacts',
            builder: (context, state) => const SecuriteContactsScreen(),
          ),
          GoRoute(
            path: 'parametres',
            name: 'profil-parametres',
            builder: (context, state) => const ParametresScreen(),
          ),
          GoRoute(
            path: 'devenir-partenaire',
            name: 'profil-devenir-partenaire',
            builder: (context, state) => const DevenirPartennaireScreen(),
          ),
        ],
      ),
    ],
  );
});
