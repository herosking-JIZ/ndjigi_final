import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/providers/profile_assistance_providers.dart';
import '../../../../core/theme/colors.dart';
import '../../../../shared/models/contact_confiance.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';

class SecuriteContactsScreen extends ConsumerStatefulWidget {
  const SecuriteContactsScreen({super.key});

  @override
  ConsumerState<SecuriteContactsScreen> createState() => _SecuriteContactsScreenState();
}

class _SecuriteContactsScreenState extends ConsumerState<SecuriteContactsScreen> {
  final _formKey = GlobalKey<FormState>();

  bool _showForm = false;
  ContactConfiance? _editingContact;

  late TextEditingController _nomController;
  late TextEditingController _prenomController;
  late TextEditingController _phoneController;
  String? _selectedRelation;
  String _countryCode = '+226';
  bool _isLoading = false;

  static const List<String> _relationOptions = [
    'parent',
    'enfant',
    'frere',
    'soeur',
    'conjoint',
    'cousin',
    'copain',
    'copine',
    'autre',
  ];

  static const Map<String, String> _relationLabels = {
    'parent': 'Parent',
    'enfant': 'Enfant',
    'frere': 'Frère',
    'soeur': 'Sœur',
    'conjoint': 'Conjoint',
    'cousin': 'Cousin',
    'copain': 'Copain',
    'copine': 'Copine',
    'autre': 'Autre',
  };

  @override
  void initState() {
    super.initState();
    _nomController = TextEditingController();
    _prenomController = TextEditingController();
    _phoneController = TextEditingController();
  }

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _nomController.clear();
    _prenomController.clear();
    _phoneController.clear();
    _selectedRelation = null;
    _countryCode = '+226';
    _editingContact = null;
  }

  void _startEdit(ContactConfiance contact) {
    setState(() {
      _editingContact = contact;
      _prenomController.text = contact.prenom;
      _nomController.text = contact.nom;
      _phoneController.text = contact.phone;
      _selectedRelation = contact.relation;
      _countryCode = contact.countryCode;
      _showForm = true;
    });
    _formKey.currentState?.reset();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedRelation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner une relation'),
          backgroundColor: Color.fromARGB(255, 255, 152, 0),
        ),
      );
      return;
    }

    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final isEditing = _editingContact != null;

    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);

      if (isEditing) {
        await apiService.patch<Map<String, dynamic>>(
          '/contacts-confiance/${_editingContact!.idContact}',
          data: {
            'nom': _nomController.text,
            'prenom': _prenomController.text,
            'country_code': _countryCode,
            'phone': _phoneController.text,
            'relation': _selectedRelation,
          },
        );

        if (!mounted) return;
        messenger.showSnackBar(
          SnackBar(
            content: const Text('Contact modifié'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        await apiService.post<Map<String, dynamic>>(
          '/contacts-confiance',
          data: {
            'nom': _nomController.text,
            'prenom': _prenomController.text,
            'country_code': _countryCode,
            'phone': _phoneController.text,
            'relation': _selectedRelation,
          },
        );

        if (!mounted) return;
        messenger.showSnackBar(
          SnackBar(
            content: const Text('Contact ajouté'),
            backgroundColor: AppColors.success,
          ),
        );
      }

      _clearForm();
      setState(() => _showForm = false);
      ref.invalidate(contactsConfianceProvider);
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

  Future<void> _deleteContact(String contactId) async {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);

    try {
      final apiService = ref.read(apiServiceProvider);

      await apiService.delete<Map<String, dynamic>>('/contacts-confiance/$contactId');

      if (!mounted) return;

      messenger.showSnackBar(
        SnackBar(
          content: const Text('Contact supprimé'),
          backgroundColor: AppColors.success,
        ),
      );

      ref.invalidate(contactsConfianceProvider);
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

  void _confirmDeleteContact(String contactId, String nom, String prenom) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Supprimer ce contact ?'),
        content: Text('Supprimer $prenom $nom de vos contacts de confiance ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _deleteContact(contactId);
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
    final contactsAsync = ref.watch(contactsConfianceProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Sécurité & contacts'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: contactsAsync.when(
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
                onPressed: () => ref.invalidate(contactsConfianceProvider),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (contacts) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              SectionCard(
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.info, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Ajoutez des contacts de confiance pour les urgences',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (contacts.isEmpty && !_showForm)
                Center(
                  child: Column(
                    children: [
                      const SizedBox(height: 48),
                      Icon(Icons.person_off_outlined, size: 48, color: AppColors.textSecondary),
                      const SizedBox(height: 16),
                      const Text('Aucun contact'),
                      const SizedBox(height: 24),
                      PrimaryButton(
                        label: 'Ajouter un contact',
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
                  itemCount: contacts.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final contact = contacts[index];
                    return SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${contact.prenom} ${contact.nom}',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Relation: ${contact.relation}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${contact.countryCode}${contact.phone}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              ElevatedButton.icon(
                                onPressed: () => _startEdit(contact),
                                icon: const Icon(Icons.edit, size: 18),
                                label: const Text('Éditer'),
                              ),
                              ElevatedButton.icon(
                                onPressed: () => _confirmDeleteContact(contact.idContact, contact.nom, contact.prenom),
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
                  label: 'Ajouter un nouveau contact',
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
                          _editingContact == null ? 'Nouveau contact de confiance' : 'Éditer le contact',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          label: 'Prénom',
                          controller: _prenomController,
                          prefixIcon: Icons.person_outline,
                          validator: (value) {
                            if (value?.isEmpty ?? true) return 'Prénom requis';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          label: 'Nom',
                          controller: _nomController,
                          prefixIcon: Icons.person_outline,
                          validator: (value) {
                            if (value?.isEmpty ?? true) return 'Nom requis';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedRelation,
                          hint: const Text('Sélectionner une relation'),
                          decoration: InputDecoration(
                            labelText: 'Relation',
                            prefixIcon: const Icon(Icons.people_outline),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          items: _relationOptions.map((relation) {
                            return DropdownMenuItem(
                              value: relation,
                              child: Text(_relationLabels[relation] ?? relation),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() => _selectedRelation = value);
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Relation requise';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: DropdownButtonFormField<String>(
                                initialValue: _countryCode,
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() => _countryCode = value);
                                  }
                                },
                                items: [
                                  '+226',
                                  '+225',
                                  '+224',
                                  '+221',
                                  '+233',
                                ]
                                    .map((code) => DropdownMenuItem(value: code, child: Text(code)))
                                    .toList(),
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 3,
                              child: AppTextField(
                                label: 'Téléphone',
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                validator: (value) {
                                  if (value?.isEmpty ?? true) return 'Téléphone requis';
                                  return null;
                                },
                              ),
                            ),
                          ],
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
                                label: _editingContact == null ? 'Ajouter' : 'Modifier',
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
