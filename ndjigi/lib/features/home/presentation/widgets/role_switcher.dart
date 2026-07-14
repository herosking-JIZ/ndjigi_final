import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class RoleSwitcher extends ConsumerWidget {
  const RoleSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    if (authState.availableRoles.length <= 1) {
      return const SizedBox.shrink();
    }

    return showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Changer de rôle',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...authState.availableRoles.map((role) {
              final isSelected = authState.activeRole == role;
              return ListTile(
                title: Text(
                  _getRoleName(role),
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? Colors.blue : Colors.black,
                  ),
                ),
                trailing: isSelected ? const Icon(Icons.check, color: Colors.blue) : null,
                onTap: () async {
                  await ref.read(authProvider.notifier).switchRole(role);
                  if (context.mounted) {
                    Navigator.pop(context);
                    context.go('/home/$role');
                  }
                },
              );
            }),
          ],
        ),
      ),
    ) as Widget;
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
}
