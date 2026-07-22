import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/network/api_error.dart';
import '../../data/course_repository.dart';
import '../../data/models/course.dart';

// ── État du flux VTC (recherche destination → notation finale) ──────

class CourseState {
  // Sélection départ/arrivée (via la carte OSM)
  final double? latitudeDepart;
  final double? longitudeDepart;
  final String? adresseDepart;
  final double? latitudeArrivee;
  final double? longitudeArrivee;
  final String? adresseArrivee;

  // Catégories de véhicule
  final List<CategorieVehicule> categories;
  final String? idCategorieSelectionnee;
  final bool isLoadingCategories;

  // Distance/durée estimées (calculées côté client via MapService, avant la demande)
  final double? distanceKm;
  final int? dureeEstimeeMin;
  final double? tarifEstime;
  final bool isLoadingTarif;

  // Course en cours
  final Course? course;
  final double? latitudeChauffeurLive;
  final double? longitudeChauffeurLive;

  final bool isSubmitting;
  final String? errorMessage;
  final String? messageMatchingEchec;
  final String? pinDemarrage;

  const CourseState({
    this.latitudeDepart,
    this.longitudeDepart,
    this.adresseDepart,
    this.latitudeArrivee,
    this.longitudeArrivee,
    this.adresseArrivee,
    this.categories = const [],
    this.idCategorieSelectionnee,
    this.isLoadingCategories = false,
    this.distanceKm,
    this.dureeEstimeeMin,
    this.tarifEstime,
    this.isLoadingTarif = false,
    this.course,
    this.latitudeChauffeurLive,
    this.longitudeChauffeurLive,
    this.isSubmitting = false,
    this.errorMessage,
    this.messageMatchingEchec,
    this.pinDemarrage,
  });

  bool get depuisDefini => latitudeDepart != null && longitudeDepart != null;
  bool get arriveeDefinie =>
      latitudeArrivee != null && longitudeArrivee != null;
  bool get peutDemander =>
      depuisDefini &&
      arriveeDefinie &&
      distanceKm != null &&
      dureeEstimeeMin != null &&
      idCategorieSelectionnee != null &&
      tarifEstime != null &&
      !isLoadingTarif &&
      !isSubmitting;

  CourseState copyWith({
    double? latitudeDepart,
    double? longitudeDepart,
    String? adresseDepart,
    double? latitudeArrivee,
    double? longitudeArrivee,
    String? adresseArrivee,
    List<CategorieVehicule>? categories,
    String? idCategorieSelectionnee,
    bool? isLoadingCategories,
    double? distanceKm,
    int? dureeEstimeeMin,
    double? tarifEstime,
    bool clearTarifEstime = false,
    bool? isLoadingTarif,
    Course? course,
    bool clearCourse = false,
    double? latitudeChauffeurLive,
    double? longitudeChauffeurLive,
    bool? isSubmitting,
    String? errorMessage,
    String? messageMatchingEchec,
    String? pinDemarrage,
  }) {
    return CourseState(
      latitudeDepart: latitudeDepart ?? this.latitudeDepart,
      longitudeDepart: longitudeDepart ?? this.longitudeDepart,
      adresseDepart: adresseDepart ?? this.adresseDepart,
      latitudeArrivee: latitudeArrivee ?? this.latitudeArrivee,
      longitudeArrivee: longitudeArrivee ?? this.longitudeArrivee,
      adresseArrivee: adresseArrivee ?? this.adresseArrivee,
      categories: categories ?? this.categories,
      idCategorieSelectionnee:
          idCategorieSelectionnee ?? this.idCategorieSelectionnee,
      isLoadingCategories: isLoadingCategories ?? this.isLoadingCategories,
      distanceKm: distanceKm ?? this.distanceKm,
      dureeEstimeeMin: dureeEstimeeMin ?? this.dureeEstimeeMin,
      tarifEstime: clearTarifEstime ? null : (tarifEstime ?? this.tarifEstime),
      isLoadingTarif: isLoadingTarif ?? this.isLoadingTarif,
      course: clearCourse ? null : (course ?? this.course),
      latitudeChauffeurLive:
          latitudeChauffeurLive ?? this.latitudeChauffeurLive,
      longitudeChauffeurLive:
          longitudeChauffeurLive ?? this.longitudeChauffeurLive,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      messageMatchingEchec: messageMatchingEchec,
      pinDemarrage: pinDemarrage ?? this.pinDemarrage,
    );
  }
}

// ── StateNotifier ────────────────────────────────────────────────────
//
// Couvre tout le flux (recherche destination → recherche chauffeur →
// confirmation → suivi → notation). Pas d'autoDispose : le flux
// traverse de nombreux écrans/routes, l'état doit survivre à chaque
// navigation — reset() est appelé explicitement en fin de course ou
// à l'abandon du flux.

class CourseNotifier extends StateNotifier<CourseState> {
  final CourseRepository _repository;
  final Ref _ref;
  bool _socketBranche = false;
  Timer? _pollingTimer;

  CourseNotifier(this._repository, this._ref) : super(const CourseState()) {
    _ref.onDispose(() => _pollingTimer?.cancel());
  }

  void definirDepart({
    required double latitude,
    required double longitude,
    required String adresse,
  }) {
    state = state.copyWith(
      latitudeDepart: latitude,
      longitudeDepart: longitude,
      adresseDepart: adresse,
    );
  }

  void definirArrivee({
    required double latitude,
    required double longitude,
    required String adresse,
  }) {
    state = state.copyWith(
      latitudeArrivee: latitude,
      longitudeArrivee: longitude,
      adresseArrivee: adresse,
    );
  }

  void definirDistanceDuree({
    required double distanceKm,
    required int dureeEstimeeMin,
  }) {
    state = state.copyWith(
      distanceKm: distanceKm,
      dureeEstimeeMin: dureeEstimeeMin,
    );
  }

  Future<void> chargerCategories() async {
    try {
      state = state.copyWith(isLoadingCategories: true, errorMessage: null);
      final categories = await _repository.getCategoriesVehicule();
      state = state.copyWith(
        isLoadingCategories: false,
        categories: categories,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingCategories: false,
        errorMessage: 'Erreur lors du chargement des catégories.',
      );
    }
  }

  Future<void> selectionnerCategorie(String idCategorie) async {
    state = state.copyWith(
      idCategorieSelectionnee: idCategorie,
      isLoadingTarif: true,
      clearTarifEstime: true,
      errorMessage: null,
    );
    try {
      final tarif = await _repository.estimerTarif(
        idCategorie: idCategorie,
        distanceKm: state.distanceKm!,
        dureeMin: state.dureeEstimeeMin!,
        latitudeDepart: state.latitudeDepart!,
        longitudeDepart: state.longitudeDepart!,
      );
      if (state.idCategorieSelectionnee != idCategorie) return;
      state = state.copyWith(isLoadingTarif: false, tarifEstime: tarif);
    } catch (_) {
      if (state.idCategorieSelectionnee != idCategorie) return;
      state = state.copyWith(
        isLoadingTarif: false,
        clearTarifEstime: true,
        errorMessage: 'Tarif indisponible pour cette catégorie.',
      );
    }
  }

  /// Lance la demande de course (matching automatique) et se branche sur le suivi temps réel
  Future<void> demanderCourse() async {
    if (!state.peutDemander) return;
    try {
      state = state.copyWith(
        isSubmitting: true,
        errorMessage: null,
        messageMatchingEchec: null,
      );

      final idTrajet = await _repository.demanderCourse(
        adresseDepart: state.adresseDepart!,
        adresseArrivee: state.adresseArrivee!,
        latitudeDepart: state.latitudeDepart!,
        longitudeDepart: state.longitudeDepart!,
        latitudeArrivee: state.latitudeArrivee!,
        longitudeArrivee: state.longitudeArrivee!,
        idCategorie: state.idCategorieSelectionnee!,
        distanceKm: state.distanceKm!,
        dureeEstimeeMin: state.dureeEstimeeMin!,
      );

      final course = await _repository.getTrajet(idTrajet);
      state = state.copyWith(isSubmitting: false, course: course);
      await _brancherSuiviTempsReel(idTrajet);
    } catch (e) {
      final code = apiErrorCode(e);
      final message = switch (code) {
        'SOLDE_INSUFFISANT' =>
          'Votre solde est insuffisant pour cette course. Rechargez votre portefeuille.',
        'COURSE_ACTIVE' => 'Vous avez déjà une course active.',
        'AUCUN_CHAUFFEUR' => 'Aucun chauffeur disponible à proximité.',
        'TARIF_INTROUVABLE' ||
        'ZONE_AMBIGUE' ||
        'ZONE_SANS_TARIF' => apiErrorMessage(e) ?? 'Le tarif est indisponible.',
        _ => apiErrorMessage(e) ?? 'Erreur lors de la demande de course.',
      };
      state = state.copyWith(isSubmitting: false, errorMessage: message);
    }
  }

  /// Restaure la course active du passager et reprend son suivi temps réel.
  Future<Course?> restaurerCourseActive() async {
    try {
      state = state.copyWith(isSubmitting: true, errorMessage: null);
      final course = await _repository.getCourseActivePassager();
      state = state.copyWith(
        isSubmitting: false,
        course: course,
        clearCourse: course == null,
      );
      if (course == null) return null;

      await _brancherSuiviTempsReel(course.idTrajet);
      if (course.chauffeurArriveA != null) await chargerPinDemarrage();
      return course;
    } catch (_) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Impossible de reprendre la course active.',
      );
      return null;
    }
  }

  Future<void> _brancherSuiviTempsReel(String idTrajet) async {
    // REST reste le filet de sécurité si le socket mobile est indisponible.
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => rafraichirCourse(),
    );
    if (_socketBranche) return;

    try {
      final config = _ref.read(appConfigProvider);
      final storage = _ref.read(secureStorageProvider);
      final token = await storage.getAccessToken();
      final socketService = _ref.read(courseSocketServiceProvider);

      await socketService.connect('${config.socketUrl}/course', token ?? '');
      socketService.joinCourse(idTrajet);

      socketService.on('course:chauffeur_trouve', (_) => rafraichirCourse());
      socketService.on('course:confirmation_recue', (_) => rafraichirCourse());
      socketService.on('course:chauffeur_arrive', (_) async {
        await rafraichirCourse();
        await chargerPinDemarrage();
      });
      socketService.on('course:statut_change', (data) {
        if (data is Map && data['raison'] == 'AUCUN_CHAUFFEUR_DISPONIBLE') {
          state = state.copyWith(
            messageMatchingEchec:
                'Aucun chauffeur disponible à proximité. Essayez une autre catégorie.',
          );
        }
        rafraichirCourse();
      });
      socketService.on('course:position_chauffeur', (data) {
        if (data is Map) {
          if (data['id_trajet'] != state.course?.idTrajet) return;
          final lat = data['latitude'];
          final lng = data['longitude'];
          if (lat is num && lng is num) {
            state = state.copyWith(
              latitudeChauffeurLive: lat.toDouble(),
              longitudeChauffeurLive: lng.toDouble(),
            );
          }
        }
      });
      _socketBranche = true;
    } catch (_) {
      _socketBranche = false;
      // Le suivi temps réel est en best-effort : un échec de connexion socket
      // n'empêche pas le flux REST (rafraichirCourse peut être appelé manuellement)
    }
  }

  Future<void> rafraichirCourse() async {
    final idTrajet = state.course?.idTrajet;
    if (idTrajet == null) return;
    try {
      final course = await _repository.getTrajet(idTrajet);
      state = state.copyWith(course: course);
      if (course.chauffeurArriveA != null && state.pinDemarrage == null) {
        await chargerPinDemarrage();
      }
    } catch (_) {
      // Laisse l'état précédent en cas d'échec ponctuel du rafraîchissement
    }
  }

  Future<void> confirmer() async {
    final idTrajet = state.course?.idTrajet;
    if (idTrajet == null) return;
    try {
      await _repository.confirmerCourse(idTrajet);
      await rafraichirCourse();
    } catch (e) {
      state = state.copyWith(errorMessage: 'Erreur lors de la confirmation.');
    }
  }

  Future<void> confirmerIdentite() async {
    final idTrajet = state.course?.idTrajet;
    if (idTrajet == null) return;
    try {
      await _repository.confirmerIdentite(idTrajet);
      await rafraichirCourse();
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'Erreur lors de la confirmation d\'identité.',
      );
    }
  }

  Future<void> chargerPinDemarrage() async {
    final idTrajet = state.course?.idTrajet;
    if (idTrajet == null || state.course?.chauffeurArriveA == null) return;
    try {
      final pin = await _repository.obtenirPinDemarrage(idTrajet);
      state = state.copyWith(pinDemarrage: pin);
    } catch (_) {
      // Le bouton de rafraîchissement permet de retenter.
    }
  }

  Future<void> annuler(String motif) async {
    final idTrajet = state.course?.idTrajet;
    if (idTrajet == null) return;
    try {
      await _repository.annulerCourse(idTrajet, motif: motif);
      await rafraichirCourse();
    } catch (e) {
      state = state.copyWith(errorMessage: 'Erreur lors de l\'annulation.');
    }
  }

  Future<bool> noterChauffeur({required int note, String? commentaire}) async {
    final course = state.course;
    if (course == null || course.idChauffeur == null) return false;
    try {
      await _repository.noterChauffeur(
        idTrajet: course.idTrajet,
        idChauffeur: course.idChauffeur!,
        note: note,
        commentaire: commentaire,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'Erreur lors de l\'envoi de la note.',
      );
      return false;
    }
  }

  /// Réinitialise tout le flux (fin de course / notation envoyée / abandon)
  void reset() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    if (_socketBranche) {
      final socketService = _ref.read(courseSocketServiceProvider);
      socketService.off('course:chauffeur_trouve');
      socketService.off('course:confirmation_recue');
      socketService.off('course:chauffeur_arrive');
      socketService.off('course:statut_change');
      socketService.off('course:position_chauffeur');
      final idTrajet = state.course?.idTrajet;
      if (idTrajet != null) socketService.leaveCourse(idTrajet);
      _socketBranche = false;
    }
    state = const CourseState();
  }
}

// ── Provider ─────────────────────────────────────────────────────────

final courseProvider = StateNotifierProvider<CourseNotifier, CourseState>((
  ref,
) {
  return CourseNotifier(ref.watch(courseRepositoryProvider), ref);
});
