import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_repository.dart';
import '../../data/models/location_acceptation_result.dart';
import '../../data/models/location_owner_view.dart';
import 'locations_provider.dart';

// ── Détail d'une location + actions accepter/refuser ──────────────────

final locationDetailProvider =
    FutureProvider.autoDispose.family<LocationOwnerView, String>((ref, idLocation) async {
  final repository = ref.watch(locationRepositoryProvider);
  return repository.getLocation(idLocation);
});

class LocationActionState {
  final bool isSubmitting;
  final String? errorMessage;
  final bool success;
  // Non nul uniquement après un accepter() réussi (le paiement a eu lieu) :
  // c'est ce qui distingue une acceptation d'un refus/d'une fin de location
  // pour décider de rediriger vers l'écran de confirmation de paiement.
  final LocationAcceptationResult? acceptationResult;

  const LocationActionState({
    this.isSubmitting = false,
    this.errorMessage,
    this.success = false,
    this.acceptationResult,
  });

  LocationActionState copyWith({
    bool? isSubmitting,
    String? errorMessage,
    bool? success,
    LocationAcceptationResult? acceptationResult,
  }) {
    return LocationActionState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      success: success ?? this.success,
      acceptationResult: acceptationResult,
    );
  }
}

class LocationActionNotifier extends StateNotifier<LocationActionState> {
  final LocationRepository _repository;
  final Ref _ref;
  final String idLocation;

  LocationActionNotifier({
    required LocationRepository repository,
    required Ref ref,
    required this.idLocation,
  })  : _repository = repository,
        _ref = ref,
        super(const LocationActionState());

  Future<bool> accepter() async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      final resultat = await _repository.accepter(idLocation);
      _invalidateListes();
      state = state.copyWith(isSubmitting: false, success: true, acceptationResult: resultat);
      return true;
    } catch (_) {
      state = state.copyWith(isSubmitting: false, errorMessage: 'Erreur lors de l\'opération.');
      return false;
    }
  }

  Future<bool> refuser() => _executer(_repository.refuser);
  Future<bool> terminer() => _executer(_repository.terminer);

  void _invalidateListes() {
    // La demande change de statut : les 3 onglets (En attente/Actives/Historique)
    // doivent être rafraîchis, ainsi que le détail lui-même.
    _ref.invalidate(locationsProvider('en_attente'));
    _ref.invalidate(locationsProvider('active'));
    _ref.invalidate(locationsProvider('historique'));
    _ref.invalidate(locationDetailProvider(idLocation));
  }

  Future<bool> _executer(Future<void> Function(String) action) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await action(idLocation);
      _invalidateListes();
      state = state.copyWith(isSubmitting: false, success: true);
      return true;
    } catch (_) {
      state = state.copyWith(isSubmitting: false, errorMessage: 'Erreur lors de l\'opération.');
      return false;
    }
  }
}

final locationActionProvider = StateNotifierProvider.autoDispose
    .family<LocationActionNotifier, LocationActionState, String>((ref, idLocation) {
  return LocationActionNotifier(
    repository: ref.watch(locationRepositoryProvider),
    ref: ref,
    idLocation: idLocation,
  );
});
