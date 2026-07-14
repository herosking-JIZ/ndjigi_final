import 'package:file_picker/file_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/demande_extension_repository.dart';
import '../../data/models/demande_extension.dart';

// ── Énums et constantes ──────────────────────────────────────────────

enum UploadStatus { idle, uploading, ready, error }

const kRequiredDocs = {
  'chauffeur': ['permis-de-conduite', 'carte_grise', 'assurance', 'cni'],
  'proprietaire': ['permis-de-conduite', 'carte_grise', 'assurance', 'cni', 'contrat-nndjigi'],
};

const kDocLabels = {
  'permis-de-conduite': 'Permis de conduire',
  'carte_grise': 'Carte grise',
  'assurance': 'Attestation d\'assurance',
  'cni': 'Carte nationale d\'identité',
  'contrat-nndjigi': 'Contrat N\'DJIGI',
};

// ── État d'upload d'un document ──────────────────────────────────────

class DocumentUploadState {
  final String documentType;
  final String? localFilePath;
  final String? mimeType;
  final String? uploadedDocumentId;
  final UploadStatus status;
  final double progress; // 0.0 → 1.0
  final String? errorMessage;

  DocumentUploadState({
    required this.documentType,
    this.localFilePath,
    this.mimeType,
    this.uploadedDocumentId,
    this.status = UploadStatus.idle,
    this.progress = 0.0,
    this.errorMessage,
  });

  DocumentUploadState copyWith({
    String? localFilePath,
    String? mimeType,
    String? uploadedDocumentId,
    UploadStatus? status,
    double? progress,
    String? errorMessage,
  }) {
    return DocumentUploadState(
      documentType: documentType,
      localFilePath: localFilePath ?? this.localFilePath,
      mimeType: mimeType ?? this.mimeType,
      uploadedDocumentId: uploadedDocumentId ?? this.uploadedDocumentId,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

// ── État global de la demande d'extension ────────────────────────────

class DemandeExtensionState {
  final bool isLoading; // chargement initial
  final String? selectedRole; // 'chauffeur' | 'proprietaire' | null
  final Map<String, DocumentUploadState> docs; // type → état
  final List<DemandeExtension> existingDemandes;
  final bool isSubmitting;
  final String? errorMessage;
  final bool submitSuccess;

  DemandeExtensionState({
    this.isLoading = true,
    this.selectedRole,
    this.docs = const {},
    this.existingDemandes = const [],
    this.isSubmitting = false,
    this.errorMessage,
    this.submitSuccess = false,
  });

  // Vérifie si le bouton soumettre peut être activé
  bool get canSubmit =>
      selectedRole != null &&
      !isSubmitting &&
      docs.values.every((d) => d.status == UploadStatus.ready);

  // Vérifie s'il existe déjà une demande active pour le rôle sélectionné
  bool get hasActiveDemande =>
      selectedRole != null &&
      existingDemandes.any((d) =>
          d.extensionType == selectedRole &&
          (d.statut == 'en_attente' || d.statut == 'accepte'));

  DemandeExtensionState copyWith({
    bool? isLoading,
    String? selectedRole,
    Map<String, DocumentUploadState>? docs,
    List<DemandeExtension>? existingDemandes,
    bool? isSubmitting,
    String? errorMessage,
    bool? submitSuccess,
  }) {
    return DemandeExtensionState(
      isLoading: isLoading ?? this.isLoading,
      selectedRole: selectedRole ?? this.selectedRole,
      docs: docs ?? this.docs,
      existingDemandes: existingDemandes ?? this.existingDemandes,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage ?? this.errorMessage,
      submitSuccess: submitSuccess ?? this.submitSuccess,
    );
  }
}

// ── StateNotifier ────────────────────────────────────────────────────

class DemandeExtensionNotifier extends StateNotifier<DemandeExtensionState> {
  final DemandeExtensionRepository _repository;

  DemandeExtensionNotifier({required DemandeExtensionRepository repository})
      : _repository = repository,
        super(DemandeExtensionState());

  /// Charge les demandes existantes au démarrage de l'écran
  Future<void> initialize() async {
    try {
      state = state.copyWith(isLoading: true, errorMessage: null);
      final demandes = await _repository.getMesDemandes();
      state = state.copyWith(isLoading: false, existingDemandes: demandes);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Erreur lors du chargement: ${e.toString()}',
      );
    }
  }

  /// Sélectionne un rôle et initialise la liste des documents requis
  void selectRole(String role) {
    final requiredDocs = kRequiredDocs[role] ?? [];
    final newDocs = <String, DocumentUploadState>{};

    for (final docType in requiredDocs) {
      newDocs[docType] = DocumentUploadState(documentType: docType);
    }

    state = state.copyWith(
      selectedRole: role,
      docs: newDocs,
      errorMessage: null,
    );
  }

  /// Ouvre le sélecteur de fichier et stocke le fichier choisi
  Future<void> pickFile(String documentType) async {
    try {
      // Accepte les images et les PDFs
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'gif'],
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        final filePath = file.path;

        if (filePath != null) {
          final mimeType = _getMimeType(file.extension ?? '');
          final docs = state.docs;
          docs[documentType] = docs[documentType]!.copyWith(
            localFilePath: filePath,
            mimeType: mimeType,
            status: UploadStatus.idle,
            errorMessage: null,
          );
          state = state.copyWith(docs: docs);
        }
      }
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'Erreur lors de la sélection: ${e.toString()}',
      );
    }
  }

  /// Upload un document au serveur
  Future<void> uploadDocument(String documentType) async {
    final docState = state.docs[documentType];
    if (docState?.localFilePath == null) return;

    try {
      final docs = state.docs;
      docs[documentType] = docState!.copyWith(
        status: UploadStatus.uploading,
        progress: 0.0,
        errorMessage: null,
      );
      state = state.copyWith(docs: docs);

      final uploadedId = await _repository.uploadDocument(
        filePath: docState.localFilePath!,
        mimeType: docState.mimeType ?? 'application/octet-stream',
        documentType: documentType,
        onProgress: (progress) {
          final docs = state.docs;
          docs[documentType] = docs[documentType]!.copyWith(progress: progress);
          state = state.copyWith(docs: docs);
        },
      );

      final updatedDocs = state.docs;
      updatedDocs[documentType] = docState.copyWith(
        status: UploadStatus.ready,
        uploadedDocumentId: uploadedId,
        progress: 1.0,
      );
      state = state.copyWith(docs: updatedDocs);
    } catch (e) {
      final docs = state.docs;
      docs[documentType] = docs[documentType]!.copyWith(
        status: UploadStatus.error,
        errorMessage: e.toString(),
        progress: 0.0,
      );
      state = state.copyWith(docs: docs);
    }
  }

  /// Soumet la demande finale au serveur
  Future<void> submitDemande() async {
    if (!canSubmit) return;

    try {
      state = state.copyWith(isSubmitting: true, errorMessage: null);
      await _repository.createDemande(state.selectedRole!);
      state = state.copyWith(isSubmitting: false, submitSuccess: true);
    } catch (e) {
      final errorMsg = e.toString();
      String displayError = 'Erreur lors de la soumission';

      if (errorMsg.contains('409') || errorMsg.contains('en_cours')) {
        displayError = 'Une demande est déjà en cours pour ce rôle';
      } else if (errorMsg.contains('400') || errorMsg.contains('manquants')) {
        displayError = 'Certains documents manquent';
      }

      state = state.copyWith(
        isSubmitting: false,
        errorMessage: displayError,
      );
    }
  }

  /// Helper: détermine le type MIME d'après l'extension
  String _getMimeType(String extension) {
    final ext = extension.toLowerCase();
    return switch (ext) {
      'pdf' => 'application/pdf',
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'gif' => 'image/gif',
      _ => 'application/octet-stream',
    };
  }

  bool get canSubmit => state.canSubmit;
}

// ── Provider ─────────────────────────────────────────────────────────

final demandeExtensionProvider = StateNotifierProvider.autoDispose<
    DemandeExtensionNotifier, DemandeExtensionState>((ref) {
  return DemandeExtensionNotifier(
    repository: ref.watch(demandeExtensionRepositoryProvider),
  );
});
