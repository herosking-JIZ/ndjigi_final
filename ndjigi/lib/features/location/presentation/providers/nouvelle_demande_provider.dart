import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_passager_repository.dart';

// ── Formulaire "nouvelle demande de location" : choix de dates + envoi ─

class NouvelleDemandeState {
  final DateTimeRange? periode;
  final bool isSubmitting;
  final String? errorMessage;
  final bool success;

  const NouvelleDemandeState({
    this.periode,
    this.isSubmitting = false,
    this.errorMessage,
    this.success = false,
  });

  int get nbJours {
    if (periode == null) return 0;
    return periode!.end.difference(periode!.start).inDays.clamp(1, 999999);
  }

  double? montantEstime({double? tarifBase, double? tarifParJour}) {
    if (periode == null) return null;
    return (tarifBase ?? 0) + (tarifParJour ?? 0) * nbJours;
  }

  NouvelleDemandeState copyWith({
    DateTimeRange? periode,
    bool? isSubmitting,
    String? errorMessage,
    bool? success,
  }) {
    return NouvelleDemandeState(
      periode: periode ?? this.periode,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      success: success ?? this.success,
    );
  }
}

class NouvelleDemandeNotifier extends StateNotifier<NouvelleDemandeState> {
  final LocationPassagerRepository _repository;
  final String idVehicule;

  NouvelleDemandeNotifier({
    required LocationPassagerRepository repository,
    required this.idVehicule,
  })  : _repository = repository,
        super(const NouvelleDemandeState());

  void definirPeriode(DateTimeRange periode) {
    state = state.copyWith(periode: periode, errorMessage: null);
  }

  Future<bool> envoyer() async {
    final periode = state.periode;
    if (periode == null) {
      state = state.copyWith(errorMessage: 'Choisissez une période de location.');
      return false;
    }

    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await _repository.creerDemande(
        idVehicule: idVehicule,
        dateDebut: periode.start,
        dateFin: periode.end,
      );
      state = state.copyWith(isSubmitting: false, success: true);
      return true;
    } on DioException catch (e) {
      final message = switch (e.response?.statusCode) {
        409 => 'Ce véhicule est déjà réservé sur cette période.',
        404 => 'Ce véhicule n\'est plus disponible.',
        _ => 'Erreur lors de l\'envoi de la demande.',
      };
      state = state.copyWith(isSubmitting: false, errorMessage: message);
      return false;
    } catch (_) {
      state = state.copyWith(isSubmitting: false, errorMessage: 'Erreur lors de l\'envoi de la demande.');
      return false;
    }
  }
}

final nouvelleDemandeProvider = StateNotifierProvider.autoDispose
    .family<NouvelleDemandeNotifier, NouvelleDemandeState, String>((ref, idVehicule) {
  return NouvelleDemandeNotifier(
    repository: ref.watch(locationPassagerRepositoryProvider),
    idVehicule: idVehicule,
  );
});
