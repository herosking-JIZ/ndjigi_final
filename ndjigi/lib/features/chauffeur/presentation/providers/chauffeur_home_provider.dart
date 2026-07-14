import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ChauffeurHomeState {
  final bool isOnline;
  final bool isTogglingDisponibilite;

  const ChauffeurHomeState({
    this.isOnline = false,
    this.isTogglingDisponibilite = false,
  });

  ChauffeurHomeState copyWith({bool? isOnline, bool? isTogglingDisponibilite}) =>
      ChauffeurHomeState(
        isOnline: isOnline ?? this.isOnline,
        isTogglingDisponibilite:
            isTogglingDisponibilite ?? this.isTogglingDisponibilite,
      );
}

class ChauffeurHomeNotifier extends StateNotifier<ChauffeurHomeState> {
  final Ref _ref;

  ChauffeurHomeNotifier(this._ref) : super(const ChauffeurHomeState());

  /// Charge le statut de disponibilité réel du chauffeur connecté
  Future<void> initialiser() async {
    final chauffeurId = _ref.read(authProvider).user?.idUtilisateur;
    if (chauffeurId == null) return;

    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.get<Map<String, dynamic>>('/chauffeurs/$chauffeurId');
      final data = response['data'] as Map<String, dynamic>?;
      final statut = data?['statut_disponibilite'] as String?;
      state = state.copyWith(isOnline: statut == 'en_ligne');
    } catch (_) {
      // Reste sur la valeur par défaut (hors ligne) en cas d'échec de chargement
    }
  }

  /// Bascule en_ligne/hors_ligne, avec mise à jour optimiste et retour arrière si l'appel échoue
  Future<void> toggleDisponibilite() async {
    if (state.isTogglingDisponibilite) return;

    HapticFeedback.mediumImpact();
    final nouveauStatut = !state.isOnline;
    state = state.copyWith(isOnline: nouveauStatut, isTogglingDisponibilite: true);

    try {
      final api = _ref.read(apiServiceProvider);
      await api.patch<Map<String, dynamic>>(
        '/chauffeurs/disponibilite',
        data: {'statut_disponibilite': nouveauStatut ? 'en_ligne' : 'hors_ligne'},
      );
      state = state.copyWith(isTogglingDisponibilite: false);
    } catch (_) {
      // Échec : on annule le changement optimiste
      state = state.copyWith(isOnline: !nouveauStatut, isTogglingDisponibilite: false);
    }
  }
}

final chauffeurHomeProvider =
    StateNotifierProvider<ChauffeurHomeNotifier, ChauffeurHomeState>(
  (ref) => ChauffeurHomeNotifier(ref),
);

// Solde portefeuille (réutilise endpoint passager)
final portefeuilleCardProvider = FutureProvider.autoDispose<double>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final response = await api.get<Map<String, dynamic>>('/paiement/portefeuille');
    final data = response['data'] as Map<String, dynamic>?;
    return (data?['solde'] as num?)?.toDouble() ?? 0.0;
  } catch (_) {
    return 0.0;
  }
});

// Modèle mission mockée
class MissionMock {
  final String depart;
  final String destination;
  final double distanceKm;
  final int tarif;
  int secondesRestantes;

  MissionMock({
    required this.depart,
    required this.destination,
    required this.distanceKm,
    required this.tarif,
    required this.secondesRestantes,
  });
}

// Missions mockées
final missionsMockProvider = Provider<List<MissionMock>>((ref) => [
  MissionMock(
    depart: 'Quartier Zogona',
    destination: 'Marché Central',
    distanceKm: 3.2,
    tarif: 1500,
    secondesRestantes: 25,
  ),
  MissionMock(
    depart: 'Patte d\'Oie',
    destination: 'Ouaga 2000',
    distanceKm: 5.8,
    tarif: 2500,
    secondesRestantes: 12,
  ),
]);
