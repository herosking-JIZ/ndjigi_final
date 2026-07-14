import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
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

  // Course en cours
  final Course? course;
  final double? latitudeChauffeurLive;
  final double? longitudeChauffeurLive;

  final bool isSubmitting;
  final String? errorMessage;
  final String? messageMatchingEchec;

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
    this.course,
    this.latitudeChauffeurLive,
    this.longitudeChauffeurLive,
    this.isSubmitting = false,
    this.errorMessage,
    this.messageMatchingEchec,
  });

  bool get depuisDefini => latitudeDepart != null && longitudeDepart != null;
  bool get arriveeDefinie => latitudeArrivee != null && longitudeArrivee != null;
  bool get peutDemander =>
      depuisDefini && arriveeDefinie && idCategorieSelectionnee != null && !isSubmitting;

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
    Course? course,
    double? latitudeChauffeurLive,
    double? longitudeChauffeurLive,
    bool? isSubmitting,
    String? errorMessage,
    String? messageMatchingEchec,
  }) {
    return CourseState(
      latitudeDepart: latitudeDepart ?? this.latitudeDepart,
      longitudeDepart: longitudeDepart ?? this.longitudeDepart,
      adresseDepart: adresseDepart ?? this.adresseDepart,
      latitudeArrivee: latitudeArrivee ?? this.latitudeArrivee,
      longitudeArrivee: longitudeArrivee ?? this.longitudeArrivee,
      adresseArrivee: adresseArrivee ?? this.adresseArrivee,
      categories: categories ?? this.categories,
      idCategorieSelectionnee: idCategorieSelectionnee ?? this.idCategorieSelectionnee,
      isLoadingCategories: isLoadingCategories ?? this.isLoadingCategories,
      distanceKm: distanceKm ?? this.distanceKm,
      dureeEstimeeMin: dureeEstimeeMin ?? this.dureeEstimeeMin,
      course: course ?? this.course,
      latitudeChauffeurLive: latitudeChauffeurLive ?? this.latitudeChauffeurLive,
      longitudeChauffeurLive: longitudeChauffeurLive ?? this.longitudeChauffeurLive,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      messageMatchingEchec: messageMatchingEchec,
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

  CourseNotifier(this._repository, this._ref) : super(const CourseState());

  void definirDepart({required double latitude, required double longitude, required String adresse}) {
    state = state.copyWith(latitudeDepart: latitude, longitudeDepart: longitude, adresseDepart: adresse);
  }

  void definirArrivee({required double latitude, required double longitude, required String adresse}) {
    state = state.copyWith(latitudeArrivee: latitude, longitudeArrivee: longitude, adresseArrivee: adresse);
  }

  void definirDistanceDuree({required double distanceKm, required int dureeEstimeeMin}) {
    state = state.copyWith(distanceKm: distanceKm, dureeEstimeeMin: dureeEstimeeMin);
  }

  Future<void> chargerCategories() async {
    try {
      state = state.copyWith(isLoadingCategories: true, errorMessage: null);
      final categories = await _repository.getCategoriesVehicule();
      state = state.copyWith(isLoadingCategories: false, categories: categories);
    } catch (e) {
      state = state.copyWith(isLoadingCategories: false, errorMessage: 'Erreur lors du chargement des catégories.');
    }
  }

  void selectionnerCategorie(String idCategorie) {
    state = state.copyWith(idCategorieSelectionnee: idCategorie);
  }

  /// Lance la demande de course (matching automatique) et se branche sur le suivi temps réel
  Future<void> demanderCourse() async {
    if (!state.peutDemander) return;
    try {
      state = state.copyWith(isSubmitting: true, errorMessage: null, messageMatchingEchec: null);

      final idTrajet = await _repository.demanderCourse(
        adresseDepart: state.adresseDepart!,
        adresseArrivee: state.adresseArrivee!,
        latitudeDepart: state.latitudeDepart!,
        longitudeDepart: state.longitudeDepart!,
        latitudeArrivee: state.latitudeArrivee!,
        longitudeArrivee: state.longitudeArrivee!,
        idCategorie: state.idCategorieSelectionnee!,
        distanceKm: state.distanceKm,
        dureeEstimeeMin: state.dureeEstimeeMin,
      );

      final course = await _repository.getTrajet(idTrajet);
      state = state.copyWith(isSubmitting: false, course: course);
      await _brancherSuiviTempsReel(idTrajet);
    } catch (e) {
      final message = e.toString().contains('AUCUN_CHAUFFEUR') || e.toString().contains('404')
          ? 'Aucun chauffeur disponible à proximité.'
          : 'Erreur lors de la demande de course.';
      state = state.copyWith(isSubmitting: false, errorMessage: message);
    }
  }

  Future<void> _brancherSuiviTempsReel(String idTrajet) async {
    if (_socketBranche) return;
    _socketBranche = true;

    try {
      final config = _ref.read(appConfigProvider);
      final storage = _ref.read(secureStorageProvider);
      final token = await storage.getAccessToken();
      final socketService = _ref.read(socketServiceProvider);

      await socketService.connect('${config.socketUrl}/course', token ?? '');
      socketService.emit('course:join', {'id_trajet': idTrajet});

      socketService.on('course:chauffeur_trouve', (_) => rafraichirCourse());
      socketService.on('course:confirmation_recue', (_) => rafraichirCourse());
      socketService.on('course:statut_change', (data) {
        if (data is Map && data['raison'] == 'AUCUN_CHAUFFEUR_DISPONIBLE') {
          state = state.copyWith(
            messageMatchingEchec: 'Aucun chauffeur disponible à proximité. Essayez une autre catégorie.',
          );
        }
        rafraichirCourse();
      });
      socketService.on('course:position_chauffeur', (data) {
        if (data is Map) {
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
    } catch (_) {
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
      state = state.copyWith(errorMessage: 'Erreur lors de la confirmation d\'identité.');
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
      state = state.copyWith(errorMessage: 'Erreur lors de l\'envoi de la note.');
      return false;
    }
  }

  /// Réinitialise tout le flux (fin de course / notation envoyée / abandon)
  void reset() {
    if (_socketBranche) {
      final socketService = _ref.read(socketServiceProvider);
      socketService.off('course:chauffeur_trouve');
      socketService.off('course:confirmation_recue');
      socketService.off('course:statut_change');
      socketService.off('course:position_chauffeur');
      _socketBranche = false;
    }
    state = const CourseState();
  }
}

// ── Provider ─────────────────────────────────────────────────────────

final courseProvider = StateNotifierProvider<CourseNotifier, CourseState>((ref) {
  return CourseNotifier(ref.watch(courseRepositoryProvider), ref);
});
