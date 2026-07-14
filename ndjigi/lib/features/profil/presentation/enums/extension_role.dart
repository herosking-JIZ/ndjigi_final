import 'package:flutter/material.dart';

// ── ENUM : ExtensionRole ─────────────────────────────────────────────
//
// Remplace les chaînes littérales 'chauffeur' / 'proprietaire'
// dispersées dans l'écran : une seule source de vérité pour le label,
// le sous-titre et l'icône de chaque rôle.

enum ExtensionRole {
  chauffeur(
    value: 'chauffeur',
    label: 'Chauffeur',
    subtitle: 'Transportez des passagers',
    icon: Icons.directions_car,
  ),
  proprietaire(
    value: 'proprietaire',
    label: 'Propriétaire',
    subtitle: 'Louez vos véhicules',
    icon: Icons.home_work,
  );

  const ExtensionRole({
    required this.value,
    required this.label,
    required this.subtitle,
    required this.icon,
  });

  /// Valeur brute envoyée/reçue de l'API et stockée dans le provider.
  final String value;
  final String label;
  final String subtitle;
  final IconData icon;

  static ExtensionRole? fromValue(String? value) {
    if (value == null) return null;
    for (final role in ExtensionRole.values) {
      if (role.value == value) return role;
    }
    return null;
  }
}
