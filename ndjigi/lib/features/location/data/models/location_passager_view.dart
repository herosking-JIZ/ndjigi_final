// ── Vue "passager" d'une location (demande de location de véhicule) ──
//
// Miroir de la réponse aplatie de GET /locations/mes-demandes
// (locationController.js → mesDemandes) : équivalent passager de
// LocationOwnerView (côté propriétaire), avec `vehicule` + `proprietaire`
// au lieu de `passager`.

import '../../../../core/utils/json_parsers.dart';
import '../../../../shared/models/rental_vehicule_resume.dart';

export '../../../../shared/models/rental_vehicule_resume.dart' show VehiculeResume;

class ProprietaireContact {
  final String? idUtilisateur;
  final String? nom;
  final String? prenom;
  final String? numeroTelephone;

  const ProprietaireContact({this.idUtilisateur, this.nom, this.prenom, this.numeroTelephone});

  String get nomComplet => '${prenom ?? ''} ${nom ?? ''}'.trim();

  factory ProprietaireContact.fromJson(Map<String, dynamic> json) {
    return ProprietaireContact(
      idUtilisateur: json['id_utilisateur'] as String?,
      nom: json['nom'] as String?,
      prenom: json['prenom'] as String?,
      numeroTelephone: json['numero_telephone'] as String?,
    );
  }
}

// Convention des statuts (backend) : en_attente | active | terminee | annulee | refusee
class LocationPassagerView {
  final String idLocation;
  final String statut;
  final DateTime? dateDebut;
  final DateTime? dateFin;
  final double? montantTotal;
  final VehiculeResume vehicule;
  final ProprietaireContact proprietaire;
  final String? idConversation;

  const LocationPassagerView({
    required this.idLocation,
    required this.statut,
    this.dateDebut,
    this.dateFin,
    this.montantTotal,
    required this.vehicule,
    required this.proprietaire,
    this.idConversation,
  });

  int? get dureeJours {
    if (dateDebut == null || dateFin == null) return null;
    return dateFin!.difference(dateDebut!).inDays;
  }

  factory LocationPassagerView.fromJson(Map<String, dynamic> json) {
    final vehiculeJson = json['vehicule'];
    final proprietaireJson = json['proprietaire'];
    return LocationPassagerView(
      idLocation: json['id_location'] as String,
      statut: json['statut'] as String? ?? 'en_attente',
      dateDebut: json['date_debut'] != null ? DateTime.tryParse(json['date_debut'] as String) : null,
      dateFin: json['date_fin'] != null ? DateTime.tryParse(json['date_fin'] as String) : null,
      montantTotal: parseDoubleNullable(json['montant_total']),
      vehicule: vehiculeJson is Map<String, dynamic>
          ? VehiculeResume.fromJson(vehiculeJson)
          : const VehiculeResume(),
      proprietaire: proprietaireJson is Map<String, dynamic>
          ? ProprietaireContact.fromJson(proprietaireJson)
          : const ProprietaireContact(),
      idConversation: json['id_conversation'] as String?,
    );
  }
}
