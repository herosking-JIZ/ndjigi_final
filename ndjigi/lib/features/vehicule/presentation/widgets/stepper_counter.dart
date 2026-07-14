import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';

/// Compteur "− nombre +" réutilisé pour le nombre de places du véhicule.
class StepperCounter extends StatelessWidget {
  final int value;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const StepperCounter({
    required this.value,
    required this.onIncrement,
    required this.onDecrement,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _Bouton(icon: Icons.remove, onTap: onDecrement),
        SizedBox(
          width: 40,
          child: Text('$value', textAlign: TextAlign.center, style: AppTextStyles.titleLarge),
        ),
        _Bouton(icon: Icons.add, onTap: onIncrement),
      ],
    );
  }
}

class _Bouton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _Bouton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.primary.withValues(alpha: 0.1),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
      ),
    );
  }
}
