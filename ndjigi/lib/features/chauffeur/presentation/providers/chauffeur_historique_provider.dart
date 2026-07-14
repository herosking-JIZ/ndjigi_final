import 'package:flutter_riverpod/flutter_riverpod.dart';

class HistoriqueMock {
  final String date;
  final String heure;
  final String type;
  final String depart;
  final String arrivee;
  final int montant;
  final String statut;

  HistoriqueMock({
    required this.date,
    required this.heure,
    required this.type,
    required this.depart,
    required this.arrivee,
    required this.montant,
    required this.statut,
  });
}

// Données mockées historique
final historiqueMockProvider = Provider<List<HistoriqueMock>>((ref) => [
  HistoriqueMock(
    date: "Aujourd'hui",
    heure: '08:30',
    type: 'VTC',
    depart: 'Pissy',
    arrivee: 'Koulouba',
    montant: 1200,
    statut: 'Terminé',
  ),
  HistoriqueMock(
    date: "Aujourd'hui",
    heure: '10:15',
    type: 'VTC',
    depart: 'Gounghin',
    arrivee: 'Zone du Bois',
    montant: 1800,
    statut: 'Annulé',
  ),
  HistoriqueMock(
    date: 'Hier',
    heure: '14:00',
    type: 'Covoiturage',
    depart: 'Tanghin',
    arrivee: 'Dapoya',
    montant: 800,
    statut: 'Terminé',
  ),
  HistoriqueMock(
    date: 'Hier',
    heure: '17:30',
    type: 'VTC',
    depart: 'Pissy',
    arrivee: "Patte d'Oie",
    montant: 1500,
    statut: 'Terminé',
  ),
  HistoriqueMock(
    date: 'Cette semaine',
    heure: '09:00',
    type: 'Covoiturage',
    depart: 'Ouaga 2000',
    arrivee: 'Zogona',
    montant: 600,
    statut: 'Terminé',
  ),
]);

// Filtre actif
final filtreHistoriqueProvider = StateProvider<String>((ref) => 'Tous');

// Liste filtrée selon le filtre
final historiqueFiltreeProvider = Provider<List<HistoriqueMock>>((ref) {
  final tous = ref.watch(historiqueMockProvider);
  final filtre = ref.watch(filtreHistoriqueProvider);

  if (filtre == 'Tous') {
    return tous;
  }

  return tous.where((h) => h.type == filtre).toList();
});
