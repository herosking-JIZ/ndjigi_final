import 'package:file_picker/file_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../course/data/course_repository.dart';
import '../../../course/data/models/course.dart';
import '../../../profil/presentation/providers/demande_extension_provider.dart'
    show UploadStatus, DocumentUploadState;
import '../../data/models/vehicule.dart';
import '../../data/vehicule_repository.dart';

// ── Formulaire d'ajout / édition d'un véhicule (course ou location) ───

const kCarteGriseKey = 'carte_grise';
const kAssuranceKey = 'assurance';

const kPhotoSlotKeys = ['profil', 'exterieur', 'dashboard', 'devant', 'interieur'];

const kPhotoSlotLabels = {
  'profil': 'Photo de profil',
  'exterieur': 'Photo de l\'extérieur',
  'dashboard': 'Photo du dashboard',
  'devant': 'Photo du devant',
  'interieur': 'Photo de l\'intérieur',
};

/// Options de service proposées pour un véhicule de course — évite la saisie
/// libre (le champ backend est un simple VarChar(20) non contraint).
const kTypeServiceOptions = ['standard', 'premium'];

/// Paramètres du formulaire : [type] détermine le sous-type créé/édité et
/// [idVehicule] la présence du mode édition.
class VehiculeFormParams {
  final String type; // 'course' | 'location'
  final String? idVehicule;

  const VehiculeFormParams({required this.type, this.idVehicule});

  @override
  bool operator ==(Object other) =>
      other is VehiculeFormParams && other.type == type && other.idVehicule == idVehicule;

  @override
  int get hashCode => Object.hash(type, idVehicule);
}

class VehiculeFormState {
  final String type;
  final bool isEditMode;
  final String? idVehicule;
  final bool isLoadingVehicule;
  final bool isLoadingCategories;
  final List<CategorieVehicule> categories;
  final CategorieVehicule? categorieSelectionnee;
  final String marque;
  final String modele;
  final String annee;
  final String couleur;
  final String immatriculation;
  final int nbPlaces;
  final bool climatisation;
  final String typeService;
  final String tarifBaseLocation;
  final String tarifParJourLocation;
  final Map<String, DocumentUploadState> uploads;
  final bool isSubmitting;
  final String? errorMessage;
  final bool submitSuccess;

  VehiculeFormState({
    required this.type,
    this.isEditMode = false,
    this.idVehicule,
    this.isLoadingVehicule = false,
    this.isLoadingCategories = true,
    this.categories = const [],
    this.categorieSelectionnee,
    this.marque = '',
    this.modele = '',
    this.annee = '',
    this.couleur = '',
    this.immatriculation = '',
    this.nbPlaces = 4,
    this.climatisation = false,
    this.typeService = '',
    this.tarifBaseLocation = '',
    this.tarifParJourLocation = '',
    Map<String, DocumentUploadState>? uploads,
    this.isSubmitting = false,
    this.errorMessage,
    this.submitSuccess = false,
  }) : uploads = uploads ??
            {
              kCarteGriseKey: DocumentUploadState(documentType: kCarteGriseKey),
              kAssuranceKey: DocumentUploadState(documentType: kAssuranceKey),
              for (final slot in kPhotoSlotKeys) slot: DocumentUploadState(documentType: slot),
            };

  // Documents/photos volontairement optionnels en v1 : seuls les champs
  // véhicule (+ type_service pour un véhicule de course) sont requis pour
  // activer le bouton de soumission. Les tarifs de location sont optionnels.
  bool get canSubmit =>
      !isSubmitting &&
      !isLoadingVehicule &&
      marque.trim().isNotEmpty &&
      modele.trim().isNotEmpty &&
      annee.trim().isNotEmpty &&
      couleur.trim().isNotEmpty &&
      immatriculation.trim().isNotEmpty &&
      nbPlaces >= 1 &&
      categorieSelectionnee != null &&
      (type != 'course' || typeService.trim().isNotEmpty);

  VehiculeFormState copyWith({
    String? idVehicule,
    bool? isLoadingVehicule,
    bool? isLoadingCategories,
    List<CategorieVehicule>? categories,
    CategorieVehicule? categorieSelectionnee,
    String? marque,
    String? modele,
    String? annee,
    String? couleur,
    String? immatriculation,
    int? nbPlaces,
    bool? climatisation,
    String? typeService,
    String? tarifBaseLocation,
    String? tarifParJourLocation,
    Map<String, DocumentUploadState>? uploads,
    bool? isSubmitting,
    String? errorMessage,
    bool? submitSuccess,
  }) {
    return VehiculeFormState(
      type: type,
      isEditMode: isEditMode,
      idVehicule: idVehicule ?? this.idVehicule,
      isLoadingVehicule: isLoadingVehicule ?? this.isLoadingVehicule,
      isLoadingCategories: isLoadingCategories ?? this.isLoadingCategories,
      categories: categories ?? this.categories,
      categorieSelectionnee: categorieSelectionnee ?? this.categorieSelectionnee,
      marque: marque ?? this.marque,
      modele: modele ?? this.modele,
      annee: annee ?? this.annee,
      couleur: couleur ?? this.couleur,
      immatriculation: immatriculation ?? this.immatriculation,
      nbPlaces: nbPlaces ?? this.nbPlaces,
      climatisation: climatisation ?? this.climatisation,
      typeService: typeService ?? this.typeService,
      tarifBaseLocation: tarifBaseLocation ?? this.tarifBaseLocation,
      tarifParJourLocation: tarifParJourLocation ?? this.tarifParJourLocation,
      uploads: uploads ?? this.uploads,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      submitSuccess: submitSuccess ?? this.submitSuccess,
    );
  }
}

class VehiculeFormNotifier extends StateNotifier<VehiculeFormState> {
  final VehiculeRepository _repository;
  final CourseRepository _courseRepository;

  VehiculeFormNotifier({
    required VehiculeRepository repository,
    required CourseRepository courseRepository,
    required String type,
    String? idVehicule,
  })  : _repository = repository,
        _courseRepository = courseRepository,
        super(VehiculeFormState(
          type: type,
          isEditMode: idVehicule != null,
          idVehicule: idVehicule,
          isLoadingVehicule: idVehicule != null,
        )) {
    _initialiser(idVehicule);
  }

  Future<void> _initialiser(String? idVehicule) async {
    Vehicule? existing;
    if (idVehicule != null) {
      try {
        existing = await _repository.getVehicule(idVehicule);
        state = state.copyWith(
          isLoadingVehicule: false,
          marque: existing.marque,
          modele: existing.modele,
          annee: existing.annee.toString(),
          couleur: existing.couleur ?? '',
          immatriculation: existing.immatriculation,
          nbPlaces: existing.nbPlaces,
          climatisation: existing.climatisation,
          typeService: existing.typeService ?? '',
          tarifBaseLocation: existing.tarifBaseLocation?.toString() ?? '',
          tarifParJourLocation: existing.tarifParJourLocation?.toString() ?? '',
        );
      } catch (_) {
        state = state.copyWith(
          isLoadingVehicule: false,
          errorMessage: 'Erreur lors du chargement du véhicule.',
        );
      }
    }
    await _chargerCategories(existing?.idCategorie);
  }

  Future<void> _chargerCategories(String? idCategorieExistante) async {
    try {
      final categories = await _courseRepository.getCategoriesVehicule();
      final selectionnee = idCategorieExistante == null
          ? null
          : categories.where((c) => c.idCategorie == idCategorieExistante).firstOrNull;
      state = state.copyWith(
        categories: categories,
        isLoadingCategories: false,
        categorieSelectionnee: selectionnee,
      );
    } catch (_) {
      state = state.copyWith(
        isLoadingCategories: false,
        errorMessage: 'Erreur lors du chargement des catégories.',
      );
    }
  }

  void setMarque(String v) => state = state.copyWith(marque: v);
  void setModele(String v) => state = state.copyWith(modele: v);
  void setAnnee(String v) => state = state.copyWith(annee: v);
  void setCouleur(String v) => state = state.copyWith(couleur: v);
  void setImmatriculation(String v) => state = state.copyWith(immatriculation: v);
  void setTypeService(String v) => state = state.copyWith(typeService: v);
  void setTarifBaseLocation(String v) => state = state.copyWith(tarifBaseLocation: v);
  void setTarifParJourLocation(String v) => state = state.copyWith(tarifParJourLocation: v);

  void incrementerPlaces() {
    if (state.nbPlaces >= 50) return;
    state = state.copyWith(nbPlaces: state.nbPlaces + 1);
  }

  void decrementerPlaces() {
    if (state.nbPlaces <= 1) return;
    state = state.copyWith(nbPlaces: state.nbPlaces - 1);
  }

  void toggleClimatisation(bool value) => state = state.copyWith(climatisation: value);

  void selectionnerCategorie(CategorieVehicule categorie) =>
      state = state.copyWith(categorieSelectionnee: categorie);

  /// Sélectionne un fichier image local pour un emplacement (document ou photo).
  /// L'envoi réel au serveur n'a lieu qu'à la soumission du formulaire.
  Future<void> pickFile(String slotKey) async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png'],
      );
      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;
      final filePath = file.path;
      if (filePath == null) return;

      final uploads = Map<String, DocumentUploadState>.from(state.uploads);
      uploads[slotKey] = uploads[slotKey]!.copyWith(
        localFilePath: filePath,
        mimeType: _mimeType(file.extension ?? ''),
        status: UploadStatus.idle,
        errorMessage: null,
      );
      state = state.copyWith(uploads: uploads);
    } catch (_) {
      // Sélection annulée ou échouée : l'utilisateur peut réessayer.
    }
  }

  String _mimeType(String extension) {
    switch (extension.toLowerCase()) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      default:
        return 'application/octet-stream';
    }
  }

  Future<bool> submit() async {
    if (!state.canSubmit) return false;

    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      final String idVehicule;
      if (state.isEditMode) {
        final vehicule = await _repository.modifierVehicule(
          state.idVehicule!,
          couleur: state.couleur.trim(),
          climatisation: state.climatisation,
          idCategorie: state.categorieSelectionnee?.idCategorie,
          nbPlaces: state.nbPlaces,
          typeService: state.type == 'course' ? state.typeService.trim() : null,
          tarifBaseLocation: state.type == 'location' ? double.tryParse(state.tarifBaseLocation.trim()) : null,
          tarifParJourLocation:
              state.type == 'location' ? double.tryParse(state.tarifParJourLocation.trim()) : null,
        );
        idVehicule = vehicule.idVehicule;
      } else {
        final vehicule = await _repository.creerVehicule(
          type: state.type,
          marque: state.marque.trim(),
          modele: state.modele.trim(),
          annee: int.parse(state.annee.trim()),
          couleur: state.couleur.trim(),
          immatriculation: state.immatriculation.trim(),
          nbPlaces: state.nbPlaces,
          idCategorie: state.categorieSelectionnee!.idCategorie,
          climatisation: state.climatisation,
          typeService: state.type == 'course' ? state.typeService.trim() : null,
          tarifBaseLocation: state.type == 'location' ? double.tryParse(state.tarifBaseLocation.trim()) : null,
          tarifParJourLocation:
              state.type == 'location' ? double.tryParse(state.tarifParJourLocation.trim()) : null,
        );
        idVehicule = vehicule.idVehicule;
      }

      await _envoyerFichiersEnAttente(idVehicule);

      state = state.copyWith(isSubmitting: false, submitSuccess: true, idVehicule: idVehicule);
      return true;
    } catch (_) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Erreur lors de l\'enregistrement du véhicule.',
      );
      return false;
    }
  }

  Future<void> _envoyerFichiersEnAttente(String idVehicule) async {
    await _envoyerDocumentSiPresent(idVehicule, kCarteGriseKey, 'carte_grise');
    await _envoyerDocumentSiPresent(idVehicule, kAssuranceKey, 'assurance');

    for (var i = 0; i < kPhotoSlotKeys.length; i++) {
      final slot = kPhotoSlotKeys[i];
      final upload = state.uploads[slot]!;
      if (upload.localFilePath == null || upload.status == UploadStatus.ready) continue;

      await _envoyerUnFichier(
        slotKey: slot,
        action: () => _repository.uploadPhotoVehicule(
          idVehicule: idVehicule,
          filePath: upload.localFilePath!,
          ordre: i,
          isPrincipale: i == 0,
        ),
      );
    }
  }

  Future<void> _envoyerDocumentSiPresent(String idVehicule, String slotKey, String documentType) async {
    final document = state.uploads[slotKey]!;
    if (document.localFilePath == null || document.status == UploadStatus.ready) return;

    await _envoyerUnFichier(
      slotKey: slotKey,
      action: () => _repository.uploadDocumentVehicule(
        idVehicule: idVehicule,
        type: documentType,
        filePath: document.localFilePath!,
      ),
    );
  }

  Future<void> _envoyerUnFichier({
    required String slotKey,
    required Future<String> Function() action,
  }) async {
    var uploads = Map<String, DocumentUploadState>.from(state.uploads);
    uploads[slotKey] = uploads[slotKey]!.copyWith(status: UploadStatus.uploading);
    state = state.copyWith(uploads: uploads);

    try {
      final id = await action();
      uploads = Map<String, DocumentUploadState>.from(state.uploads);
      uploads[slotKey] = uploads[slotKey]!.copyWith(status: UploadStatus.ready, uploadedDocumentId: id);
      state = state.copyWith(uploads: uploads);
    } catch (_) {
      uploads = Map<String, DocumentUploadState>.from(state.uploads);
      uploads[slotKey] = uploads[slotKey]!.copyWith(
        status: UploadStatus.error,
        errorMessage: 'Échec de l\'envoi',
      );
      state = state.copyWith(uploads: uploads);
    }
  }
}

// ── Provider ─────────────────────────────────────────────────────────
// Paramétré par le type de véhicule ('course'|'location') et l'id du
// véhicule existant (mode édition) ou null (création).

final vehiculeFormProvider = StateNotifierProvider.autoDispose
    .family<VehiculeFormNotifier, VehiculeFormState, VehiculeFormParams>((ref, params) {
  return VehiculeFormNotifier(
    repository: ref.watch(vehiculeRepositoryProvider),
    courseRepository: ref.watch(courseRepositoryProvider),
    type: params.type,
    idVehicule: params.idVehicule,
  );
});
