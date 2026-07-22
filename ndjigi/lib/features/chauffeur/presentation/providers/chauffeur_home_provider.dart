import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/network/api_error.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ChauffeurHomeState {
  final bool isOnline;
  final bool isTogglingDisponibilite;
  final List<MissionVtc> missions;
  final String? errorMessage;
  final Map<String, dynamic>? courseActive;
  final bool isCourseActionLoading;

  const ChauffeurHomeState({
    this.isOnline = false,
    this.isTogglingDisponibilite = false,
    this.missions = const [],
    this.errorMessage,
    this.courseActive,
    this.isCourseActionLoading = false,
  });

  ChauffeurHomeState copyWith({
    bool? isOnline,
    bool? isTogglingDisponibilite,
    List<MissionVtc>? missions,
    String? errorMessage,
    Map<String, dynamic>? courseActive,
    bool clearCourseActive = false,
    bool? isCourseActionLoading,
  }) => ChauffeurHomeState(
    isOnline: isOnline ?? this.isOnline,
    isTogglingDisponibilite:
        isTogglingDisponibilite ?? this.isTogglingDisponibilite,
    missions: missions ?? this.missions,
    errorMessage: errorMessage,
    courseActive: clearCourseActive
        ? null
        : (courseActive ?? this.courseActive),
    isCourseActionLoading: isCourseActionLoading ?? this.isCourseActionLoading,
  );
}

class ChauffeurHomeNotifier extends StateNotifier<ChauffeurHomeState> {
  final Ref _ref;
  Timer? _countdown;
  Timer? _gpsTimer;
  Timer? _coursePollingTimer;
  bool _socketBranche = false;
  Future<void>? _refreshFuture;

  ChauffeurHomeNotifier(this._ref) : super(const ChauffeurHomeState()) {
    _countdown = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _decompter(),
    );
    _ref.onDispose(() {
      _countdown?.cancel();
      _gpsTimer?.cancel();
      _coursePollingTimer?.cancel();
    });
  }

  /// Charge le statut de disponibilité réel du chauffeur connecté
  Future<void> initialiser() async {
    final chauffeurId = _ref.read(authProvider).user?.idUtilisateur;
    if (chauffeurId == null) return;

    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.get<Map<String, dynamic>>(
        '/chauffeurs/$chauffeurId',
      );
      final data = response['data'] as Map<String, dynamic>?;
      final statut = data?['statut_disponibilite'] as String?;
      state = state.copyWith(isOnline: statut == 'en_ligne');
    } catch (_) {
      // La reprise de course reste prioritaire même si le profil échoue.
    }

    try {
      await _brancherPropositions();
    } catch (_) {
      state = state.copyWith(
        errorMessage:
            'Temps réel indisponible, synchronisation par API active.',
      );
    }

    try {
      await _chargerCourseActive();
      await _chargerPropositionActive();
      if (state.isOnline || state.courseActive != null) _demarrerGps();
    } catch (_) {
      state = state.copyWith(
        errorMessage: 'Impossible de restaurer l’activité du chauffeur.',
      );
    }
  }

  Future<void> rafraichir() {
    final ongoing = _refreshFuture;
    if (ongoing != null) return ongoing;
    final future = _rafraichir();
    _refreshFuture = future;
    future.then<void>(
      (_) {
        if (identical(_refreshFuture, future)) _refreshFuture = null;
      },
      onError: (Object error, StackTrace stackTrace) {
        if (identical(_refreshFuture, future)) _refreshFuture = null;
      },
    );
    return future;
  }

  Future<void> _rafraichir() async {
    state = state.copyWith(errorMessage: null);
    await initialiser();
    if (state.errorMessage != null) throw StateError(state.errorMessage!);
  }

  Future<void> _chargerCourseActive() async {
    final response = await _ref
        .read(apiServiceProvider)
        .get<Map<String, dynamic>>(
          '/trajets/actif',
          queryParameters: {'role': 'chauffeur'},
        );
    final data = response['data'];
    if (data is! Map<String, dynamic>) {
      state = state.copyWith(clearCourseActive: true);
      return;
    }
    state = state.copyWith(courseActive: data, errorMessage: null);
    await _brancherCourse(data['id_trajet'] as String);
  }

  /// Bascule en_ligne/hors_ligne, avec mise à jour optimiste et retour arrière si l'appel échoue
  Future<void> toggleDisponibilite() async {
    if (state.isTogglingDisponibilite) return;

    HapticFeedback.mediumImpact();
    final nouveauStatut = !state.isOnline;
    state = state.copyWith(
      isOnline: nouveauStatut,
      isTogglingDisponibilite: true,
    );

    try {
      final api = _ref.read(apiServiceProvider);
      await api.patch<Map<String, dynamic>>(
        '/chauffeurs/disponibilite',
        data: {
          'statut_disponibilite': nouveauStatut ? 'en_ligne' : 'hors_ligne',
        },
      );
      state = state.copyWith(isTogglingDisponibilite: false);
      if (nouveauStatut) {
        await _brancherPropositions();
        _demarrerGps();
      } else {
        _gpsTimer?.cancel();
      }
    } catch (e) {
      // Échec : on annule le changement optimiste
      state = state.copyWith(
        isOnline: !nouveauStatut,
        isTogglingDisponibilite: false,
        errorMessage:
            apiErrorMessage(e) ?? 'Impossible de modifier la disponibilité.',
      );
    }
  }

  Future<void> _brancherPropositions() async {
    if (_socketBranche) return;
    final config = _ref.read(appConfigProvider);
    final storage = _ref.read(secureStorageProvider);
    final socket = _ref.read(courseSocketServiceProvider);
    final token = await storage.getAccessToken();
    await socket.connect('${config.socketUrl}/course', token ?? '');
    socket.on('course:proposition', (payload) {
      if (payload is! Map) return;
      final mission = MissionVtc.fromSocket(payload);
      state = state.copyWith(
        missions: [
          ...state.missions.where((m) => m.idTrajet != mission.idTrajet),
          mission,
        ],
        errorMessage: null,
      );
    });
    _socketBranche = true;
  }

  Future<void> _chargerPropositionActive() async {
    try {
      final response = await _ref
          .read(apiServiceProvider)
          .get<Map<String, dynamic>>(
            '/trajets',
            queryParameters: {'statut': 'en_attente', 'limit': 10},
          );
      final brut = response['data'];
      if (brut is! List) return;
      final missions = brut
          .whereType<Map<String, dynamic>>()
          .map(MissionVtc.fromApi)
          .where((mission) => mission.secondesRestantes > 0)
          .toList();
      state = state.copyWith(missions: missions);
    } catch (_) {
      // Le socket reste la source principale ; cette lecture sert à la reprise.
    }
  }

  void _decompter() {
    if (state.missions.isEmpty) return;
    final missions = state.missions
        .map(
          (mission) => mission.copyWith(
            secondesRestantes: mission.secondesRestantes - 1,
          ),
        )
        .where((mission) => mission.secondesRestantes > 0)
        .toList();
    state = state.copyWith(missions: missions);
  }

  void _demarrerGps() {
    _gpsTimer?.cancel();
    _envoyerPosition();
    _gpsTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _envoyerPosition(),
    );
  }

  Future<void> _envoyerPosition() async {
    if (!state.isOnline && state.courseActive == null) return;
    try {
      final position = await _ref
          .read(locationServiceProvider)
          .getCurrentPosition();
      await _ref
          .read(apiServiceProvider)
          .patch<Map<String, dynamic>>(
            '/chauffeurs/me/position',
            data: {
              'latitude': position.latitude,
              'longitude': position.longitude,
              'vitesse': position.speed.round(),
              'cap': position.heading.round(),
            },
          );
    } catch (_) {
      // La prochaine itération retente automatiquement (GPS/réseau intermittent).
    }
  }

  Future<bool> accepterMission(MissionVtc mission) async {
    try {
      await _ref
          .read(apiServiceProvider)
          .patch('/trajets/${mission.idTrajet}/accepter');
      state = state.copyWith(
        missions: state.missions
            .where((m) => m.idTrajet != mission.idTrajet)
            .toList(),
      );
      await chargerCourse(mission.idTrajet);
      return true;
    } catch (e) {
      state = state.copyWith(
        errorMessage:
            apiErrorMessage(e) ??
            'Cette proposition a expiré ou a déjà été attribuée.',
      );
      return false;
    }
  }

  Future<bool> refuserMission(MissionVtc mission) async {
    try {
      await _ref
          .read(apiServiceProvider)
          .patch('/trajets/${mission.idTrajet}/refuser');
      state = state.copyWith(
        missions: state.missions
            .where((m) => m.idTrajet != mission.idTrajet)
            .toList(),
      );
      return true;
    } catch (_) {
      state = state.copyWith(
        errorMessage: 'Impossible de refuser cette proposition.',
      );
      return false;
    }
  }

  Future<void> chargerCourse(String idTrajet) async {
    try {
      final response = await _ref
          .read(apiServiceProvider)
          .get<Map<String, dynamic>>('/trajets/$idTrajet');
      final course = response['data'] as Map<String, dynamic>;
      state = state.copyWith(courseActive: course, errorMessage: null);
      final statut = course['statut'] as String?;
      if (statut == 'termine' || statut == 'annule') {
        _coursePollingTimer?.cancel();
        _coursePollingTimer = null;
      } else {
        await _brancherCourse(idTrajet);
      }
    } catch (_) {
      state = state.copyWith(errorMessage: 'Impossible de charger la course.');
    }
  }

  Future<void> _brancherCourse(String idTrajet) async {
    _coursePollingTimer?.cancel();
    _coursePollingTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => chargerCourse(idTrajet),
    );
    final socket = _ref.read(courseSocketServiceProvider);
    socket.joinCourse(idTrajet);
    socket.off('course:confirmation_recue');
    socket.off('course:statut_change');
    socket.on('course:confirmation_recue', (_) => chargerCourse(idTrajet));
    socket.on('course:statut_change', (_) => chargerCourse(idTrajet));
  }

  Future<bool> confirmerCourse() => _actionCourse('confirmer');

  Future<bool> signalerArrivee() => _actionCourse('signaler-arrivee');

  Future<bool> demarrerCourse(String pin) =>
      _actionCourse('demarrer', data: {'pin': pin});

  Future<bool> terminerCourse() => _actionCourse('terminer', data: {});

  Future<bool> _actionCourse(
    String action, {
    Map<String, dynamic>? data,
  }) async {
    final idTrajet = state.courseActive?['id_trajet'] as String?;
    if (idTrajet == null || state.isCourseActionLoading) return false;
    state = state.copyWith(isCourseActionLoading: true, errorMessage: null);
    try {
      await _ref
          .read(apiServiceProvider)
          .patch('/trajets/$idTrajet/$action', data: data);
      state = state.copyWith(isCourseActionLoading: false);
      await chargerCourse(idTrajet);
      return true;
    } catch (e) {
      state = state.copyWith(
        isCourseActionLoading: false,
        errorMessage: _messageActionCourse(e),
      );
      return false;
    }
  }

  String _messageActionCourse(Object erreur) {
    final code = apiErrorCode(erreur);
    if (code == 'TROP_LOIN_DU_DEPART') {
      return 'Rapprochez-vous du point de départ avant de signaler votre arrivée.';
    }
    if (code == 'PIN_INCORRECT') return 'PIN incorrect.';
    if (code == 'PIN_VERROUILLE') {
      return 'Trop de tentatives. Contactez le support.';
    }
    if (code == 'SOLDE_INSUFFISANT') {
      return 'Le portefeuille du passager ne permet pas de clôturer la course.';
    }
    return apiErrorMessage(erreur) ?? 'Cette action n’a pas pu être effectuée.';
  }
}

final chauffeurHomeProvider =
    StateNotifierProvider<ChauffeurHomeNotifier, ChauffeurHomeState>(
      (ref) => ChauffeurHomeNotifier(ref),
    );

// Solde portefeuille (réutilise endpoint passager)
final portefeuilleCardProvider = FutureProvider.autoDispose<double>((
  ref,
) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final response = await api.get<Map<String, dynamic>>(
      '/paiement/portefeuille',
    );
    final data = response['data'] as Map<String, dynamic>?;
    return (data?['solde'] as num?)?.toDouble() ?? 0.0;
  } catch (_) {
    return 0.0;
  }
});

class MissionVtc {
  final String idTrajet;
  final String depart;
  final String destination;
  final double distanceKm;
  final int tarif;
  final int secondesRestantes;

  const MissionVtc({
    required this.idTrajet,
    required this.depart,
    required this.destination,
    required this.distanceKm,
    required this.tarif,
    required this.secondesRestantes,
  });

  factory MissionVtc.fromSocket(Map payload) => MissionVtc(
    idTrajet: payload['id_trajet'] as String,
    depart: payload['adresse_depart'] as String? ?? 'Départ',
    destination: payload['adresse_arrivee'] as String? ?? 'Destination',
    distanceKm: double.tryParse('${payload['distance_km'] ?? 0}') ?? 0,
    tarif: (double.tryParse('${payload['tarif_estime'] ?? 0}') ?? 0).round(),
    secondesRestantes:
        (int.tryParse('${payload['delai_reponse_secondes'] ?? 30}') ?? 30),
  );

  factory MissionVtc.fromApi(Map<String, dynamic> payload) {
    final expiration = DateTime.tryParse(
      payload['matching_expire_a'] as String? ?? '',
    );
    final secondes = expiration?.difference(DateTime.now()).inSeconds ?? 0;
    final distance = double.tryParse('${payload['distance_km'] ?? 0}') ?? 0;
    final tarif = double.tryParse('${payload['tarif_final'] ?? 0}') ?? 0;
    return MissionVtc(
      idTrajet: payload['id_trajet'] as String,
      depart: payload['adresse_depart'] as String? ?? 'Départ',
      destination: payload['adresse_arrivee'] as String? ?? 'Destination',
      distanceKm: distance,
      tarif: tarif.round(),
      secondesRestantes: secondes,
    );
  }

  MissionVtc copyWith({int? secondesRestantes}) => MissionVtc(
    idTrajet: idTrajet,
    depart: depart,
    destination: destination,
    distanceKm: distanceKm,
    tarif: tarif,
    secondesRestantes: secondesRestantes ?? this.secondesRestantes,
  );
}
