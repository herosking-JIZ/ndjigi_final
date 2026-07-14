import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_repository.dart';
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

  const LocationActionState({this.isSubmitting = false, this.errorMessage, this.success = false});

  LocationActionState copyWith({bool? isSubmitting, String? errorMessage, bool? success}) {
    return LocationActionState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      success: success ?? this.success,
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

  Future<bool> accepter() => _executer(_repository.accepter);
  Future<bool> refuser() => _executer(_repository.refuser);

  Future<bool> _executer(Future<void> Function(String) action) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await action(idLocation);
      // La demande change de statut : les onglets "En attente" et "Actives"
      // doivent tous les deux être rafraîchis, ainsi que le détail lui-même.
      _ref.invalidate(locationsProvider('en_attente'));
      _ref.invalidate(locationsProvider('active'));
      _ref.invalidate(locationDetailProvider(idLocation));
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
