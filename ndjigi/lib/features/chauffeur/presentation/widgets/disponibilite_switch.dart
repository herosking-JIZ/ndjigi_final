import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';

class DisponibiliteSwitch extends StatefulWidget {
  final bool isOnline;
  final VoidCallback onToggle;

  const DisponibiliteSwitch({
    required this.isOnline,
    required this.onToggle,
    super.key,
  });

  @override
  State<DisponibiliteSwitch> createState() => _DisponibiliteSwitchState();
}

class _DisponibiliteSwitchState extends State<DisponibiliteSwitch>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    if (widget.isOnline) {
      _pulseController.repeat();
    }
  }

  @override
  void didUpdateWidget(DisponibiliteSwitch oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isOnline && !_pulseController.isAnimating) {
      _pulseController.repeat();
    } else if (!widget.isOnline && _pulseController.isAnimating) {
      _pulseController.stop();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      height: 72,
      decoration: BoxDecoration(
        color: widget.isOnline
            ? AppColors.primary.withValues(alpha: 0.12)
            : AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          // Icône avec pulsation si online
          ScaleTransition(
            scale: Tween<double>(begin: 1.0, end: 1.15).animate(
              CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
            ),
            child: Icon(
              widget.isOnline ? Icons.wifi : Icons.wifi_off,
              color: widget.isOnline ? AppColors.primary : AppColors.textSecondary,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),

          // Texte statut
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  widget.isOnline ? 'En ligne' : 'Hors ligne',
                  style: AppTextStyles.titleMedium.copyWith(
                    color:
                        widget.isOnline ? AppColors.primary : AppColors.textSecondary,
                  ),
                ),
                Text(
                  widget.isOnline
                      ? 'Prêt à recevoir des courses'
                      : 'Vous ne recevrez pas de courses',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          // Switch
          CupertinoSwitch(
            value: widget.isOnline,
            onChanged: (_) => widget.onToggle(),
            activeTrackColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}
