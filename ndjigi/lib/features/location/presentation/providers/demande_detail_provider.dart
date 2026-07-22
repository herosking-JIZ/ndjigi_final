import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_passager_repository.dart';
import '../../data/models/location_passager_view.dart';
import 'mes_demandes_provider.dart';

// ── Détail d'une demande de location + action Annuler (passager) ─────
//
// Pas d'endpoint dédié "détail passager" côté backend (GET /locations/:id
// répond avec la forme aplatie propriétaire) : on retrouve la demande dans
// la liste complète, déjà dans la bonne forme (vehicule + proprietaire).

final demandeDetailProvider =
    FutureProvider.autoDispose.family<LocationPassagerView, String>((ref, idLocation) async {
  final repository = ref.watch(locationPassagerRepositoryProvider);
  final demandes = await repository.getMesDemandes();
  return demandes.firstWhere((d) => d.idLocation == idLocation);
});

class DemandeActionState {
  final bool isSubmitting;
  final String? errorMessage;
  final bool success;

  const DemandeActionState({this.isSubmitting = false, this.errorMessage, this.success = false});

  DemandeActionState copyWith({bool? isSubmitting, String? errorMessage, bool? success}) {
    return DemandeActionState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      success: success ?? this.success,
    );
  }
}

class DemandeActionNotifier extends StateNotifier<DemandeActionState> {
  final LocationPassagerRepository _repository;
  final Ref _ref;
  final String idLocation;

  DemandeActionNotifier({
    required LocationPassagerRepository repository,
    required Ref ref,
    required this.idLocation,
  })  : _repository = repository,
        _ref = ref,
        super(const DemandeActionState());

  Future<bool> annuler() async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await _repository.annuler(idLocation);
      _ref.invalidate(mesDemandesProvider('en_attente'));
      _ref.invalidate(demandeDetailProvider(idLocation));
      state = state.copyWith(isSubmitting: false, success: true);
      return true;
    } catch (_) {
      state = state.copyWith(isSubmitting: false, errorMessage: 'Erreur lors de l\'annulation.');
      return false;
    }
  }
}

final demandeActionProvider = StateNotifierProvider.autoDispose
    .family<DemandeActionNotifier, DemandeActionState, String>((ref, idLocation) {
  return DemandeActionNotifier(
    repository: ref.watch(locationPassagerRepositoryProvider),
    ref: ref,
    idLocation: idLocation,
  );
});
