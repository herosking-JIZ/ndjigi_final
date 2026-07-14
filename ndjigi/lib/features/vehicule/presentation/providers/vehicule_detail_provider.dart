import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../proprietaire/data/location_repository.dart';
import '../../data/models/vehicule.dart';
import '../../data/vehicule_repository.dart';

// ── Détail d'un véhicule : infos + galerie + documents + performance ──
//
// La "performance mensuelle" ne concerne que les véhicules de location : elle
// n'a pas d'endpoint dédié côté backend, elle est agrégée ici à partir des
// locations (historique + actives) du véhicule, identifié par son
// immatriculation (unique en base). Pour un véhicule de course, `performance`
// reste `null` (pas de notion de location/revenus de location applicable).

class PerformanceMensuelle {
  final int nbLocations;
  final double? noteMoyenne;
  final double revenus;

  const PerformanceMensuelle({this.nbLocations = 0, this.noteMoyenne, this.revenus = 0});
}

class VehiculeDetailData {
  final Vehicule vehicule;
  final List<PhotoVehicule> photos;
  final List<DocumentVehicule> documents;
  final PerformanceMensuelle? performance;

  const VehiculeDetailData({
    required this.vehicule,
    required this.photos,
    required this.documents,
    this.performance,
  });
}

final vehiculeDetailProvider =
    FutureProvider.autoDispose.family<VehiculeDetailData, String>((ref, idVehicule) async {
  final repository = ref.watch(vehiculeRepositoryProvider);

  final vehicule = await repository.getVehicule(idVehicule);
  final photos = await repository.getPhotosVehicule(idVehicule);
  final documents = await repository.getDocumentsVehicule(idVehicule);

  if (vehicule.type != 'location') {
    return VehiculeDetailData(vehicule: vehicule, photos: photos, documents: documents);
  }

  final locationRepository = ref.watch(locationRepositoryProvider);
  final results = await Future.wait([
    locationRepository.getMesLocations(statut: 'historique'),
    locationRepository.getMesLocations(statut: 'active'),
  ]);

  final historique = results[0];
  final actives = results[1];

  final locationsVehicule = [...historique, ...actives]
      .where((l) => l.vehicule.immatriculation == vehicule.immatriculation)
      .toList();

  final notes = locationsVehicule.map((l) => l.noteMoyenne).whereType<double>().toList();
  final revenus = locationsVehicule.fold<double>(0, (somme, l) => somme + (l.montantTotal ?? 0));

  return VehiculeDetailData(
    vehicule: vehicule,
    photos: photos,
    documents: documents,
    performance: PerformanceMensuelle(
      nbLocations: locationsVehicule.length,
      noteMoyenne: notes.isEmpty ? null : notes.reduce((a, b) => a + b) / notes.length,
      revenus: revenus,
    ),
  );
});
