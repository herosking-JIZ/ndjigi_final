/**
 * DEV-ONLY SEED
 *
 * This seed creates test users and data for local development.
 *
 * In production:
 *   - Admins are created manually in Keycloak Admin Console by IT
 *   - Synced to PostgreSQL via webhook (PHASE 4) and reconciliation job (PHASE 5)
 *   - Gestionnaires are created by admins via the web interface
 *   - Other users (passager/chauffeur/proprietaire) self-register via OTP
 *
 * NEVER run this seed in staging or production environments.
 *
 * Required env vars (from .env):
 *   SEED_ADMIN_EMAIL
 *   SEED_ADMIN_PASSWORD
 *   SEED_GESTIONNAIRE_EMAIL
 *   SEED_GESTIONNAIRE_PASSWORD
 */

require('dotenv').config();
const { prisma } = require('../src/config/db');
const userProvisioningService = require('../src/services/userProvisioningService');
const logger = require('../src/utils/logger');

async function main() {
  logger.info({ event: 'seed_start', message: 'Starting DEV-ONLY seed' });

  try {
    // ──────────────────────────────────────────────────────────
    // Create parking
    // ──────────────────────────────────────────────────────────
    logger.info({ event: 'seed_creating_parking' });

    const parking = await prisma.parking.upsert({
      where: { nom: 'Parking Central Test' },
      update: {},
      create: {
        nom: 'Parking Central Test',
        ville: 'Ouagadougou',
        adresse: 'Rue de la Révolution, Ouagadougou',
        nombre_places_parking: 50,
        nombre_places_moto: 20,
        statut: 'actif',
        date_creation: new Date(),
      },
    });

    logger.info({
      event: 'seed_parking_created',
      id_parking: parking.id_parking,
      nom: parking.nom,
    });

    // ──────────────────────────────────────────────────────────
    // Create admin (DEV-ONLY exception)
    // ──────────────────────────────────────────────────────────
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@parkway.bf';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        'SEED_ADMIN_PASSWORD is required in .env for DEV-ONLY seed. Never use in production!'
      );
    }

    logger.info({
      event: 'seed_creating_admin',
      email: adminEmail,
    });

    try {
      const admin = await userProvisioningService.create({
        email: adminEmail,
        nom: 'Admin',
        prenom: 'NDJIGI',
        role: 'admin',
        numero_telephone: '+22670000001',
        tempPassword: adminPassword,
        sendInvitationEmail: false,
        systemUser: false,
      });

      logger.info({
        event: 'seed_admin_created',
        id_utilisateur: admin.id_utilisateur,
        keycloak_id: admin.keycloak_id,
        email: admin.email,
      });
    } catch (adminErr) {
      if (adminErr.code === 'EMAIL_EXISTS') {
        logger.info({
          event: 'seed_admin_already_exists',
          email: adminEmail,
        });
      } else {
        throw adminErr;
      }
    }

    // ──────────────────────────────────────────────────────────
    // Create gestionnaire (for testing gestionnaire flows)
    // ──────────────────────────────────────────────────────────
    const gestionnaireEmail = process.env.SEED_GESTIONNAIRE_EMAIL || 'gestionnaire.test@parkway.bf';
    const gestionnairePassword = process.env.SEED_GESTIONNAIRE_PASSWORD;

    if (!gestionnairePassword) {
      throw new Error(
        'SEED_GESTIONNAIRE_PASSWORD is required in .env for DEV-ONLY seed. Never use in production!'
      );
    }

    logger.info({
      event: 'seed_creating_gestionnaire',
      email: gestionnaireEmail,
      parking: parking.id_parking,
    });

    try {
      const gestionnaire = await userProvisioningService.create({
        email: gestionnaireEmail,
        nom: 'Test',
        prenom: 'Gestionnaire',
        role: 'gestionnaire',
        numero_telephone: '+22670000002',
        adresse: 'Rue de la Paix, Ouagadougou',
        metadata: { id_parking: parking.id_parking },
        tempPassword: gestionnairePassword,
        sendInvitationEmail: false,
        createdBy: {
          id_utilisateur: 'admin-seed-creator',
          role: 'admin',
        },
      });

      logger.info({
        event: 'seed_gestionnaire_created',
        id_utilisateur: gestionnaire.id_utilisateur,
        keycloak_id: gestionnaire.keycloak_id,
        email: gestionnaire.email,
        parking: parking.id_parking,
      });
    } catch (gestionnaireErr) {
      if (gestionnaireErr.code === 'EMAIL_EXISTS') {
        logger.info({
          event: 'seed_gestionnaire_already_exists',
          email: gestionnaireEmail,
        });
      } else {
        throw gestionnaireErr;
      }
    }

    // ──────────────────────────────────────────────────────────
    // Summary
    // ──────────────────────────────────────────────────────────
    logger.info({
      event: 'seed_complete',
      message: 'DEV-ONLY seed completed successfully',
      parking_created: parking.id_parking,
      admin_email: adminEmail,
      gestionnaire_email: gestionnaireEmail,
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ DEV-ONLY SEED COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📋 Test Credentials:\n');
    console.log(`   Admin:`);
    console.log(`     Email: ${adminEmail}`);
    console.log(`     Password: ${adminPassword}\n`);
    console.log(`   Gestionnaire:`);
    console.log(`     Email: ${gestionnaireEmail}`);
    console.log(`     Password: ${gestionnairePassword}\n`);
    console.log(`   Parking: ${parking.nom} (${parking.id_parking})\n`);
    console.log('⚠️  These credentials are for DEV ONLY');
    console.log('   Never use in staging or production!\n');
  } catch (error) {
    logger.error({
      event: 'seed_failed',
      error: error.message,
      code: error.code,
    });
    console.error('\n❌ Seed failed:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

    // Zones tarifaires
    zone_centre: '30000000-0000-0000-0000-000000000001',
    zone_ouaga2000: '30000000-0000-0000-0000-000000000002',
    zone_periph: '30000000-0000-0000-0000-000000000003',

    // Trajets
    trajet1: '40000000-0000-0000-0000-000000000001',
    trajet2: '40000000-0000-0000-0000-000000000002',
    trajet3: '40000000-0000-0000-0000-000000000003',

    // Code promo
    promo1: '50000000-0000-0000-0000-000000000001',
}

async function main() {
    console.log('🌱 Début du seed...')

    // ─── 1. UTILISATEURS & RÔLES ─────────────────────────────────
    // Using atomic userProvisioningService (system users for dev/test)
    console.log('👤 Création des utilisateurs avec userProvisioningService...')

    const users = [
        { nom: 'Diallo', prenom: 'Amadou', email: 'admin@parkway.bf', role: 'admin', numero_telephone: '+22670000001', adresse: 'Avenue Kwame Nkrumah, Ouagadougou' },
        { nom: 'Ouedraogo', prenom: 'Fatima', email: 'fatima.ouedraogo@gmail.com', role: 'passager', numero_telephone: '+22670000002', adresse: 'Secteur 15, Ouagadougou' },
        { nom: 'Compaoré', prenom: 'Ibrahim', email: 'ibrahim.compaore@gmail.com', role: 'passager', numero_telephone: '+22670000003', adresse: 'Gounghin, Ouagadougou' },
        { nom: 'Sawadogo', prenom: 'Marie', email: 'marie.sawadogo@gmail.com', role: 'passager', numero_telephone: '+22670000004', adresse: null },
        { nom: 'Kaboré', prenom: 'Seydou', email: 'seydou.kabore@gmail.com', role: 'chauffeur', numero_telephone: '+22670000005', adresse: null },
        { nom: 'Traoré', prenom: 'Moussa', email: 'moussa.traore@gmail.com', role: 'chauffeur', numero_telephone: '+22670000006', adresse: null },
        { nom: 'Zongo', prenom: 'Lassina', email: 'lassina.zongo@gmail.com', role: 'chauffeur', numero_telephone: '+22670000007', adresse: null },
        { nom: 'Nikiema', prenom: 'Adama', email: 'adama.nikiema@gmail.com', role: 'chauffeur', numero_telephone: '+22670000008', adresse: null },
        { nom: 'Ilboudo', prenom: 'Rasmane', email: 'rasmane.ilboudo@gmail.com', role: 'chauffeur', numero_telephone: '+22670000009', adresse: null },
        { nom: 'Ouattara', prenom: 'Hamidou', email: 'hamidou.ouattara@gmail.com', role: 'chauffeur', numero_telephone: '+22670000010', adresse: null },
        { nom: 'Belem', prenom: 'Justin', email: 'justin.belem@gmail.com', role: 'chauffeur', numero_telephone: '+22670000011', adresse: null },
        { nom: 'Coulibaly', prenom: 'Salif', email: 'salif.coulibaly@gmail.com', role: 'proprietaire', numero_telephone: '+22670000012', adresse: null },
        { nom: 'Barry', prenom: 'Aïssata', email: 'aissata.barry@gmail.com', role: 'proprietaire', numero_telephone: '+22670000013', adresse: null },
        { nom: 'Some', prenom: 'Eric', email: 'eric.some@parkway.bf', role: 'gestionnaire', numero_telephone: '+22670000014', adresse: null, metadata: { id_parking: IDS.parking1 } },
        { nom: 'Tapsoba', prenom: 'Alice', email: 'alice.tapsoba@parkway.bf', role: 'gestionnaire', numero_telephone: '+22670000015', adresse: null, metadata: { id_parking: IDS.parking2 } },
    ]

    for (const u of users) {
        try {
            await userProvisioningService.create({
                email: u.email,
                nom: u.nom,
                prenom: u.prenom,
                role: u.role,
                numero_telephone: u.numero_telephone,
                adresse: u.adresse,
                metadata: u.metadata || {},
                sendInvitationEmail: false,  // Skip email for seed users
                systemUser: true  // System user: skip Keycloak (dev/test environment)
            })
            console.log(`  ✓ ${u.email} (${u.role})`)
        } catch (error) {
            if (error.code === 'EMAIL_EXISTS') {
                console.log(`  ~ ${u.email} already exists, skipping`)
            } else {
                console.error(`  ✗ ${u.email}: ${error.message}`)
            }
        }
    }

    // ─── 3. PORTEFEUILLES ────────────────────────────────────────
    console.log('💰 Création des portefeuilles...')

    const portefeuilleIds = [
        IDS.passager1, IDS.passager2, IDS.passager3,
        IDS.chauffeur1, IDS.chauffeur2, IDS.chauffeur3,
        IDS.chauffeur4, IDS.chauffeur5, IDS.chauffeur6, IDS.chauffeur7,
        IDS.proprietaire1, IDS.proprietaire2,
    ]

    for (const id of portefeuilleIds) {
        await prisma.portefeuille.upsert({
            where: { id_utilisateur: id },
            update: {},
            create: {
                id_utilisateur: id,
                solde: Math.floor(Math.random() * 50000) + 5000,
                devise: 'XOF',
                statut: 'actif',
            },
        })
    }

    // ─── 4. PROFILS SATELLITES ───────────────────────────────────
    console.log('🔧 Création des profils satellites...')

    for (const id of [IDS.passager1, IDS.passager2, IDS.passager3]) {
        await prisma.passager.upsert({
            where: { id_passager: id },
            update: {},
            create: { id_passager: id, nb_courses_effectuees: Math.floor(Math.random() * 20) },
        })
    }

    const chauffeurIds = [
        IDS.chauffeur1, IDS.chauffeur2, IDS.chauffeur3, IDS.chauffeur4,
        IDS.chauffeur5, IDS.chauffeur6, IDS.chauffeur7,
    ]

    for (const id of chauffeurIds) {
        await prisma.chauffeur.upsert({
            where: { id_chauffeur: id },
            update: {},
            create: {
                id_chauffeur: id,
                statut_validation: 'valide',
                type_service: 'vtc',
                statut_disponibilite: ['disponible', 'en_course', 'hors_ligne'][Math.floor(Math.random() * 3)],
                note_chauffeur: (3.5 + Math.random() * 1.5).toFixed(2),
                nb_courses_effectuees: Math.floor(Math.random() * 100) + 10,
                numero_permis: `BF-${Math.floor(Math.random() * 900000) + 100000}`,
                date_expiration_permis: new Date('2027-12-31'),
            },
        })
    }

    for (const id of [IDS.proprietaire1, IDS.proprietaire2]) {
        await prisma.proprietaire.upsert({
            where: { id_proprietaire: id },
            update: {},
            create: {
                id_proprietaire: id,
                statut_validation: 'valide',
                nb_locations_effectuees: Math.floor(Math.random() * 30),
            },
        })
    }

    // ─── 5. PARKINGS ─────────────────────────────────────────────
    console.log('🅿️  Création des parkings...')

    await prisma.parking.upsert({
        where: { id_parking: IDS.parking1 },
        update: {},
        create: { id_parking: IDS.parking1, nom: 'Parking Central Ouaga', adresse: 'Avenue de la Nation, Ouagadougou', capacite_totale: 50, capacite_occupee: 12, latitude: 12.3647, longitude: -1.5334 },
    })

    await prisma.parking.upsert({
        where: { id_parking: IDS.parking2 },
        update: {},
        create: { id_parking: IDS.parking2, nom: 'Parking Zogona', adresse: 'Quartier Zogona, Ouagadougou', capacite_totale: 30, capacite_occupee: 5, latitude: 12.3801, longitude: -1.5204 },
    })

    // ─── 6. GESTIONNAIRES ────────────────────────────────────────
    console.log('🏢 Affectation des gestionnaires...')

    await prisma.gestionnaire_parking.upsert({
        where: { id_gestionnaire: IDS.gestionnaire1 },
        update: {},
        create: { id_gestionnaire: IDS.gestionnaire1, id_parking: IDS.parking1, date_prise_poste: new Date('2024-01-15') },
    })

    await prisma.gestionnaire_parking.upsert({
        where: { id_gestionnaire: IDS.gestionnaire2 },
        update: {},
        create: { id_gestionnaire: IDS.gestionnaire2, id_parking: IDS.parking2, date_prise_poste: new Date('2024-03-01') },
    })

    // ─── 7. CATÉGORIES DE VÉHICULE ───────────────────────────────
    // Doit être créé AVANT les véhicules car vehicule.id_categorie est une FK
    console.log('🏷️  Création des catégories de véhicule...')

    const categories = [
        { id_categorie: IDS.cat_eco, nom: 'Économique', description: 'Véhicules standards et économiques', actif: true },
        { id_categorie: IDS.cat_confort, nom: 'Confort', description: 'Véhicules confortables et climatisés', actif: true },
        { id_categorie: IDS.cat_suv, nom: 'SUV', description: 'Véhicules spacieux type SUV', actif: true },
        { id_categorie: IDS.cat_luxe, nom: 'Luxe', description: 'Véhicules haut de gamme', actif: true },
    ]

    for (const c of categories) {
        await prisma.categorie_vehicule.upsert({
            where: { id_categorie: c.id_categorie },
            update: {},
            create: c,
        })
    }

    // ─── 8. ZONES TARIFAIRES ─────────────────────────────────────
    // Plus de tarif_base/tarif_km/tarif_minute ici — ils sont dans tarif_categorie_zone
    console.log('📍 Création des zones tarifaires...')

    const zones = [
        { id_zone: IDS.zone_centre, nom: 'Centre-ville', vitesse_moyenne_kmh: 20, coefficient_max: 3.0, actif: true },
        { id_zone: IDS.zone_ouaga2000, nom: 'Ouaga 2000', vitesse_moyenne_kmh: 25, coefficient_max: 2.5, actif: true },
        { id_zone: IDS.zone_periph, nom: 'Périphérie', vitesse_moyenne_kmh: 50, coefficient_max: 2.0, actif: true },
    ]

    for (const z of zones) {
        await prisma.zone_tarifaire.upsert({
            where: { id_zone: z.id_zone },
            update: {},
            create: z,
        })
    }

    // ─── 9. MATRICE TARIFS ZONE × CATÉGORIE ──────────────────────
    // C'est le cœur de la nouvelle conception tarifaire
    // 3 zones × 4 catégories = 12 lignes
    console.log('💲 Création de la matrice tarifaire zone × catégorie...')

    const tarifs = [
        // Zone Centre-ville
        { id_zone: IDS.zone_centre, id_categorie: IDS.cat_eco, tarif_base: 400, tarif_km: 80, tarif_minute: 8, actif: true },
        { id_zone: IDS.zone_centre, id_categorie: IDS.cat_confort, tarif_base: 600, tarif_km: 120, tarif_minute: 12, actif: true },
        { id_zone: IDS.zone_centre, id_categorie: IDS.cat_suv, tarif_base: 1000, tarif_km: 200, tarif_minute: 20, actif: true },
        { id_zone: IDS.zone_centre, id_categorie: IDS.cat_luxe, tarif_base: 2000, tarif_km: 400, tarif_minute: 45, actif: true },

        // Zone Ouaga 2000
        { id_zone: IDS.zone_ouaga2000, id_categorie: IDS.cat_eco, tarif_base: 500, tarif_km: 100, tarif_minute: 10, actif: true },
        { id_zone: IDS.zone_ouaga2000, id_categorie: IDS.cat_confort, tarif_base: 800, tarif_km: 150, tarif_minute: 15, actif: true },
        { id_zone: IDS.zone_ouaga2000, id_categorie: IDS.cat_suv, tarif_base: 1200, tarif_km: 250, tarif_minute: 25, actif: true },
        { id_zone: IDS.zone_ouaga2000, id_categorie: IDS.cat_luxe, tarif_base: 2500, tarif_km: 500, tarif_minute: 55, actif: true },

        // Zone Périphérie
        { id_zone: IDS.zone_periph, id_categorie: IDS.cat_eco, tarif_base: 300, tarif_km: 70, tarif_minute: 7, actif: true },
        { id_zone: IDS.zone_periph, id_categorie: IDS.cat_confort, tarif_base: 500, tarif_km: 100, tarif_minute: 10, actif: true },
        { id_zone: IDS.zone_periph, id_categorie: IDS.cat_suv, tarif_base: 800, tarif_km: 180, tarif_minute: 18, actif: true },
        { id_zone: IDS.zone_periph, id_categorie: IDS.cat_luxe, tarif_base: 1800, tarif_km: 380, tarif_minute: 40, actif: true },
    ]

    for (const t of tarifs) {
        await prisma.tarif_categorie_zone.upsert({
            where: {
                id_zone_id_categorie: { id_zone: t.id_zone, id_categorie: t.id_categorie },
            },
            update: {},
            create: t,
        })
    }

    // ─── 10. VÉHICULES ───────────────────────────────────────────
    // Maintenant avec id_categorie (FK) au lieu de categorie (String)
    console.log('🚗 Création des véhicules...')

    const vehicules = [
        {
            id_vehicule: IDS.vehicule1,
            id_proprietaire: IDS.proprietaire1,
            id_categorie: IDS.cat_eco,        // Toyota Corolla → Économique
            immatriculation: 'BF-1234-AB',
            marque: 'Toyota', modele: 'Corolla', annee: 2020,
            nb_places: 4, couleur: 'Blanc', statut: 'disponible',
            climatisation: true, gps_actif: true,
        },
        {
            id_vehicule: IDS.vehicule2,
            id_proprietaire: IDS.proprietaire1,
            id_categorie: IDS.cat_suv,        // Honda CR-V → SUV
            immatriculation: 'BF-5678-CD',
            marque: 'Honda', modele: 'CR-V', annee: 2021,
            nb_places: 5, couleur: 'Gris', statut: 'disponible',
            climatisation: true, gps_actif: false,
        },
        {
            id_vehicule: IDS.vehicule3,
            id_proprietaire: IDS.proprietaire2,
            id_categorie: IDS.cat_confort,    // Hyundai Accent → Confort
            immatriculation: 'BF-9012-EF',
            marque: 'Hyundai', modele: 'Accent', annee: 2019,
            nb_places: 4, couleur: 'Noir', statut: 'disponible',
            climatisation: true, gps_actif: true,
        },
        {
            id_vehicule: IDS.vehicule4,
            id_proprietaire: IDS.proprietaire2,
            id_categorie: IDS.cat_luxe,       // Renault Duster → Luxe (pour tester)
            immatriculation: 'BF-3456-GH',
            marque: 'Renault', modele: 'Duster', annee: 2022,
            nb_places: 5, couleur: 'Bleu', statut: 'en_maintenance',
            climatisation: false, gps_actif: false,
        },
    ]

    for (const v of vehicules) {
        await prisma.vehicule.upsert({
            where: { id_vehicule: v.id_vehicule },
            update: {},
            create: v,
        })
    }

    // ─── 11. AFFECTATIONS VÉHICULE → CHAUFFEUR ───────────────────
    console.log('🔗 Affectation véhicules aux chauffeurs...')

    const affectations = [
        { id_affectation: IDS.affectation1, id_vehicule: IDS.vehicule1, id_chauffeur: IDS.chauffeur1 },
        { id_affectation: IDS.affectation2, id_vehicule: IDS.vehicule2, id_chauffeur: IDS.chauffeur2 },
        { id_affectation: IDS.affectation3, id_vehicule: IDS.vehicule3, id_chauffeur: IDS.chauffeur3 },
    ]

    for (const a of affectations) {
        await prisma.affectation_vehicule.upsert({
            where: { id_affectation: a.id_affectation },
            update: {},
            create: { ...a, est_active: true },
        })
    }

    // ─── 12. TRAJETS ─────────────────────────────────────────────
    console.log('🛣️  Création des trajets...')

    // Trajet 1 — terminé, véhicule Économique, zone Centre-ville
    // tarif = 400 + (8.5 × 80) + (25 min × 8) = 400 + 680 + 200 = 1280 XOF
    await prisma.trajet.upsert({
        where: { id_trajet: IDS.trajet1 },
        update: {},
        create: {
            id_trajet: IDS.trajet1,
            id_affectation: IDS.affectation1,
            id_zone: IDS.zone_centre,
            adresse_depart: 'Avenue Kwame Nkrumah, Ouagadougou',
            adresse_arrivee: 'Aéroport International de Ouagadougou',
            distance_km: 8.5,
            duree_estimee_min: 25,
            date_heure_debut: new Date('2025-03-10T08:00:00Z'),
            date_heure_fin: new Date('2025-03-10T08:25:00Z'),
            statut: 'termine',
            type_trajet: 'vtc',
            tarif_final: 1280,
        },
    })

    // Trajet 2 — terminé, véhicule SUV, zone Ouaga 2000
    // tarif = 1200 + (4.2 × 250) + (10 min × 25) = 1200 + 1050 + 250 = 2500 XOF
    await prisma.trajet.upsert({
        where: { id_trajet: IDS.trajet2 },
        update: {},
        create: {
            id_trajet: IDS.trajet2,
            id_affectation: IDS.affectation2,
            id_zone: IDS.zone_ouaga2000,
            adresse_depart: 'Quartier Zogona, Ouagadougou',
            adresse_arrivee: 'Marché Rood Woko, Ouagadougou',
            distance_km: 4.2,
            duree_estimee_min: 10,
            date_heure_debut: new Date('2025-03-11T14:00:00Z'),
            date_heure_fin: new Date('2025-03-11T14:12:00Z'),
            statut: 'termine',
            type_trajet: 'vtc',
            tarif_final: 2500,
        },
    })

    // Trajet 3 — en_attente pour tester les trajets actifs
    await prisma.trajet.upsert({
        where: { id_trajet: IDS.trajet3 },
        update: {},
        create: {
            id_trajet: IDS.trajet3,
            id_affectation: IDS.affectation3,
            id_zone: IDS.zone_periph,
            adresse_depart: 'Pissy, Ouagadougou',
            adresse_arrivee: 'Zone Industrielle, Ouagadougou',
            distance_km: 6.0,
            duree_estimee_min: 7,
            statut: 'en_attente',
            type_trajet: 'vtc',
            tarif_final: 1010, // 300 + (6 × 70) + (7 × 7) = 300 + 420 + 49 ≈ 769 arrondi
        },
    })

    // ─── 13. DOCUMENTS ───────────────────────────────────────────
    console.log('📄 Création des documents...')

    const docs = [
        { id_utilisateur: IDS.chauffeur1, type: 'permis', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/permis_c1.pdf', date_expiration: new Date('2027-06-30') },
        { id_utilisateur: IDS.chauffeur1, type: 'cni', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/cni_c1.pdf' },
        { id_utilisateur: IDS.chauffeur2, type: 'permis', statut_verification: 'en_attente', url_fichier: 'https://storage.parkway.bf/docs/permis_c2.pdf', date_expiration: new Date('2026-12-31') },
        { id_utilisateur: IDS.chauffeur3, type: 'permis', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/permis_c3.pdf', date_expiration: new Date('2028-03-15') },
        { id_utilisateur: IDS.proprietaire1, type: 'carte_grise', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/cg_p1_v1.pdf' },
        { id_utilisateur: IDS.proprietaire1, type: 'assurance', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/ass_p1.pdf', date_expiration: new Date('2026-01-01') },
        { id_utilisateur: IDS.proprietaire2, type: 'carte_grise', statut_verification: 'rejete', url_fichier: 'https://storage.parkway.bf/docs/cg_p2.pdf', motif_rejet: 'Document illisible' },
    ]

    for (const d of docs) {
        await prisma.document.create({ data: d })
    }

    // ─── 14. CODE PROMO ──────────────────────────────────────────
    console.log('🎟️  Création des codes promo...')

    await prisma.code_promo.upsert({
        where: { id_promo: IDS.promo1 },
        update: {},
        create: {
            id_promo: IDS.promo1,
            code: 'BIENVENUE20',
            type_reduction: 'pourcentage',
            valeur: 20,
            date_debut: new Date('2025-01-01'),
            date_fin: new Date('2025-12-31'),
            nb_utilisations_max: 100,
            actif: true,
        },
    })

    // ─── 15. AVIS ────────────────────────────────────────────────
    console.log('⭐ Création des avis...')

    await prisma.avis.create({
        data: {
            id_evaluateur: IDS.passager1,
            id_evalue: IDS.chauffeur1,
            id_trajet: IDS.trajet1,
            note: 5,
            commentaire: 'Excellent chauffeur, très ponctuel et courtois.',
        },
    })

    await prisma.avis.create({
        data: {
            id_evaluateur: IDS.passager2,
            id_evalue: IDS.chauffeur2,
            id_trajet: IDS.trajet2,
            note: 4,
            commentaire: 'Bon trajet, voiture propre.',
        },
    })

    console.log('')
    console.log('✅ Seed terminé avec succès !')
    console.log('')
    console.log('📋 Comptes créés (mot de passe : Password123!) :')
    console.log('   admin@parkway.bf               → Admin')
    console.log('   fatima.ouedraogo@gmail.com      → Passager')
    console.log('   ibrahim.compaore@gmail.com      → Passager')
    console.log('   marie.sawadogo@gmail.com        → Passager')
    console.log('   seydou.kabore@gmail.com         → Chauffeur (véhicule Économique)')
    console.log('   moussa.traore@gmail.com         → Chauffeur (véhicule SUV)')
    console.log('   lassina.zongo@gmail.com         → Chauffeur (véhicule Confort)')
    console.log('   salif.coulibaly@gmail.com       → Propriétaire')
    console.log('   aissata.barry@gmail.com         → Propriétaire')
    console.log('   eric.some@parkway.bf            → Gestionnaire (Parking Central)')
    console.log('   alice.tapsoba@parkway.bf        → Gestionnaire (Parking Zogona)')
    console.log('')
    console.log('🗺️  Zones créées : Centre-ville, Ouaga 2000, Périphérie')
    console.log('🏷️  Catégories créées : Économique, Confort, SUV, Luxe')
    console.log('💲 Matrice tarifaire : 3 zones × 4 catégories = 12 combinaisons')
}

main()
    .catch((e) => {
        console.error('❌ Erreur seed :', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })