import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class RoleSelectionScreen extends ConsumerWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choisissez votre profil')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            RoleCard(
              icon: Icons.person,
              title: 'Passager',
              subtitle: 'Commander des courses',
              onTap: () async {
                await ref.read(authProvider.notifier).switchRole('passager');
              },
            ),
            const SizedBox(height: 16),
            RoleCard(
              icon: Icons.local_taxi,
              title: 'Chauffeur',
              subtitle: 'Conduire et gagner',
              onTap: () async {
                await ref.read(authProvider.notifier).switchRole('chauffeur');
              },
            ),
            const SizedBox(height: 16),
            RoleCard(
              icon: Icons.business,
              title: 'Propriétaire',
              subtitle: 'Gérer vos véhicules',
              onTap: () async {
                await ref.read(authProvider.notifier).switchRole('proprietaire');
              },
            ),
          ],
        ),
      ),
    );
  }
}

class RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Row(
            children: [
              Icon(icon, size: 60, color: Colors.blue),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward, color: Colors.blue),
            ],
          ),
        ),
      ),
    );
  }
}
