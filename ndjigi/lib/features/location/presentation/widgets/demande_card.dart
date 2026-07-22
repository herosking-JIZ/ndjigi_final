import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/location_passager_view.dart';

/// Carte "Mes locations" (passager) : véhicule, propriétaire, dates,
/// montant et badge de statut. Un seul type de carte pour les 3 onglets
/// (en_attente/active/historique) — contrairement au flux propriétaire, le
/// passager n'a pas d'action à faire sur une demande en attente autre que
/// consulter le détail (et éventuellement l'annuler, depuis le détail).
class DemandeCard extends StatelessWidget {
  final LocationPassagerView demande;
  final VoidCallback? onTap;

  const DemandeCard({required this.demande, this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    final vehicule = demande.vehicule;
    final titre = vehicule.annee != null ? '${vehicule.nomComplet} ${vehicule.annee}' : vehicule.nomComplet;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.background,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    titre,
                    style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _badgeColor(demande.statut).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(_badgeLabel(demande.statut), style: AppTextStyles.labelSmall.copyWith(color: _badgeColor(demande.statut))),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Propriétaire : ${demande.proprietaire.nomComplet}',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
            ),
            if (demande.dateDebut != null && demande.dateFin != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${Formatters.formatDate(demande.dateDebut!, pattern: 'd MMM yyyy')} → '
                      '${Formatters.formatDate(demande.dateFin!, pattern: 'd MMM yyyy')}'
                      '${demande.dureeJours != null ? ' (${demande.dureeJours} j)' : ''}',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Text(
              demande.montantTotal != null ? Formatters.formatCFA(demande.montantTotal!) : '-',
              style: AppTextStyles.bodyLarge.copyWith(color: AppColors.success, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  String _badgeLabel(String statut) {
    return switch (statut) {
      'en_attente' => 'En attente',
      'active' => 'Active',
      'annulee' => 'Annulée',
      'refusee' => 'Refusée',
      _ => 'Terminée',
    };
  }

  Color _badgeColor(String statut) {
    return switch (statut) {
      'en_attente' => AppColors.warning,
      'active' => AppColors.info,
      'annulee' || 'refusee' => AppColors.error,
      _ => AppColors.success,
    };
  }
}
