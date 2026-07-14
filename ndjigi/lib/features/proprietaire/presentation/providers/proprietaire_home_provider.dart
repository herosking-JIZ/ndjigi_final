import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── Écran d'accueil propriétaire : ma flotte ──────────────────────────
// (mesVehiculesProvider vit désormais dans le module partagé
// features/vehicule/presentation/providers/mes_vehicules_provider.dart)

/// Affichage/masquage du montant des revenus totaux sur l'écran d'accueil —
/// bascule purement locale (aucun appel réseau), l'utilisateur doit taper
/// "Voir" pour révéler le montant déjà chargé.
final revenusVisibleProvider = StateProvider.autoDispose<bool>((ref) => false);
