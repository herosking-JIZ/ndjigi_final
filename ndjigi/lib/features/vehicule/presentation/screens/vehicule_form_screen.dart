import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/inline_banner.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../providers/mes_vehicules_provider.dart';
import '../providers/vehicule_detail_provider.dart';
import '../providers/vehicule_form_provider.dart';
import '../widgets/photo_slot_tile.dart';
import '../widgets/stepper_counter.dart';

/// Écran "Ajouter un véhicule" / "Modifier le véhicule" — réutilisé pour la
/// création (idVehicule == null) et l'édition (idVehicule fourni), pour un
/// véhicule de course (chauffeur) ou de location (propriétaire) selon [type].
class VehiculeFormScreen extends ConsumerWidget {
  final String type; // 'course' | 'location'
  final String? idVehicule;

  const VehiculeFormScreen({required this.type, this.idVehicule, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final params = VehiculeFormParams(type: type, idVehicule: idVehicule);
    final state = ref.watch(vehiculeFormProvider(params));
    final notifier = ref.read(vehiculeFormProvider(params).notifier);

    ref.listen(vehiculeFormProvider(params), (previous, next) {
      if (next.submitSuccess && (previous == null || !previous.submitSuccess)) {
        ref.invalidate(mesVehiculesProvider('course'));
        ref.invalidate(mesVehiculesProvider('location'));
        if (idVehicule != null) ref.invalidate(vehiculeDetailProvider(idVehicule!));
        Navigator.of(context).maybePop();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(state.isEditMode ? 'Modifier le véhicule' : 'Ajouter un véhicule'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: state.isLoadingVehicule
          ? const LoadingView()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (state.errorMessage != null) ...[
                    InlineBanner(message: state.errorMessage!, color: AppColors.error, icon: Icons.error_outline),
                    const SizedBox(height: 16),
                  ],
                  AppTextField(
                    label: 'Marque',
                    initialValue: state.marque,
                    onChanged: notifier.setMarque,
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Modèle',
                    initialValue: state.modele,
                    onChanged: notifier.setModele,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: AppTextField(
                          label: 'Année',
                          initialValue: state.annee,
                          keyboardType: TextInputType.number,
                          onChanged: notifier.setAnnee,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppTextField(
                          label: 'Couleur',
                          initialValue: state.couleur,
                          onChanged: notifier.setCouleur,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Immatriculation',
                    initialValue: state.immatriculation,
                    onChanged: notifier.setImmatriculation,
                  ),
                  const SizedBox(height: 20),
                  Text('Catégorie', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  state.isLoadingCategories
                      ? const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: LinearProgressIndicator(),
                        )
                      : DropdownButtonFormField(
                          initialValue: state.categorieSelectionnee,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: AppColors.surface,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          hint: const Text('Choisir une catégorie'),
                          items: state.categories
                              .map((c) => DropdownMenuItem(value: c, child: Text(c.nom)))
                              .toList(),
                          onChanged: (categorie) {
                            if (categorie != null) notifier.selectionnerCategorie(categorie);
                          },
                        ),
                  const SizedBox(height: 20),
                  Text('Nombre de places', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  StepperCounter(
                    value: state.nbPlaces,
                    onIncrement: notifier.incrementerPlaces,
                    onDecrement: notifier.decrementerPlaces,
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.ac_unit, color: AppColors.accent, size: 20),
                        const SizedBox(width: 12),
                        Expanded(child: Text('Climatisation', style: AppTextStyles.bodyMedium)),
                        Switch(
                          value: state.climatisation,
                          activeThumbColor: AppColors.primary,
                          onChanged: notifier.toggleClimatisation,
                        ),
                      ],
                    ),
                  ),
                  if (type == 'course') ...[
                    const SizedBox(height: 20),
                    Text('Type de service', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: kTypeServiceOptions.map((option) {
                        final selectionne = state.typeService == option;
                        return ChoiceChip(
                          label: Text(option[0].toUpperCase() + option.substring(1)),
                          selected: selectionne,
                          selectedColor: AppColors.primary.withValues(alpha: 0.18),
                          onSelected: (_) => notifier.setTypeService(option),
                        );
                      }).toList(),
                    ),
                  ],
                  if (type == 'location') ...[
                    const SizedBox(height: 20),
                    Text('Tarifs de location', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Text(
                      'Optionnel — peut être renseigné plus tard',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            label: 'Tarif de base (FCFA)',
                            initialValue: state.tarifBaseLocation,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            onChanged: notifier.setTarifBaseLocation,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            label: 'Tarif par jour (FCFA)',
                            initialValue: state.tarifParJourLocation,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            onChanged: notifier.setTarifParJourLocation,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 24),
                  Text('Documents', style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 12),
                  PhotoSlotTile(
                    icon: Icons.description_outlined,
                    label: 'Carte grise du véhicule',
                    uploadState: state.uploads[kCarteGriseKey]!,
                    onTap: () => notifier.pickFile(kCarteGriseKey),
                  ),
                  PhotoSlotTile(
                    icon: Icons.shield_outlined,
                    label: 'Assurance du véhicule',
                    uploadState: state.uploads[kAssuranceKey]!,
                    onTap: () => notifier.pickFile(kAssuranceKey),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Photos du véhicule (${state.uploads.values.where((u) => kPhotoSlotKeys.contains(u.documentType) && u.localFilePath != null).length})',
                    style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  ...kPhotoSlotKeys.map(
                    (slot) => PhotoSlotTile(
                      icon: Icons.image_outlined,
                      label: kPhotoSlotLabels[slot]!,
                      uploadState: state.uploads[slot]!,
                      onTap: () => notifier.pickFile(slot),
                    ),
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    label: state.isEditMode ? 'Enregistrer les modifications' : '+ Ajouter le véhicule',
                    isDisabled: !state.canSubmit,
                    isLoading: state.isSubmitting,
                    onPressed: () => notifier.submit(),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}
