import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/providers/profile_assistance_providers.dart';
import '../../../../core/theme/colors.dart';
import '../../../../shared/models/address.dart';
import '../../../../shared/widgets/address_map_picker.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';

class MesAdressesScreen extends ConsumerStatefulWidget {
  const MesAdressesScreen({super.key});

  @override
  ConsumerState<MesAdressesScreen> createState() => _MesAdressesScreenState();
}

class _MesAdressesScreenState extends ConsumerState<MesAdressesScreen> {
  final _formKey = GlobalKey<FormState>();

  bool _showForm = false;
  Address? _editingAddress;

  late TextEditingController _labelController;
  late TextEditingController _addressController;
  double? _latitude;
  double? _longitude;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController();
    _addressController = TextEditingController();
  }

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _labelController.clear();
    _addressController.clear();
    _latitude = null;
    _longitude = null;
    _editingAddress = null;
  }

  void _openMapPicker() async {
    final result = await Navigator.push<AddressMapPickerResult>(
      context,
      MaterialPageRoute(
        builder: (context) => AddressMapPicker(
          initialLatitude: _latitude,
          initialLongitude: _longitude,
        ),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _latitude = result.latitude;
        _longitude = result.longitude;
      });
    }
  }

  void _startEdit(Address address) {
    setState(() {
      _editingAddress = address;
      _labelController.text = address.label;
      _addressController.text = address.address;
      _latitude = address.latitude;
      _longitude = address.longitude;
      _showForm = true;
    });
    _formKey.currentState?.reset();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner un point sur la carte'),
          backgroundColor: Color.fromARGB(255, 255, 152, 0),
        ),
      );
      return;
    }

    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final isEditing = _editingAddress != null;

    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);

      if (isEditing) {
        await apiService.patch<Map<String, dynamic>>(
          '/addresses/${_editingAddress!.idAddress}',
          data: {
            'label': _labelController.text,
            'address': _addressController.text,
            'latitude': _latitude,
            'longitude': _longitude,
          },
        );

        if (!mounted) return;
        messenger.showSnackBar(
          SnackBar(
            content: const Text('Adresse modifiée'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        await apiService.post<Map<String, dynamic>>(
          '/addresses',
          data: {
            'label': _labelController.text,
            'address': _addressController.text,
            'latitude': _latitude,
            'longitude': _longitude,
          },
        );

        if (!mounted) return;
        messenger.showSnackBar(
          SnackBar(
            content: const Text('Adresse ajoutée'),
            backgroundColor: AppColors.success,
          ),
        );
      }

      _clearForm();
      setState(() => _showForm = false);
      ref.invalidate(addressesProvider);
    } catch (e) {
      if (!mounted) return;

      messenger.showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _deleteAddress(String addressId) async {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);

    try {
      final apiService = ref.read(apiServiceProvider);

      await apiService.delete<Map<String, dynamic>>('/addresses/$addressId');

      if (!mounted) return;

      messenger.showSnackBar(
        SnackBar(
          content: const Text('Adresse supprimée'),
          backgroundColor: AppColors.success,
        ),
      );

      ref.invalidate(addressesProvider);
    } catch (e) {
      if (!mounted) return;

      messenger.showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _confirmDeleteAddress(String addressId) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Supprimer cette adresse ?'),
        content: const Text('Cette action est irréversible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _deleteAddress(addressId);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final addressesAsync = ref.watch(addressesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Mes adresses'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: addressesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Erreur: ${error.toString()}'),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => ref.invalidate(addressesProvider),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (addresses) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              if (addresses.isEmpty && !_showForm)
                Center(
                  child: Column(
                    children: [
                      const SizedBox(height: 48),
                      Icon(Icons.location_off_outlined, size: 48, color: AppColors.textSecondary),
                      const SizedBox(height: 16),
                      const Text('Aucune adresse'),
                      const SizedBox(height: 24),
                      PrimaryButton(
                        label: 'Ajouter une adresse',
                        onPressed: () => setState(() {
                          _clearForm();
                          _showForm = true;
                        }),
                      ),
                      const SizedBox(height: 48),
                    ],
                  ),
                )
              else if (!_showForm) ...[
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: addresses.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final address = addresses[index];
                    return SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            address.label,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            address.address,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Lat: ${address.latitude.toStringAsFixed(4)}, Lng: ${address.longitude.toStringAsFixed(4)}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              ElevatedButton.icon(
                                onPressed: () => _startEdit(address),
                                icon: const Icon(Icons.edit, size: 18),
                                label: const Text('Éditer'),
                              ),
                              ElevatedButton.icon(
                                onPressed: () => _confirmDeleteAddress(address.idAddress),
                                icon: const Icon(Icons.delete, size: 18),
                                label: const Text('Supprimer'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.error.withValues(alpha: 0.12),
                                  foregroundColor: AppColors.error,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Ajouter une nouvelle adresse',
                  onPressed: () => setState(() {
                    _clearForm();
                    _showForm = true;
                  }),
                ),
              ],
              if (_showForm) ...[
                const SizedBox(height: 32),
                SectionCard(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        Text(
                          _editingAddress == null ? 'Nouvelle adresse' : 'Éditer l\'adresse',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          label: 'Label (ex: Maison, Bureau)',
                          controller: _labelController,
                          prefixIcon: Icons.label_outline,
                          validator: (value) {
                            if (value?.isEmpty ?? true) return 'Label requis';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          label: 'Adresse',
                          controller: _addressController,
                          prefixIcon: Icons.location_on_outlined,
                          validator: (value) {
                            if (value?.isEmpty ?? true) return 'Adresse requise';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        SectionCard(
                          child: Column(
                            children: [
                              if (_latitude != null && _longitude != null) ...[
                                Icon(Icons.check_circle, color: AppColors.success, size: 24),
                                const SizedBox(height: 8),
                                Text(
                                  'Point sélectionné ✓',
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.success),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Lat: ${_latitude!.toStringAsFixed(4)}, Lng: ${_longitude!.toStringAsFixed(4)}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                                ),
                              ] else
                                Text(
                                  'Aucun point sélectionné',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _openMapPicker,
                          icon: const Icon(Icons.map),
                          label: const Text('Choisir sur la carte'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => setState(() => _showForm = false),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey.shade200,
                                  foregroundColor: Colors.black,
                                ),
                                child: const Text('Annuler'),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: PrimaryButton(
                                label: _editingAddress == null ? 'Ajouter' : 'Modifier',
                                isLoading: _isLoading,
                                onPressed: _submitForm,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
