// ── Vue "propriétaire" d'une location (réservation de véhicule) ──────
//
// Miroir de la réponse aplatie de GET /locations/mes-locations et
// GET /locations/:id (locationController.js normalise les deux vers
// la même forme).

import '../../../../core/utils/json_parsers.dart';
import '../../../../shared/models/rental_vehicule_resume.dart';

export '../../../../shared/models/rental_vehicule_resume.dart' show VehiculeResume;

class PassagerResume {
  final String? idUtilisateur;
  final String? nom;
  final String? prenom;
  final String? photoProfil;
  final String? numeroTelephone;

  const PassagerResume({this.idUtilisateur, this.nom, this.prenom, this.photoProfil, this.numeroTelephone});

  String get nomComplet => '${prenom ?? ''} ${nom ?? ''}'.trim();

  factory PassagerResume.fromJson(Map<String, dynamic> json) {
    return PassagerResume(
      idUtilisateur: json['id_utilisateur'] as String?,
      nom: json['nom'] as String?,
      prenom: json['prenom'] as String?,
      photoProfil: json['photo_profil'] as String?,
      numeroTelephone: json['numero_telephone'] as String?,
    );
  }
}

// Convention des statuts introduite côté backend :
// en_attente | active | terminee | annulee | refusee
class LocationOwnerView {
  final String idLocation;
  final String statut;
  final DateTime? dateDebut;
  final DateTime? dateFin;
  final double? montantTotal;
  final VehiculeResume vehicule;
  final PassagerResume passager;
  final double? noteMoyenne;
  final String? idConversation;

  const LocationOwnerView({
    required this.idLocation,
    required this.statut,
    this.dateDebut,
    this.dateFin,
    this.montantTotal,
    required this.vehicule,
    required this.passager,
    this.noteMoyenne,
    this.idConversation,
  });

  int? get dureeJours {
    if (dateDebut == null || dateFin == null) return null;
    return dateFin!.difference(dateDebut!).inDays;
  }

  factory LocationOwnerView.fromJson(Map<String, dynamic> json) {
    final vehiculeJson = json['vehicule'];
    final passagerJson = json['passager'];
    return LocationOwnerView(
      idLocation: json['id_location'] as String,
      statut: json['statut'] as String? ?? 'en_attente',
      dateDebut: json['date_debut'] != null ? DateTime.tryParse(json['date_debut'] as String) : null,
      dateFin: json['date_fin'] != null ? DateTime.tryParse(json['date_fin'] as String) : null,
      montantTotal: parseDoubleNullable(json['montant_total']),
      vehicule: vehiculeJson is Map<String, dynamic>
          ? VehiculeResume.fromJson(vehiculeJson)
          : const VehiculeResume(),
      passager: passagerJson is Map<String, dynamic>
          ? PassagerResume.fromJson(passagerJson)
          : const PassagerResume(),
      noteMoyenne: parseDoubleNullable(json['note_moyenne']),
      idConversation: json['id_conversation'] as String?,
    );
  }
}
