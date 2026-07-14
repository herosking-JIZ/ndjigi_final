import type {
  LoginResponseData, Utilisateur, Document, Trajet,
  Transaction, FinanceKpis, Parking, VehiculeParking,
  MouvementParking, ZoneTarifaire, CategorieVehicule, TarifCategorieZone,
  CodePromo, AdminKpis, ChartDataPoint, TopChauffeur, Ticket,
} from '@/types'

export const MOCK_PASSWORDS: Record<string, string> = {
  'admin@ndjigi.bf': 'admin123',
  'gestionnaire@ndjigi.bf': 'gestionnaire123',
}

export const MOCK_LOGIN_DATA: Record<string, LoginResponseData> = {
  'admin@ndjigi.bf': {
    user: {
      id_utilisateur: 'uu-admin-001',
      numero_telephone: '+226 70 00 00 01',
      email: 'admin@ndjigi.bf',
      nom: 'Sawadogo',
      prenom: 'Kader',
      photo_profil: null,
      adresse: null,
      tentatives_connexion: 0,
      bloque_jusqu_au: null,
      date_inscription: '2024-01-01T00:00:00.000Z',
      statut_compte: 'actif',
      auth_provider: 'email',
      note_moyenne: null,
      deux_fa_activee: false,
      supprime_le: null,
      utilisateur_role: [{ id_utilisateur: 'uu-admin-001', role: 'admin', actif: true, date_activation: '2024-01-01T00:00:00.000Z', date_desactivation: null }],
    },
    permissions: ['utilisateur:lire','utilisateur:creer','utilisateur:modifier','document:valider','finance:lire','finance:rembourser','parking:gerer','config:gerer','support:gerer','dashboard:lire'],
    tokens: { accessToken: 'mock-access-admin', refreshToken: 'mock-refresh-admin' },
  },
  'gestionnaire@ndjigi.bf': {
    user: {
      id_utilisateur: 'uu-gestionnaire-001',
      numero_telephone: '+226 70 00 00 02',
      email: 'gestionnaire@ndjigi.bf',
      nom: 'Compaoré',
      prenom: 'Issa',
      photo_profil: null,
      adresse: null,
      tentatives_connexion: 0,
      bloque_jusqu_au: null,
      date_inscription: '2024-01-01T00:00:00.000Z',
      statut_compte: 'actif',
      auth_provider: 'email',
      note_moyenne: null,
      deux_fa_activee: false,
      supprime_le: null,
      utilisateur_role: [{ id_utilisateur: 'uu-gestionnaire-001', role: 'gestionnaire', actif: true, date_activation: '2024-01-01T00:00:00.000Z', date_desactivation: null }],
    },
    permissions: ['profil:lire','parking:lire','parking:gerer','journal_parking:creer','journal_parking:lire','vehicule:lire','vehicule:modifier_statut'],
    tokens: { accessToken: 'mock-access-gestionnaire', refreshToken: 'mock-refresh-gestionnaire' },
  },
}

export const MOCK_KPIS: AdminKpis = { total_utilisateurs: 1284, courses_aujourd_hui: 93, revenus_commission_jour: 48750, satisfaction_moyenne: 4.6, tendance_utilisateurs: 5.2, tendance_courses: -2.1 }
export const MOCK_COURSES_SEMAINE: ChartDataPoint[] = [{ label: 'Lun', value: 62 },{ label: 'Mar', value: 78 },{ label: 'Mer', value: 55 },{ label: 'Jeu', value: 91 },{ label: 'Ven', value: 110 },{ label: 'Sam', value: 87 },{ label: 'Dim', value: 45 }]
export const MOCK_EVOLUTION: ChartDataPoint[] = [{ label: 'Oct', value: 820 },{ label: 'Nov', value: 940 },{ label: 'Déc', value: 1100 },{ label: 'Jan', value: 980 },{ label: 'Fév', value: 1250 },{ label: 'Mar', value: 1430 },{ label: 'Avr', value: 1580 }]
export const MOCK_PAIEMENTS = [{ name: 'Mobile Money', value: 58 },{ name: 'Espèces', value: 28 },{ name: 'Carte Visa', value: 10 },{ name: 'Autre', value: 4 }]
export const MOCK_TOP_CHAUFFEURS: TopChauffeur[] = [{ rang: 1, nom: 'Hamidou Traoré', chiffre_affaires: 312000 },{ rang: 2, nom: 'Adama Ouédraogo', chiffre_affaires: 278500 },{ rang: 3, nom: 'Salif Kaboré', chiffre_affaires: 245000 },{ rang: 4, nom: 'Moussa Diallo', chiffre_affaires: 198000 },{ rang: 5, nom: 'Ibrahim Zongo', chiffre_affaires: 175500 }]

export let MOCK_UTILISATEURS: Utilisateur[] = [
  { id_utilisateur: 'u1', nom: 'Traoré', prenom: 'Hamidou', email: 'hamidou@gmail.com', numero_telephone: '+226 70 11 22 33', statut_compte: 'actif', date_inscription: '2024-03-15T10:00:00Z', roles: ['chauffeur'], note_moyenne: 4.8 },
  { id_utilisateur: 'u2', nom: 'Ouédraogo', prenom: 'Fatimata', email: 'fati@gmail.com', numero_telephone: '+226 76 44 55 66', statut_compte: 'actif', date_inscription: '2024-04-02T09:00:00Z', roles: ['passager'], note_moyenne: 4.5 },
  { id_utilisateur: 'u3', nom: 'Kaboré', prenom: 'Salif', email: 'salif.k@yahoo.fr', numero_telephone: '+226 65 77 88 99', statut_compte: 'suspendu', date_inscription: '2024-01-20T14:00:00Z', roles: ['chauffeur', 'proprietaire'], note_moyenne: 3.9 },
  { id_utilisateur: 'u4', nom: 'Diallo', prenom: 'Aïssata', email: 'aissata@hotmail.com', numero_telephone: '+226 71 33 44 55', statut_compte: 'en_attente', date_inscription: '2024-06-10T08:00:00Z', roles: ['chauffeur'] },
  { id_utilisateur: 'u5', nom: 'Zongo', prenom: 'Ibrahim', email: 'ibrahim.z@gmail.com', numero_telephone: '+226 60 22 33 44', statut_compte: 'actif', date_inscription: '2024-02-28T11:00:00Z', roles: ['passager', 'proprietaire'] },
  { id_utilisateur: 'u6', nom: 'Sawadogo', prenom: 'Mariam', email: 'mariam.s@gmail.com', numero_telephone: '+226 74 55 66 77', statut_compte: 'actif', date_inscription: '2024-05-05T16:00:00Z', roles: ['passager'] },
  { id_utilisateur: 'u7', nom: 'Compaoré', prenom: 'Seydou', email: 'seydou.c@gmail.com', numero_telephone: '+226 70 88 99 00', statut_compte: 'actif', date_inscription: '2024-03-22T13:00:00Z', roles: ['chauffeur'], note_moyenne: 4.7 },
  { id_utilisateur: 'u8', nom: 'Ouattara', prenom: 'Kadiatou', email: 'kadi.o@gmail.com', numero_telephone: '+226 79 11 00 99', statut_compte: 'suspendu', date_inscription: '2024-01-08T10:00:00Z', roles: ['proprietaire'] },
]

export const MOCK_DOCUMENTS: Document[] = [
  { id_document: 'd1', id_utilisateur: 'u1', utilisateur_nom: 'Traoré', utilisateur_prenom: 'Hamidou', type: 'permis', url_fichier: '/docs/p1.pdf', statut_verification: 'en_attente', date_soumission: '2024-11-20T08:30:00Z' },
  { id_document: 'd2', id_utilisateur: 'u3', utilisateur_nom: 'Kaboré', utilisateur_prenom: 'Salif', type: 'cni', url_fichier: '/docs/cni3.pdf', statut_verification: 'en_attente', date_soumission: '2024-11-22T10:15:00Z' },
  { id_document: 'd4', id_utilisateur: 'u2', utilisateur_nom: 'Ouédraogo', utilisateur_prenom: 'Fatimata', type: 'assurance', url_fichier: '/docs/a2.pdf', statut_verification: 'valide', date_soumission: '2024-10-10T09:00:00Z' },
  { id_document: 'd6', id_utilisateur: 'u8', utilisateur_nom: 'Ouattara', utilisateur_prenom: 'Kadiatou', type: 'cni', url_fichier: '/docs/cni8.pdf', statut_verification: 'rejete', date_soumission: '2024-09-28T16:00:00Z', motif_rejet: 'Document illisible' },
]

export const MOCK_TRAJETS: Trajet[] = [
  { id_trajet: 't1', passager_nom: 'Fatimata Ouédraogo', chauffeur_nom: 'Hamidou Traoré', adresse_depart: 'Place de la Nation', adresse_arrivee: 'Aéroport', distance_km: 12.4, duree_estimee_min: 28, tarif_final: 4200, methode_paiement: 'Mobile Money', statut: 'en_cours', date_heure_debut: new Date(Date.now() - 15*60*1000).toISOString(), type_trajet: 'course' },
  { id_trajet: 't3', passager_nom: 'Mariam Sawadogo', chauffeur_nom: 'Hamidou Traoré', adresse_depart: 'Marché Rood Woko', adresse_arrivee: 'Lycée Philippe Zinda', distance_km: 3.8, tarif_final: 1800, statut: 'termine', date_heure_debut: '2024-11-23T08:00:00Z', date_heure_fin: '2024-11-23T08:14:00Z', type_trajet: 'course' },
  { id_trajet: 't5', passager_nom: 'Aminata Sore', chauffeur_nom: 'Adama Ouédraogo', adresse_depart: 'Pissy', adresse_arrivee: 'Zone du Bois', distance_km: 9.3, tarif_final: 3500, statut: 'annule', date_heure_debut: '2024-11-22T14:00:00Z', type_trajet: 'course' },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id_paiement: 'p1', description: 'Course Place de la Nation → Aéroport', type: 'course', montant: 4200, statut: 'complete', date_paiement: '2024-11-23T08:28:00Z', id_utilisateur: 'u2' },
  { id_paiement: 'p2', description: 'Commission course #t3', type: 'commission', montant: 630, statut: 'complete', date_paiement: '2024-11-23T08:15:00Z', id_utilisateur: 'u1' },
  { id_paiement: 'p4', description: 'Remboursement course annulée #t5', type: 'remboursement', montant: 3500, statut: 'complete', date_paiement: '2024-11-22T15:00:00Z', id_utilisateur: 'u10' },
]

export const MOCK_FINANCE_KPIS: FinanceKpis = { commissions_totales: 1842000, volume_courses: 12280000, remboursements: 245000, taux_commission: 15, solde_wallet_plateforme: 4250000 }

export const MOCK_PARKINGS: Parking[] = [
  { id_parking: 'pk-001', nom: 'Parking Central Ouaga', adresse: "Avenue Kwame N'Krumah", ville: 'Ouagadougou', capacite_totale: 80, capacite_occupee: 54, horaires: '6h-23h', actif: true },
  { id_parking: 'pk-002', nom: 'Parking Gare Routière Nord', adresse: 'Rue de la Gare', ville: 'Ouagadougou', capacite_totale: 120, capacite_occupee: 78, horaires: '5h-24h', actif: true },
]

export const MOCK_VEHICULES_PARKING: VehiculeParking[] = [
  { id_vehicule: 'v1', immatriculation: 'AA-1234-BF', marque: 'Toyota', modele: 'Corolla', categorie: 'berline', proprietaire_nom: 'Salif Kaboré', statut: 'disponible', etat: 'bon_etat' },
  { id_vehicule: 'v2', immatriculation: 'BB-5678-BF', marque: 'Honda', modele: 'CR-V', categorie: 'suv', proprietaire_nom: 'Kadiatou Ouattara', statut: 'en_location', etat: 'bon_etat' },
  { id_vehicule: 'v3', immatriculation: 'CC-9012-BF', marque: 'Renault', modele: 'Clio', categorie: 'berline', proprietaire_nom: 'Ibrahim Zongo', statut: 'maintenance', etat: 'besoin_maintenance' },
]

export const MOCK_MOUVEMENTS: MouvementParking[] = [
  { id_log: 'm1', id_vehicule: 'v1', immatriculation: 'AA-1234-BF', id_parking: 'pk-001', parking_nom: 'Parking Central Ouaga', parkeur_nom: 'Issa Compaoré', type_mouvement: 'entree', etat_vehicule: 'bon_etat', date_mouvement: new Date(Date.now() - 2*60*60*1000).toISOString() },
]

export let _zones: ZoneTarifaire[] = [
  { id_zone: 'z-1', nom: 'Ouaga 2000', vitesse_moyenne_kmh: 20, coefficient_max: 3.0, actif: true },
  { id_zone: 'z-2', nom: 'Patte d\'Oie', vitesse_moyenne_kmh: 30, coefficient_max: 2.5, actif: true },
  { id_zone: 'z-3', nom: 'Périphérie', vitesse_moyenne_kmh: 50, coefficient_max: 2.0, actif: true },
]

export let _categories: CategorieVehicule[] = [
  { id_categorie: 'c-1', nom: 'Economique', description: 'Véhicules standard', actif: true },
  { id_categorie: 'c-2', nom: 'Confort', description: 'Véhicules climatisés', actif: true },
  { id_categorie: 'c-3', nom: 'Confort', description: 'Véhicules spacieux', actif: true },
  { id_categorie: 'c-4', nom: 'Premium', description: 'Véhicules haut de gamme', actif: true },
]

export let _tarifs: TarifCategorieZone[] = [
  { id_zone: 'z-1', id_categorie: 'c-1', tarif_base: 500,  tarif_km: 100, tarif_minute: 10, actif: true },
  { id_zone: 'z-1', id_categorie: 'c-2', tarif_base: 800,  tarif_km: 150, tarif_minute: 15, actif: true },
  { id_zone: 'z-1', id_categorie: 'c-3', tarif_base: 1200, tarif_km: 250, tarif_minute: 25, actif: true },
]

export const MOCK_PROMOS: CodePromo[] = [
  { id_promo: 'pr1', code: 'BIENVENUE20', type_reduction: 'pourcentage', valeur: 20, date_debut: '2024-01-01T00:00:00Z', nb_utilisations_actuel: 342, nb_utilisations_max: 500, actif: true },
]

export const MOCK_TICKETS: Ticket[] = [
  { id_ticket: 'tk1', id_utilisateur: 'u2', utilisateur_nom: 'Ouédraogo', utilisateur_prenom: 'Fatimata', sujet: 'Course annulée non remboursée', description: "Ma course du 22 novembre a été annulée mais je n'ai pas reçu mon remboursement.", statut: 'ouvert', priorite: 'haute', date_creation: '2024-11-23T09:00:00Z', id_trajet: 't5', eligible_remboursement: true },
  { id_ticket: 'tk2', id_utilisateur: 'u1', utilisateur_nom: 'Traoré', utilisateur_prenom: 'Hamidou', sujet: 'Problème de paiement commission', description: "Je n'arrive pas à payer mes commissions dues.", statut: 'en_cours', priorite: 'normale', date_creation: '2024-11-22T14:00:00Z', eligible_remboursement: false },
  { id_ticket: 'tk3', id_utilisateur: 'u5', utilisateur_nom: 'Zongo', utilisateur_prenom: 'Ibrahim', sujet: 'Compte bloqué par erreur', description: 'Mon compte a été bloqué sans raison.', statut: 'resolu', priorite: 'haute', date_creation: '2024-11-20T10:00:00Z', date_resolution: '2024-11-21T08:00:00Z', eligible_remboursement: false },
  { id_ticket: 'tk4', id_utilisateur: 'u6', utilisateur_nom: 'Sawadogo', utilisateur_prenom: 'Mariam', sujet: 'Chauffeur impoli', description: 'Le chauffeur a été très impoli pendant la course.', statut: 'ouvert', priorite: 'faible', date_creation: '2024-11-23T11:00:00Z', id_trajet: 't3', eligible_remboursement: false },
]

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit
  return { data: items.slice(start, start + limit), total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) }
}

export function filterUsers(search: string, role: string, statut: string) {
  return MOCK_UTILISATEURS.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.numero_telephone.includes(q)
    const matchRole = !role || u.roles.includes(role as any)
    const matchStatut = !statut || u.statut_compte === statut
    return matchSearch && matchRole && matchStatut
  })
}
