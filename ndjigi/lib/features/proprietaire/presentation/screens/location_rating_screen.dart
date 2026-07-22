import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/inline_banner.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../providers/location_rating_provider.dart';

/// Notation du locataire à la fin d'une location.
/// Nommé `ProprietaireLocationRatingScreen` (et non `LocationRatingScreen`)
/// pour éviter une collision de nom avec l'écran homonyme côté passager
/// (`features/location/presentation/screens/location_rating_screen.dart`)
/// quand les deux sont importés dans app_router.dart.
class ProprietaireLocationRatingScreen extends ConsumerStatefulWidget {
  final String idLocation;
  final String idPassager;

  const ProprietaireLocationRatingScreen({required this.idLocation, required this.idPassager, super.key});

  @override
  ConsumerState<ProprietaireLocationRatingScreen> createState() => _ProprietaireLocationRatingScreenState();
}

class _ProprietaireLocationRatingScreenState extends ConsumerState<ProprietaireLocationRatingScreen> {
  int _note = 5;
  final _commentaireController = TextEditingController();

  @override
  void dispose() {
    _commentaireController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final params = (idLocation: widget.idLocation, idPassager: widget.idPassager);
    final ratingState = ref.watch(locationRatingProvider(params));

    ref.listen(locationRatingProvider(params), (previous, next) {
      if (next.success && (previous == null || !previous.success)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Merci pour votre note !')),
        );
        Navigator.of(context).maybePop();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Noter le locataire'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            Text(
              'Comment s\'est passée cette location ?',
              style: AppTextStyles.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final valeur = index + 1;
                return IconButton(
                  iconSize: 40,
                  icon: Icon(
                    valeur <= _note ? Icons.star : Icons.star_border,
                    color: AppColors.accent,
                  ),
                  onPressed: () => setState(() => _note = valeur),
                );
              }),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _commentaireController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Un commentaire (facultatif)',
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            if (ratingState.errorMessage != null) ...[
              const SizedBox(height: 16),
              InlineBanner(message: ratingState.errorMessage!, color: AppColors.error, icon: Icons.error_outline),
            ],
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Envoyer',
              isLoading: ratingState.isSubmitting,
              onPressed: () => ref.read(locationRatingProvider(params).notifier).envoyer(
                    note: _note,
                    commentaire: _commentaireController.text,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
