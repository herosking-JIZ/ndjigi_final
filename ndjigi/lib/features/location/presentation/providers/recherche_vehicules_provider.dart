import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../course/data/course_repository.dart';
import '../../../course/data/models/course.dart';
import '../../data/location_passager_repository.dart';
import '../../data/models/vehicule_location_resume.dart';

// ── Recherche de véhicules disponibles à la location (passager) ──────

final categoriesVehiculeLocationProvider =
    FutureProvider.autoDispose<List<CategorieVehicule>>((ref) {
  return ref.watch(courseRepositoryProvider).getCategoriesVehicule();
});

class RechercheVehiculesState {
  final bool isLoading;
  final List<VehiculeLocationResume> resultats;
  final String? errorMessage;
  final String? idCategorie;
  final DateTimeRange? periode;

  const RechercheVehiculesState({
    this.isLoading = true,
    this.resultats = const [],
    this.errorMessage,
    this.idCategorie,
    this.periode,
  });

  RechercheVehiculesState copyWith({
    bool? isLoading,
    List<VehiculeLocationResume>? resultats,
    String? errorMessage,
    String? idCategorie,
    bool resetCategorie = false,
    DateTimeRange? periode,
    bool resetPeriode = false,
  }) {
    return RechercheVehiculesState(
      isLoading: isLoading ?? this.isLoading,
      resultats: resultats ?? this.resultats,
      errorMessage: errorMessage,
      idCategorie: resetCategorie ? null : (idCategorie ?? this.idCategorie),
      periode: resetPeriode ? null : (periode ?? this.periode),
    );
  }
}

class RechercheVehiculesNotifier extends StateNotifier<RechercheVehiculesState> {
  final LocationPassagerRepository _repository;

  RechercheVehiculesNotifier(this._repository) : super(const RechercheVehiculesState()) {
    rechercher();
  }

  void definirCategorie(String? idCategorie) {
    state = state.copyWith(idCategorie: idCategorie, resetCategorie: idCategorie == null);
    rechercher();
  }

  void definirPeriode(DateTimeRange? periode) {
    state = state.copyWith(periode: periode, resetPeriode: periode == null);
    rechercher();
  }

  Future<void> rechercher() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final resultats = await _repository.rechercherVehicules(
        idCategorie: state.idCategorie,
        dateDebut: state.periode?.start,
        dateFin: state.periode?.end,
      );
      state = state.copyWith(isLoading: false, resultats: resultats);
    } catch (_) {
      state = state.copyWith(isLoading: false, errorMessage: 'Erreur lors du chargement des véhicules.');
    }
  }
}

final rechercheVehiculesProvider =
    StateNotifierProvider.autoDispose<RechercheVehiculesNotifier, RechercheVehiculesState>((ref) {
  return RechercheVehiculesNotifier(ref.watch(locationPassagerRepositoryProvider));
});
