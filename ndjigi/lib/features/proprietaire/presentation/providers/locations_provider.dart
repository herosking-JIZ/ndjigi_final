import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_repository.dart';
import '../../data/models/location_owner_view.dart';

// ── Suivi des locations : une entrée par onglet (en_attente/active/historique) ─

final locationsProvider = FutureProvider.autoDispose
    .family<List<LocationOwnerView>, String>((ref, statut) async {
  final repository = ref.watch(locationRepositoryProvider);
  return repository.getMesLocations(statut: statut);
});
