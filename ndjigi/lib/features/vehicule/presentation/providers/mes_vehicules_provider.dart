import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/vehicule.dart';
import '../../data/vehicule_repository.dart';

// ── Liste des véhicules de l'utilisateur connecté, filtrée par sous-type ──
// [type] : 'course' (chauffeur) ou 'location' (propriétaire). Le backend
// renvoie tous les véhicules de l'utilisateur sans distinction ; le filtre
// se fait ici pour que chaque interface ne voie que ses propres véhicules.

final mesVehiculesProvider =
    FutureProvider.autoDispose.family<List<Vehicule>, String>((ref, type) async {
  final repository = ref.watch(vehiculeRepositoryProvider);
  final tous = await repository.getMesVehicules();
  return tous.where((v) => v.type == type).toList();
});
