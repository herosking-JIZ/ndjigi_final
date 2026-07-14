import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import 'chauffeur_home_screen.dart';
import 'chauffeur_historique_screen.dart';
import 'chauffeur_profil_hub_screen.dart';

class ChauffeurHubScreen extends ConsumerStatefulWidget {
  const ChauffeurHubScreen({super.key});

  @override
  ConsumerState<ChauffeurHubScreen> createState() => _ChauffeurHubScreenState();
}

class _ChauffeurHubScreenState extends ConsumerState<ChauffeurHubScreen> {
  int _currentIndex = 0;

  final _screens = [
    const ChauffeurHomeScreen(),
    const ChauffeurHistoriqueScreen(),
    const ChauffeurProfilHubScreen(),
  ];

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        backgroundColor: AppColors.background,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            label: 'Accueil',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.history),
            label: 'Historique',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: 'Profil',
          ),
        ],
        onTap: (index) {
          setState(() => _currentIndex = index);
        },
      ),
    );
  }
}
