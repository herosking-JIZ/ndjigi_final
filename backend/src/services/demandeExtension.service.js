/**
 * SERVICES/DEMANDEEXTENSION.SERVICE.JS
 * Business logic for extension requests management
 */

const { prisma } = require('../config/db');
const MissingDocumentsError = require('../errors/MissingDocumentsError');

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const REQUIRED_DOCUMENTS = {
  chauffeur: [
    'permis-de-conduite',
    'carte_grise',
    'assurance',
    'cni'
  ],
  proprietaire: [
    'permis-de-conduite',
    'carte_grise',
    'assurance',
    'cni',
    'contrat-nndjigi'
  ]
};

// ─────────────────────────────────────────────────────────────
// METHOD 1: createDemandeExtension
// ─────────────────────────────────────────────────────────────

async function createDemandeExtension(idUtilisateur, extensionType) {
  try {
    // 1. Vérifier qu'il n'existe pas déjà une demande EN_ATTENTE ou ACCEPTEE
    const existingDemande = await prisma.demande_extension.findFirst({
      where: {
        id_utilisateur: idUtilisateur,
        extension_type: extensionType,
        statut: { in: ['en_attente', 'accepte'] }
      }
    });

    if (existingDemande) {
      const error = new Error('Une demande est déjà en cours pour ce type d\'extension');
      error.code = 'EXISTING_REQUEST';
      throw error;
    }

    // 2. Récupérer tous les documents de l'utilisateur READY et non supprimés
    const userDocuments = await prisma.document.findMany({
      where: {
        id_utilisateur: idUtilisateur,
        status: 'READY',
        deletedAt: null
      }
    });

    // 3. Extraire les types de documents présents
    const availableDocTypes = userDocuments.map(d => d.type);

    // 4. Comparer avec les documents requis
    const requiredDocs = REQUIRED_DOCUMENTS[extensionType];
    const missingDocs = requiredDocs.filter(docType => !availableDocTypes.includes(docType));

    if (missingDocs.length > 0) {
      throw new MissingDocumentsError(missingDocs);
    }

    // 5. Créer la demande et assigner les documents dans une transaction
    const newDemande = await prisma.$transaction(async (tx) => {
      // a. Créer la demande d'extension
      const demande = await tx.demande_extension.create({
        data: {
          extension_type: extensionType,
          id_utilisateur: idUtilisateur,
          statut: 'en_attente'
        },
        include: { documents: true }
      });

      // b. Assigner les documents requis à la demande
      const docIdsToUpdate = userDocuments
        .filter(d => requiredDocs.includes(d.type))
        .map(d => d.id_document);

      if (docIdsToUpdate.length > 0) {
        await tx.document.updateMany({
          where: { id_document: { in: docIdsToUpdate } },
          data: { id_demande_extension: demande.id_demande_extension }
        });

        // Re-fetch documents after update
        demande.documents = await tx.document.findMany({
          where: { id_demande_extension: demande.id_demande_extension }
        });
      }

      return demande;
    });

    return newDemande;
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// METHOD 2: updateStatutDemande
// ─────────────────────────────────────────────────────────────

async function updateStatutDemande(idDemande, statut, motifRejet, adminId) {
  try {
    // 1. Récupérer la demande
    const demande = await prisma.demande_extension.findUnique({
      where: { id_demande_extension: idDemande },
      include: { utilisateur: true, documents: true }
    });

    if (!demande) {
      const error = new Error('Demande d\'extension non trouvée');
      error.code = 'NOT_FOUND';
      throw error;
    }

    // 2. Vérifier que le statut actuel est EN_ATTENTE
    if (demande.statut !== 'en_attente') {
      const error = new Error('Cette demande a déjà été traitée');
      error.code = 'ALREADY_PROCESSED';
      throw error;
    }

    // 3. Vérifier motif_rejet pour les refus
    if (statut === 'refuse' && !motifRejet) {
      const error = new Error('Le motif de rejet est obligatoire pour un refus');
      error.code = 'MISSING_REJECTION_REASON';
      throw error;
    }

    // 4. Mettre à jour dans une transaction
    const updatedDemande = await prisma.$transaction(async (tx) => {
      // a. Mettre à jour le statut
      const updated = await tx.demande_extension.update({
        where: { id_demande_extension: idDemande },
        data: {
          statut: statut
        },
        include: { utilisateur: true, documents: true }
      });

      // TODO: Stockage du motif_rejet
      // NOTE: Le champ motif_rejet n'existe pas dans le schéma Prisma.
      // Vous devez ajouter ce champ à demande_extension pour que le stockage du motif de rejet soit complet.

      // b. Si acceptée: ajouter rôle, créer profil métier, envoyer notif
      if (statut === 'accepte') {
        // i. Ajouter le rôle
        const roleMap = {
          chauffeur: 'chauffeur',
          proprietaire: 'proprietaire'
        };
        const roleToAdd = roleMap[demande.extension_type];

        await tx.utilisateur_role.upsert({
          where: {
            id_utilisateur_role: {
              id_utilisateur: demande.id_utilisateur,
              role: roleToAdd
            }
          },
          update: {
            actif: true,
            date_desactivation: null
          },
          create: {
            id_utilisateur: demande.id_utilisateur,
            role: roleToAdd,
            actif: true
          }
        });

        // ii. Créer l'entrée dans la table métier (chauffeur ou proprietaire)
        if (demande.extension_type === 'chauffeur') {
          await tx.chauffeur.upsert({
            where: { id_chauffeur: demande.id_utilisateur },
            update: { statut_validation: 'en_attente' },
            create: {
              id_chauffeur: demande.id_utilisateur,
              statut_validation: 'en_attente',
              type_service: 'covoiturage',
              statut_disponibilite: 'hors_ligne',
              nb_courses_effectuees: 0,
              solde_commission_du: 0
            }
          });
        } else if (demande.extension_type === 'proprietaire') {
          await tx.proprietaire.upsert({
            where: { id_proprietaire: demande.id_utilisateur },
            update: { statut_validation: 'en_attente' },
            create: {
              id_proprietaire: demande.id_utilisateur,
              statut_validation: 'en_attente',
              nb_locations_effectuees: 0
            }
          });
        }

        // iii. Créer notification d'acceptation
        const extensionLabel = demande.extension_type === 'chauffeur' ? 'Chauffeur' : 'Propriétaire';
        await tx.notification.create({
          data: {
            id_utilisateur: demande.id_utilisateur,
            type: 'EXTENSION_ACCEPTEE',
            titre: 'Demande d\'extension acceptée',
            contenu: `Votre demande pour devenir ${extensionLabel} a été acceptée.`,
            lu: false,
            id_objet_lie: idDemande
          }
        });
      }

      // c. Si refusée: créer notification de refus
      if (statut === 'refuse') {
        await tx.notification.create({
          data: {
            id_utilisateur: demande.id_utilisateur,
            type: 'EXTENSION_REFUSEE',
            titre: 'Demande d\'extension refusée',
            contenu: motifRejet,
            lu: false,
            id_objet_lie: idDemande
          }
        });
      }

      return updated;
    });

    return updatedDemande;
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// METHOD 3: getDemandesByUtilisateur
// ─────────────────────────────────────────────────────────────

async function getDemandesByUtilisateur(idUtilisateur) {
  try {
    const demandes = await prisma.demande_extension.findMany({
      where: { id_utilisateur: idUtilisateur },
      include: { documents: true }
    });

    return demandes;
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// METHOD 4: getAllDemandes (admin)
// ─────────────────────────────────────────────────────────────

async function getAllDemandes(filtres = {}) {
  try {
    const { statut, extension_type, page = 1, limit = 20 } = filtres;

    const where = {};
    if (statut) {
      where.statut = statut;
    }
    if (extension_type) {
      where.extension_type = extension_type;
    }

    const [demandes, total] = await Promise.all([
      prisma.demande_extension.findMany({
        where,
        include: { utilisateur: true, documents: true },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.demande_extension.count({ where })
    ]);

    return {
      demandes,
      total,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createDemandeExtension,
  updateStatutDemande,
  getDemandesByUtilisateur,
  getAllDemandes
};
