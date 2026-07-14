// ── Véhicule d'un propriétaire (flotte) ───────────────────────────────

double? _parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int _parseInt(dynamic value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

class AffectationChauffeur {
  final String? nom;
  final String? prenom;
  final String? photoProfil;

  const AffectationChauffeur({this.nom, this.prenom, this.photoProfil});

  String get nomComplet => '${prenom ?? ''} ${nom ?? ''}'.trim();

  factory AffectationChauffeur.fromJson(Map<String, dynamic> json) {
    final utilisateur = json['utilisateur'];
    final u = utilisateur is Map<String, dynamic> ? utilisateur : json;
    return AffectationChauffeur(
      nom: u['nom'] as String?,
      prenom: u['prenom'] as String?,
      photoProfil: u['photo_profil'] as String?,
    );
  }
}

class Vehicule {
  final String idVehicule;
  final String immatriculation;
  final String marque;
  final String modele;
  final int annee;
  final int nbPlaces;
  final String? couleur;
  final String statut;
  final bool climatisation;
  final bool gpsActif;
  final String idCategorie;
  final double? fondsGenere;
  final String? photoPrincipaleId;
  final AffectationChauffeur? chauffeurAffecte;

  /// Sous-type dérivé de la présence de `vehicule_course`/`vehicule_location`
  /// dans la réponse backend : 'course' (VTC/covoiturage), 'location', ou
  /// 'inconnu' pour un véhicule orphelin (créé sans sous-type — ne doit
  /// apparaître ni dans "Ma flotte" ni dans "Mes véhicules").
  final String type;
  final String? typeService;
  final double? tarifBaseLocation;
  final double? tarifParJourLocation;

  const Vehicule({
    required this.idVehicule,
    required this.immatriculation,
    required this.marque,
    required this.modele,
    required this.annee,
    required this.nbPlaces,
    this.couleur,
    this.statut = 'disponible',
    this.climatisation = false,
    this.gpsActif = false,
    this.idCategorie = '',
    this.fondsGenere,
    this.photoPrincipaleId,
    this.chauffeurAffecte,
    this.type = 'inconnu',
    this.typeService,
    this.tarifBaseLocation,
    this.tarifParJourLocation,
  });

  factory Vehicule.fromJson(Map<String, dynamic> json) {
    String? photoId;
    final photos = json['photos'];
    if (photos is List && photos.isNotEmpty) {
      final premiere = photos.first;
      if (premiere is Map<String, dynamic>) {
        photoId = premiere['id_photo'] as String?;
      }
    }

    AffectationChauffeur? chauffeur;
    final vehiculeCourse = json['vehicule_course'];
    if (vehiculeCourse is Map<String, dynamic>) {
      final affectations = vehiculeCourse['affectation_vehicule'];
      if (affectations is List && affectations.isNotEmpty) {
        final premiere = affectations.first;
        if (premiere is Map<String, dynamic>) {
          final chauffeurJson = premiere['chauffeur'];
          if (chauffeurJson is Map<String, dynamic>) {
            chauffeur = AffectationChauffeur.fromJson(chauffeurJson);
          }
        }
      }
    }

    final vehiculeLocation = json['vehicule_location'];

    return Vehicule(
      idVehicule: json['id_vehicule'] as String,
      immatriculation: json['immatriculation'] as String? ?? '',
      marque: json['marque'] as String? ?? '',
      modele: json['modele'] as String? ?? '',
      annee: _parseInt(json['annee']),
      nbPlaces: _parseInt(json['nb_places'], fallback: 1),
      couleur: json['couleur'] as String?,
      statut: json['statut'] as String? ?? 'disponible',
      climatisation: json['climatisation'] as bool? ?? false,
      gpsActif: json['gps_actif'] as bool? ?? false,
      idCategorie: json['id_categorie'] as String? ?? '',
      fondsGenere: _parseDoubleNullable(json['fonds_genere']),
      photoPrincipaleId: photoId,
      chauffeurAffecte: chauffeur,
      type: vehiculeCourse is Map<String, dynamic>
          ? 'course'
          : (vehiculeLocation is Map<String, dynamic> ? 'location' : 'inconnu'),
      typeService: vehiculeCourse is Map<String, dynamic>
          ? vehiculeCourse['type_service'] as String?
          : null,
      tarifBaseLocation: vehiculeLocation is Map<String, dynamic>
          ? _parseDoubleNullable(vehiculeLocation['tarif_base_location'])
          : null,
      tarifParJourLocation: vehiculeLocation is Map<String, dynamic>
          ? _parseDoubleNullable(vehiculeLocation['tarif_par_jour_location'])
          : null,
    );
  }
}

// ── Document rattaché à un véhicule (carte grise, assurance) ─────────

class DocumentVehicule {
  final String idDocument;
  final String type;
  final String statutVerification;
  final DateTime? dateExpiration;

  const DocumentVehicule({
    required this.idDocument,
    required this.type,
    required this.statutVerification,
    this.dateExpiration,
  });

  bool get estVerifie => statutVerification == 'valide';

  factory DocumentVehicule.fromJson(Map<String, dynamic> json) {
    final dateExpirationRaw = json['date_expiration'] as String?;
    return DocumentVehicule(
      idDocument: json['id_document'] as String,
      type: json['type'] as String? ?? '',
      statutVerification: json['statut_verification'] as String? ?? 'en_attente',
      dateExpiration: dateExpirationRaw != null ? DateTime.tryParse(dateExpirationRaw) : null,
    );
  }
}

// ── Photo de la galerie d'un véhicule ─────────────────────────────────

class PhotoVehicule {
  final String idPhoto;
  final bool isPrincipale;
  final int ordre;
  final String? legende;

  const PhotoVehicule({
    required this.idPhoto,
    this.isPrincipale = false,
    this.ordre = 0,
    this.legende,
  });

  factory PhotoVehicule.fromJson(Map<String, dynamic> json) {
    return PhotoVehicule(
      idPhoto: json['id_photo'] as String,
      isPrincipale: json['is_principale'] as bool? ?? false,
      ordre: _parseInt(json['ordre']),
      legende: json['legende'] as String?,
    );
  }
}
