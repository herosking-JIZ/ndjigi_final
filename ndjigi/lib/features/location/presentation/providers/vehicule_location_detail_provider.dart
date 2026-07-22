import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../vehicule/data/models/vehicule.dart';
import '../../../vehicule/data/vehicule_repository.dart';
import '../../data/location_passager_repository.dart';
import '../../data/models/vehicule_location_detail.dart';

// ── Détail public d'un véhicule de location ───────────────────────────

final vehiculeLocationDetailProvider =
    FutureProvider.autoDispose.family<VehiculeLocationDetail, String>((ref, idVehicule) async {
  final repository = ref.watch(locationPassagerRepositoryProvider);
  return repository.getDetailVehicule(idVehicule);
});

/// Galerie photo complète du véhicule — endpoint générique et non restreint
/// (GET /photos/vehicule/:id), déjà utilisé côté propriétaire.
final photosVehiculeLocationProvider =
    FutureProvider.autoDispose.family<List<PhotoVehicule>, String>((ref, idVehicule) async {
  final repository = ref.watch(vehiculeRepositoryProvider);
  return repository.getPhotosVehicule(idVehicule);
});
