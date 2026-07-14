import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/address.dart';
import '../../shared/models/contact_confiance.dart';
import '../../shared/models/portefeuille.dart';
import '../../shared/models/faq.dart';
import '../../shared/models/support_ticket.dart';
import 'app_providers.dart';

// ── PROFIL SCREEN PROVIDERS ──────────────────────────────────────

/// Fournit la liste des adresses favorites de l'utilisateur
final addressesProvider = FutureProvider.autoDispose<List<Address>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get<Map<String, dynamic>>(
      '/addresses',
      queryParameters: {'page': 1, 'limit': 100},
    );

    final data = response['data'];
    if (data is Map && data.containsKey('addresses')) {
      final items = data['addresses'] as List;
      return items
          .map((item) => Address.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (e) {
    throw Exception('Erreur lors de la récupération des adresses: ${e.toString()}');
  }
});

/// Fournit la liste des contacts de confiance de l'utilisateur
final contactsConfianceProvider = FutureProvider.autoDispose<List<ContactConfiance>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get<Map<String, dynamic>>(
      '/contacts-confiance',
      queryParameters: {'page': 1, 'limit': 100},
    );

    final data = response['data'];
    if (data is Map && data.containsKey('contacts')) {
      final items = data['contacts'] as List;
      return items
          .map((item) => ContactConfiance.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (e) {
    throw Exception('Erreur lors de la récupération des contacts: ${e.toString()}');
  }
});

/// Fournit le portefeuille de l'utilisateur
final portefeuilleProvider = FutureProvider.autoDispose<Portefeuille>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get<Map<String, dynamic>>(
      '/paiement/portefeuille',
    );

    final data = response['data'];
    if (data is Map) {
      return Portefeuille.fromJson(data as Map<String, dynamic>);
    }
    throw Exception('Format de réponse invalide pour le portefeuille');
  } catch (e) {
    throw Exception('Erreur lors de la récupération du portefeuille: ${e.toString()}');
  }
});

// ── ASSISTANCE SCREEN PROVIDERS ──────────────────────────────────

/// Fournit la liste des FAQs
final faqsProvider = FutureProvider.autoDispose<List<Faq>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get<Map<String, dynamic>>(
      '/faqs',
      queryParameters: {'page': 1, 'limit': 100, 'isActive': 'true'},
    );

    final data = response['data'];
    if (data is List) {
      return data
          .map((item) => Faq.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (data is Map && data.containsKey('data')) {
      final items = data['data'] as List;
      return items
          .map((item) => Faq.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (e) {
    throw Exception('Erreur lors de la récupération des FAQs: ${e.toString()}');
  }
});

/// Fournir la liste des tickets de support de l'utilisateur
final ticketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get<Map<String, dynamic>>(
      '/support/tickets',
      queryParameters: {'page': 1, 'limit': 100},
    );

    final data = response['data'];
    if (data is List) {
      return data
          .map((item) => SupportTicket.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (data is Map && data.containsKey('data')) {
      final items = data['data'] as List;
      return items
          .map((item) => SupportTicket.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (e) {
    throw Exception('Erreur lors de la récupération des tickets: ${e.toString()}');
  }
});

/// Recherche des FAQs par terme
final faqSearchProvider = FutureProvider.autoDispose.family<List<Faq>, String>((ref, searchTerm) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    if (searchTerm.isEmpty) {
      return [];
    }

    final response = await apiService.get<Map<String, dynamic>>(
      '/faqs/search',
      queryParameters: {'q': searchTerm, 'page': 1, 'limit': 50},
    );

    final data = response['data'];
    if (data is List) {
      return data
          .map((item) => Faq.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (data is Map && data.containsKey('data')) {
      final items = data['data'] as List;
      return items
          .map((item) => Faq.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (e) {
    throw Exception('Erreur lors de la recherche: ${e.toString()}');
  }
});
