import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';

/// Libellé + couleur associés à un `vehicule.statut` — utilisé à la fois par
/// l'écran détail (bannière) et la liste "mes véhicules" (badge compact).
(String, Color) statutVehiculeInfo(String statut) {
  return switch (statut) {
    'disponible' => ('Disponible', AppColors.success),
    'en_course' => ('En course', AppColors.info),
    'en_location' => ('En location', AppColors.accent),
    'maintenance' => ('En maintenance', AppColors.warning),
    'retire' => ('Retiré', AppColors.textSecondary),
    _ => (statut, AppColors.textSecondary),
  };
}

/// Petit badge coloré affichant le statut d'un véhicule (liste ou détail).
class VehiculeStatutBadge extends StatelessWidget {
  final String statut;

  const VehiculeStatutBadge({required this.statut, super.key});

  @override
  Widget build(BuildContext context) {
    final (label, color) = statutVehiculeInfo(statut);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSmall.copyWith(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}
