import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';

/// Provider pour gérer le basculement de rôle
/// Combine la logique de switch avec la navigation et le feedback utilisateur
final roleSwitchProvider = Provider<RoleSwitchService>((ref) {
  return RoleSwitchService(ref);
});

class RoleSwitchService {
  final Ref ref;

  RoleSwitchService(this.ref);

  /// Bascule vers un rôle différent avec navigation et feedback
  /// Déclenche aussi la transition fade vers le nouvel écran d'accueil
  Future<void> switchToRole(
    BuildContext context,
    String newRole, {
    bool showFeedback = true,
  }) async {
    try {
      // 1. Vérifier que le nouveau rôle est disponible pour cet utilisateur
      final authState = ref.read(authProvider);
      if (!authState.availableRoles.contains(newRole)) {
        throw Exception('Rôle non disponible pour cet utilisateur');
      }

      // 2. Si c'est déjà le rôle actif, rien faire
      if (authState.activeRole == newRole) {
        return;
      }

      // 3. Changer le rôle actif (persiste via SecureStorage)
      await ref.read(authProvider.notifier).switchRole(newRole);

      // 4. Si le contexte n'est plus monté, arrêter ici
      if (!context.mounted) {
        return;
      }

      // 5. Afficher le SnackBar de confirmation
      if (showFeedback) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_getRoleDisplayName(newRole) != null
                ? 'Vous êtes maintenant en mode ${_getRoleDisplayName(newRole)}'
                : 'Vous êtes maintenant en mode $newRole'),
            duration: const Duration(seconds: 2),
          ),
        );
      }

      // 6. Naviguer vers le nouvel écran d'accueil avec transition fade
      if (context.mounted) {
        context.go('/home/$newRole');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur : ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Retourne le nom affiché du rôle
  String? _getRoleDisplayName(String role) {
    switch (role) {
      case 'passager':
        return 'Passager';
      case 'chauffeur':
        return 'Chauffeur';
      case 'proprietaire':
        return 'Propriétaire';
      default:
        return null;
    }
  }
}
