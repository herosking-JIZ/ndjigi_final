import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';

// ── ENUM : DemandeStatut ─────────────────────────────────────────────
//
// Centralise couleur/icône/message par statut plutôt que de comparer
// des chaînes littérales directement dans le widget.

enum DemandeStatut {
  enAttente('en_attente'),
  accepte('accepte'),
  refuse('refuse');

  const DemandeStatut(this.value);
  final String value;

  static DemandeStatut? fromValue(String? value) {
    for (final statut in DemandeStatut.values) {
      if (statut.value == value) return statut;
    }
    return null;
  }

  /// Une demande "active" bloque la soumission d'une nouvelle demande
  /// pour le même rôle.
  bool get isActive => this == enAttente || this == accepte;

  IconData get icon => switch (this) {
        DemandeStatut.enAttente => Icons.schedule,
        DemandeStatut.accepte => Icons.check_circle,
        DemandeStatut.refuse => Icons.cancel,
      };

  Color color(BuildContext context) => switch (this) {
        DemandeStatut.enAttente => AppColors.warning,
        DemandeStatut.accepte => AppColors.success,
        DemandeStatut.refuse => AppColors.error,
      };

  String defaultMessage({String? motifRejet}) => switch (this) {
        DemandeStatut.enAttente =>
          'Votre demande est en cours de traitement.',
        DemandeStatut.accepte =>
          'Votre demande a été acceptée ! Vous avez accès au nouveau rôle.',
        DemandeStatut.refuse =>
          'Votre demande a été refusée. '
              '${motifRejet ?? 'Vous pouvez soumettre une nouvelle demande.'}',
      };
}
