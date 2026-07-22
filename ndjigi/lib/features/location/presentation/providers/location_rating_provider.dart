import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_passager_repository.dart';

// ── Notation du propriétaire à la fin d'une location ───────────────────

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
  final LocationPassagerRepository _repository;
  final String idLocation;
  final String idProprietaire;

  LocationRatingNotifier({
    required LocationPassagerRepository repository,
    required this.idLocation,
    required this.idProprietaire,
  })  : _repository = repository,
        super(const LocationRatingState());

  Future<bool> envoyer({required int note, String? commentaire}) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await _repository.noterProprietaire(
        idLocation: idLocation,
        idProprietaire: idProprietaire,
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
    .family<LocationRatingNotifier, LocationRatingState, ({String idLocation, String idProprietaire})>((ref, params) {
  return LocationRatingNotifier(
    repository: ref.watch(locationPassagerRepositoryProvider),
    idLocation: params.idLocation,
    idProprietaire: params.idProprietaire,
  );
});
