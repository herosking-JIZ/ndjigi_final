import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import 'proprietaire_home_screen.dart';
import 'proprietaire_locations_hub_screen.dart';
import 'proprietaire_profil_hub_screen.dart';

class ProprietaireHubScreen extends ConsumerStatefulWidget {
  const ProprietaireHubScreen({super.key});

  @override
  ConsumerState<ProprietaireHubScreen> createState() => _ProprietaireHubScreenState();
}

class _ProprietaireHubScreenState extends ConsumerState<ProprietaireHubScreen> {
  int _currentIndex = 0;

  void _allerVersLocations() => setState(() => _currentIndex = 1);

  @override
  Widget build(BuildContext context) {
    final screens = [
      ProprietaireHomeScreen(onGoToLocations: _allerVersLocations),
      const ProprietaireLocationsHubScreen(),
      const ProprietaireProfilHubScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        backgroundColor: AppColors.background,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Accueil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event_seat_outlined),
            activeIcon: Icon(Icons.event_seat),
            label: 'Locations',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
