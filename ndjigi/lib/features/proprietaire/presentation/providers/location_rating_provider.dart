import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_repository.dart';

// ── Notation du locataire à la fin d'une location ──────────────────────

class LocationRatingState {
  final bool isSubmitting;
  final String? errorMessage;
  final bool success;

  const LocationRatingState({this.isSubmitting = false, this.errorMessage, this.success = false});

  LocationRatingState copyWith({bool? isSubmitting, String? errorMessage, bool? success}) {
    return LocationRatingState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      success: success ?? this.success,
    );
  }
}

class LocationRatingNotifier extends StateNotifier<LocationRatingState> {
  final LocationRepository _repository;
  final String idLocation;
  final String idPassager;

  LocationRatingNotifier({
    required LocationRepository repository,
    required this.idLocation,
    required this.idPassager,
  })  : _repository = repository,
        super(const LocationRatingState());

  Future<bool> envoyer({required int note, String? commentaire}) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await _repository.noterPassager(
        idLocation: idLocation,
        idPassager: idPassager,
        note: note,
        commentaire: commentaire,
      );
      state = state.copyWith(isSubmitting: false, success: true);
      return true;
    } catch (_) {
      state = state.copyWith(isSubmitting: false, errorMessage: 'Erreur lors de l\'envoi de la note.');
      return false;
    }
  }
}

final locationRatingProvider = StateNotifierProvider.autoDispose
    .family<LocationRatingNotifier, LocationRatingState, ({String idLocation, String idPassager})>((ref, params) {
  return LocationRatingNotifier(
    repository: ref.watch(locationRepositoryProvider),
    idLocation: params.idLocation,
    idPassager: params.idPassager,
  );
});
