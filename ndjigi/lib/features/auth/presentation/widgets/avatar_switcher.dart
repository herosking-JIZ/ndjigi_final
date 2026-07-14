import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../providers/auth_provider.dart';
import '../providers/role_switch_provider.dart';

/// Avatar réutilisable avec badge de switch de rôle pour utilisateurs multi-rôle
class AvatarSwitcher extends ConsumerWidget {
  /// Initiales ou texte à afficher dans l'avatar
  final String initials;

  /// Couleur de fond optionnelle (default: primary avec transparence)
  final Color? backgroundColor;

  /// Rayon de l'avatar (default: 20)
  final double radius;

  /// URL de la photo de profil optionnelle
  final String? photoUrl;

  /// Callback optionnel quand on clique sur l'avatar (si mono-rôle)
  final VoidCallback? onTap;

  /// Callback optionnel pour les erreurs de chargement d'image
  final ImageErrorWidgetBuilder? imageErrorBuilder;

  const AvatarSwitcher({
    required this.initials,
    this.backgroundColor,
    this.radius = 20,
    this.photoUrl,
    this.onTap,
    this.imageErrorBuilder,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isMultiRole = authState.availableRoles.length > 1;

    return GestureDetector(
      onTap: isMultiRole
          ? () => _openRoleSwitcher(context, ref)
          : onTap,
      child: Stack(
        alignment: Alignment.bottomRight,
        children: [
          // Avatar circulaire
          CircleAvatar(
            radius: radius,
            backgroundColor: backgroundColor ?? AppColors.primary.withValues(alpha: 0.12),
            child: photoUrl != null
                ? ClipOval(
                    child: Image.network(
                      photoUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: imageErrorBuilder ??
                          (context, error, stackTrace) => Text(
                            initials,
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: radius * 0.8,
                            ),
                          ),
                    ),
                  )
                : Text(
                    initials,
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: radius * 0.8,
                    ),
                  ),
          ),

          // Badge de multi-rôle (visible uniquement si > 1 rôle)
          if (isMultiRole)
            Container(
              width: radius * 0.8,
              height: radius * 0.8,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.background,
                  width: 2,
                ),
              ),
              child: Icon(
                Icons.swap_horiz,
                size: radius * 0.4,
                color: Colors.white,
              ),
            ),
        ],
      ),
    );
  }

  /// Ouvre la bottom sheet de sélection de rôle
  void _openRoleSwitcher(BuildContext context, WidgetRef ref) {
    final authState = ref.read(authProvider);

    showModalBottomSheet(
      context: context,
      builder: (context) => _RoleSwitcherBottomSheet(
        availableRoles: authState.availableRoles,
        activeRole: authState.activeRole,
        onRoleSelected: (newRole) async {
          Navigator.pop(context);
          await ref.read(roleSwitchProvider).switchToRole(
            context,
            newRole,
            showFeedback: true,
          );
        },
      ),
    );
  }
}

/// Bottom sheet pour sélectionner un rôle
class _RoleSwitcherBottomSheet extends StatelessWidget {
  final List<String> availableRoles;
  final String? activeRole;
  final Function(String) onRoleSelected;

  const _RoleSwitcherBottomSheet({
    required this.availableRoles,
    required this.activeRole,
    required this.onRoleSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Titre
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              'Mes profils',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),

          // Liste des rôles
          ...availableRoles.map((role) {
            final isSelected = role == activeRole;
            return _RoleCard(
              role: role,
              isSelected: isSelected,
              onTap: isSelected ? null : () => onRoleSelected(role),
            );
          }),

          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

/// Carte individuelle pour chaque rôle
class _RoleCard extends StatelessWidget {
  final String role;
  final bool isSelected;
  final VoidCallback? onTap;

  const _RoleCard({
    required this.role,
    required this.isSelected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final roleName = _getRoleName(role);
    final roleIcon = _getRoleIcon(role);

    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.12)
              : AppColors.background,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Icône du rôle
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                roleIcon,
                color: AppColors.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),

            // Nom du rôle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    roleName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  if (isSelected)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Rôle actif',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Coche si sélectionné
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: AppColors.primary,
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  String _getRoleName(String role) {
    switch (role) {
      case 'passager':
        return 'Passager';
      case 'chauffeur':
        return 'Chauffeur';
      case 'proprietaire':
        return 'Propriétaire';
      default:
        return role;
    }
  }

  IconData _getRoleIcon(String role) {
    switch (role) {
      case 'passager':
        return Icons.person_outline;
      case 'chauffeur':
        return Icons.local_taxi;
      case 'proprietaire':
        return Icons.business_outlined;
      default:
        return Icons.person_outline;
    }
  }
}
