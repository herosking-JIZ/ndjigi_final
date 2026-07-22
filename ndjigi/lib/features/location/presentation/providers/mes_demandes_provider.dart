import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/location_passager_repository.dart';
import '../../data/models/location_passager_view.dart';

// ── Suivi des demandes de location (passager) : un provider par onglet ─

final mesDemandesProvider = FutureProvider.autoDispose
    .family<List<LocationPassagerView>, String>((ref, statut) async {
  final repository = ref.watch(locationPassagerRepositoryProvider);
  return repository.getMesDemandes(statut: statut);
});
