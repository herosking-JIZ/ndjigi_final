import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';

/// Champ de sélection de plage de dates (période de location), basé sur
/// le sélecteur natif Flutter [showDateRangePicker].
class DateRangePickerField extends StatelessWidget {
  final DateTimeRange? value;
  final ValueChanged<DateTimeRange> onChanged;
  final String placeholder;

  const DateRangePickerField({
    this.value,
    required this.onChanged,
    this.placeholder = 'Choisir une période',
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => _ouvrirSelecteur(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.background,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.date_range_outlined, color: AppColors.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                value != null
                    ? '${Formatters.formatDate(value!.start, pattern: 'd MMM yyyy')} → '
                        '${Formatters.formatDate(value!.end, pattern: 'd MMM yyyy')}'
                    : placeholder,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: value != null ? AppColors.textPrimary : AppColors.textHint,
                ),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }

  Future<void> _ouvrirSelecteur(BuildContext context) async {
    final aujourdhui = DateTime.now();
    final premierJour = DateTime(aujourdhui.year, aujourdhui.month, aujourdhui.day);

    final range = await showDateRangePicker(
      context: context,
      firstDate: premierJour,
      lastDate: premierJour.add(const Duration(days: 365)),
      initialDateRange: value != null && !value!.start.isBefore(premierJour) ? value : null,
    );
    if (range != null) onChanged(range);
  }
}
