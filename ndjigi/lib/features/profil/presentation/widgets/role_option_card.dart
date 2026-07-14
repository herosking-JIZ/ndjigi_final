import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/section_card.dart';
import '../enums/extension_role.dart';

// ── WIDGET : RoleOptionCard ──────────────────────────────────────────
//
// Doit être placée dans un `Row` (et non un `Wrap`) par son parent :
// `Wrap` ne fournit pas de contraintes bornées à ses enfants, donc
// envelopper cette carte dans un `Expanded` sous un `Wrap` provoque
// une exception au runtime ("Expanded widgets must be placed inside
// Flex widgets"). Voir `_RoleSelectionSection` dans l'écran parent.

class RoleOptionCard extends StatelessWidget {
  const RoleOptionCard({
    super.key,
    required this.role,
    required this.isSelected,
    required this.onTap,
  });

  final ExtensionRole role;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: isSelected,
      label: '${role.label}, ${role.subtitle}',
      child: GestureDetector(
        onTap: onTap,
        child: SectionCard(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            decoration: BoxDecoration(
              border: Border.all(
                color: isSelected ? AppColors.primary : Colors.transparent,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.primary.withValues(alpha: 0.1),
                  ),
                  child: Icon(
                    role.icon,
                    color: isSelected ? AppColors.background : AppColors.primary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(role.label, style: AppTextStyles.titleSmall),
                const SizedBox(height: 4),
                Text(
                  role.subtitle,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
