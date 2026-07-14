/**
 * CONTROLLERS/UTILISATEURCONTROLLER.JS
 * Fusion optimisée des deux versions
 * Couvre : profil connecté, admin, rôles, documents, mot de passe, soft delete
 */

const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');
const userProvisioningService = require('../services/userProvisioningService');
const ProvisioningError = require('../errors/ProvisioningError');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Champs publics sûrs à retourner au client */
const SELECT_PUBLIC = {
  id_utilisateur: true,
  nom: true,
  prenom: true,
  email: true,
  numero_telephone: true,
  photo_profil: true,
  adresse: true,
  statut_compte: true,
  note_moyenne: true,
  date_inscription: true,
  auth_provider: true,
  deux_fa_activee: true,
};

/** Vérifier que l'utilisateur existe et n'est pas soft-deleted */
async function getUtilisateurOuErreur(id, res) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id_utilisateur: id }
  });
  if (!utilisateur || utilisateur.supprime_le) {
    res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable.',
      data: null,
      errors: { code: 'USER_NOT_FOUND', id }
    });
    return null;
  }
  return utilisateur;
}

// ─────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────

const UtilisateurController = {

  // ──────────────────────────────────────────────────────────
  // GET /api/utilisateurs
  // Lister tous les utilisateurs (admin) avec pagination + filtres
  // ──────────────────────────────────────────────────────────
  async findAll(req, res) {
    try {
      const { page = 1, limit = 20, statut, role, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { supprime_le: null };
      if (statut) where.statut_compte = statut;
      if (role) where.utilisateur_role = { some: { role, actif: true } };
      if (search) {
        where.OR = [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { numero_telephone: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [utilisateurs, total] = await Promise.all([
        prisma.utilisateur.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_inscription: 'desc' },
          select: {
            ...SELECT_PUBLIC,
            utilisateur_role: { where: { actif: true }, select: { role: true } },
            chauffeur: { select: { statut_validation: true, statut_disponibilite: true } },
            passager: { select: { nb_courses_effectuees: true } },
            proprietaire: { select: { statut_validation: true } },
          }
        }),
        prisma.utilisateur.count({ where })
      ]);
      const dataq = utilisateurs.map(u => ({ ...u, roles: u.utilisateur_role.map(r => r.role), }));
      return res.status(200).json({
        success: true,
        message: 'Liste des utilisateurs récupérée.',
        data: {
          data: dataq,
          meta: { total, page: parseInt(page), limit: parseInt(limit) },
        },
        errors: null
      }
      );
    } catch (error) {
      console.error('[utilisateur.findAll]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // GET /api/utilisateurs/profil
  // Profil complet de l'utilisateur connecté
  // ──────────────────────────────────────────────────────────
  async monProfil(req, res) {
    try {
      const userId = req.user.id_utilisateur;

      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: userId },
        select: {
          ...SELECT_PUBLIC,
          utilisateur_role: { where: { actif: true }, select: { role: true, date_activation: true } },
          passager: true,
          chauffeur: true,
          proprietaire: true,
          gestionnaire: true,
          portefeuille: { select: { solde: true, devise: true, statut: true } },
          document: { orderBy: { date_soumission: 'desc' } },
        }
      });

      if (!utilisateur || utilisateur.supprime_le) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable.',
          data: null,
          errors: { code: 'PROFILE_NOT_FOUND' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profil récupéré.',
        data: utilisateur,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.monProfil]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // GET /api/utilisateurs/:id
  // Détail d'un utilisateur (admin)
  // ──────────────────────────────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: id },
        select: {
          ...SELECT_PUBLIC,
          utilisateur_role: { where: { actif: true } },
          passager: true,
          chauffeur: true,
          proprietaire: true,
          gestionnaire: true,
          portefeuille: { select: { solde: true, devise: true, statut: true } },
        }
      });

      if (!utilisateur || utilisateur.supprime_le) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable.',
          data: null,
          errors: { code: 'USER_NOT_FOUND', id }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Utilisateur trouvé.',
        data: utilisateur,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.findOne]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // PATCH /api/utilisateurs/profil
  // Mise à jour du profil connecté (sans email — sécurité)
  // ──────────────────────────────────────────────────────────
  async updateProfil(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { nom, prenom, adresse, photo_profil, numero_telephone } = req.body;

      const utilisateur = await prisma.utilisateur.update({
        where: { id_utilisateur: userId },
        data: {
          ...(nom && { nom }),
          ...(prenom && { prenom }),
          ...(adresse && { adresse }),
          ...(photo_profil && { photo_profil }),
          ...(numero_telephone && { numero_telephone }),
        },
        select: SELECT_PUBLIC,
      });

      return res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès.',
        data: utilisateur,
        errors: null
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Ce numéro de téléphone est déjà utilisé.',
          data: null,
          errors: { field: 'numero_telephone', code: 'DUPLICATE_PHONE' }
        });
      }
      console.error('[utilisateur.updateProfil]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // PATCH /api/utilisateurs/:id (admin)
  // Mise à jour par un admin
  // ──────────────────────────────────────────────────────────
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nom, prenom, photo_profil, adresse, numero_telephone } = req.body;

      const utilisateur = await getUtilisateurOuErreur(id, res);
      if (!utilisateur) return;

      const updated = await prisma.utilisateur.update({
        where: { id_utilisateur: id },
        data: {
          ...(nom && { nom }),
          ...(prenom && { prenom }),
          ...(photo_profil && { photo_profil }),
          ...(adresse && { adresse }),
          ...(numero_telephone && { numero_telephone }),
        },
        select: SELECT_PUBLIC,
      });

      return res.status(200).json({
        success: true,
        message: 'Profil mis à jour.',
        data: updated,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.update]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // DELETE /api/utilisateurs/:id
  // Soft delete + révocation sessions
  // ──────────────────────────────────────────────────────────
  async delete(req, res) {
    try {
      const { id } = req.params;

      const utilisateur = await getUtilisateurOuErreur(id, res);
      if (!utilisateur) return;

      await prisma.$transaction([
        prisma.utilisateur.update({
          where: { id_utilisateur: id },
          data: { supprime_le: new Date(), statut_compte: 'supprime' }
        }),
        prisma.session.updateMany({
          where: { id_utilisateur: id },
          data: { est_valide: false }
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Compte supprimé avec succès.',
        data: null,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.delete]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // PATCH /api/utilisateurs/:id/statut (admin)
  // Changer le statut + blocage optionnel
  // ──────────────────────────────────────────────────────────
  async changerStatut(req, res) {
    try {
      const { id } = req.params;
      const { statut, bloque_jusqu_au } = req.body;

      const statutsValides = ['actif', 'suspendu', 'banni'];
      if (!statutsValides.includes(statut)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide.`,
          data: null,
          errors: { code: 'INVALID_STATUS', acceptedValues: statutsValides }
        });
      }

      if (bloque_jusqu_au && isNaN(new Date(bloque_jusqu_au).getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format de date invalide.',
          data: null,
          errors: { code: 'INVALID_DATE' }
        });
      }

      const utilisateur = await getUtilisateurOuErreur(id, res);
      if (!utilisateur) return;

      await prisma.utilisateur.update({
        where: { id_utilisateur: id },
        data: {
          statut_compte: statut,
          bloque_jusqu_au: bloque_jusqu_au ? new Date(bloque_jusqu_au) : null,
        }
      });

      return res.status(200).json({
        success: true,
        message: `Compte ${statut} avec succès.`,
        data: null,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.changerStatut]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },
  // ──────────────────────────────────────────────────────────
  // POST /api/utilisateurs/:id/roles (admin)
  // Ajouter un rôle + créer la table satellite si nécessaire
  // ──────────────────────────────────────────────────────────
  async ajouterRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const rolesValides = ['passager', 'chauffeur', 'proprietaire', 'gestionnaire', 'admin'];
      if (!rolesValides.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Rôle invalide.`,
          data: null,
          errors: { code: 'INVALID_ROLE', acceptedValues: rolesValides }
        });
      }

      const utilisateur = await getUtilisateurOuErreur(id, res);
      if (!utilisateur) return;

      await prisma.$transaction(async (tx) => {
        await tx.utilisateur_role.upsert({
          where: { id_utilisateur_role: { id_utilisateur: id, role } },
          update: { actif: true, date_activation: new Date(), date_desactivation: null },
          create: { id_utilisateur: id, role, actif: true }
        });

        if (role === 'passager') {
          await tx.passager.upsert({
            where: { id_passager: id },
            update: {},
            create: { id_passager: id }
          });
        }
        if (role === 'chauffeur') {
          await tx.chauffeur.upsert({
            where: { id_chauffeur: id },
            update: {},
            create: { id_chauffeur: id, type_service: 'vtc' }
          });
        }
        if (role === 'proprietaire') {
          await tx.proprietaire.upsert({
            where: { id_proprietaire: id },
            update: {},
            create: { id_proprietaire: id }
          });
        }
        await tx.portefeuille.upsert({
          where: { id_utilisateur: id },
          update: {},
          create: { id_utilisateur: id }
        });
      });

      return res.status(200).json({
        success: true,
        message: `Rôle "${role}" ajouté avec succès.`,
        data: null,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.ajouterRole]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // DELETE /api/utilisateurs/:id/roles/:role (admin)
  // Retirer un rôle (soft — date_desactivation)
  // ──────────────────────────────────────────────────────────
  async retirerRole(req, res) {
    try {
      const { id, role } = req.params;

      await prisma.utilisateur_role.update({
        where: { id_utilisateur_role: { id_utilisateur: id, role } },
        data: { actif: false, date_desactivation: new Date() }
      });

      return res.status(200).json({
        success: true,
        message: `Rôle "${role}" retiré avec succès.`,
        data: null,
        errors: null
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Rôle introuvable pour cet utilisateur.',
          data: null,
          errors: { code: 'ROLE_NOT_FOUND', id, role }
        });
      }
      console.error('[utilisateur.retirerRole]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // POST /api/utilisateurs/documents
  // Téléverser un document (utilisateur connecté)
  // ──────────────────────────────────────────────────────────
  async uploadDocument(req, res) {
    try {
      const userId = req.user.id_utilisateur;
      const { type, url_fichier, date_expiration } = req.body;

      if (!type || !url_fichier) {
        return res.status(400).json({
          success: false,
          message: 'type et url_fichier sont obligatoires.',
          data: null,
          errors: { code: 'MISSING_FIELDS' }
        });
      }
      if (date_expiration && isNaN(new Date(date_expiration).getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format de date_expiration invalide.',
          data: null,
          errors: { code: 'INVALID_DATE' }
        });
      }

      const document = await prisma.document.create({
        data: {
          id_utilisateur: userId,
          type,
          url_fichier,
          date_expiration: date_expiration ? new Date(date_expiration) : null,
          statut_verification: 'en_attente',
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Document téléversé avec succès.',
        data: document,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.uploadDocument]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // GET /api/utilisateurs/documents
  // Lister mes documents (connecté)
  // ──────────────────────────────────────────────────────────
  async mesDocuments(req, res) {
    try {
      const userId = req.user.id_utilisateur;

      const documents = await prisma.document.findMany({
        where: { id_utilisateur: userId },
        orderBy: { date_soumission: 'desc' },
      });

      return res.status(200).json({
        success: true,
        message: 'Documents récupérés.',
        data: documents,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.mesDocuments]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // PATCH /api/utilisateurs/documents/:id/verifier (admin)
  // Vérifier un document
  // ──────────────────────────────────────────────────────────
  async verifierDocument(req, res) {
    try {
      const { id } = req.params;
      const { statut_verification } = req.body;

      const statutsValides = ['valide', 'rejete', 'en_attente'];
      if (!statutsValides.includes(statut_verification)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide.',
          data: null,
          errors: { code: 'INVALID_STATUS', acceptedValues: statutsValides }
        });
      }

      const document = await prisma.document.update({
        where: { id_document: id },
        data: { statut_verification }
      });

      return res.status(200).json({
        success: true,
        message: 'Statut du document mis à jour.',
        data: document,
        errors: null
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Document introuvable.',
          data: null,
          errors: { code: 'DOCUMENT_NOT_FOUND', id }
        });
      }
      console.error('[utilisateur.verifierDocument]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // POST /api/utilisateurs
  // Créer un nouvel utilisateur (IT/Admin seulement)
  // IT: peut créer passager, chauffeur, proprietaire
  // Admin: peut créer gestionnaire, admin + les rôles finaux
  // Uses atomic userProvisioningService for Keycloak + PG sync
  // ──────────────────────────────────────────────────────────
  async create(req, res) {
    try {
      const { email, nom, prenom, role, numero_telephone, adresse, id_parking } = req.body;
      const creatorRoles = req.user.utilisateur_role.map(r => r.role);

      // Validation des champs obligatoires
      if (!email || !nom || !prenom || !role || !numero_telephone) {
        return res.status(400).json({
          success: false,
          message: 'Champs obligatoires manquants: email, nom, prenom, role, numero_telephone.',
          data: null,
          errors: { code: 'MISSING_FIELDS' }
        });
      }

      // Gestionnaire requiert un parking
      if (role === 'gestionnaire' && !id_parking) {
        return res.status(400).json({
          success: false,
          message: 'Un parking doit être assigné au gestionnaire.',
          data: null,
          errors: { code: 'MISSING_PARKING' }
        });
      }

      // Vérifier les permissions basées sur le rôle du créateur et le rôle à créer
      const canCreateRole = (creatorRole, targetRole) => {
        if (creatorRole === 'admin') {
          return true; // Admin peut créer n'importe quel rôle
        }
        if (creatorRole === 'it') {
          return ['passager', 'chauffeur', 'proprietaire'].includes(targetRole);
        }
        return false;
      };

      const hasPermission = creatorRoles.some(cr => canCreateRole(cr, role));
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Vous n'avez pas la permission de créer un compte avec le rôle "${role}".`,
          data: null,
          errors: { code: 'FORBIDDEN', role }
        });
      }

      // Vérifier le parking si spécifié
      if (id_parking) {
        const parking = await prisma.parking.findUnique({
          where: { id_parking }
        });
        if (!parking) {
          return res.status(400).json({
            success: false,
            message: 'Le parking spécifié n\'existe pas.',
            data: null,
            errors: { field: 'id_parking', code: 'INVALID_PARKING' }
          });
        }
      }

      // Use userProvisioningService for atomic user creation
      const newUser = await userProvisioningService.create({
        email,
        nom,
        prenom,
        role,
        numero_telephone,
        adresse: adresse || null,
        metadata: id_parking ? { id_parking } : {},
        sendInvitationEmail: true,
        createdBy: {
          id_utilisateur: req.user.id_utilisateur,
          role: creatorRoles[0]
        }
      });

      console.log(`✅ User created: ${newUser.id_utilisateur}, role: ${role}, by: ${req.user.id_utilisateur}`);

      return res.status(201).json({
        success: true,
        message: `Utilisateur créé avec succès. Un email d'invitation a été envoyé à ${email}.`,
        data: {
          id_utilisateur: newUser.id_utilisateur,
          keycloak_id: newUser.keycloak_id,
          email: newUser.email,
          nom: newUser.nom,
          prenom: newUser.prenom,
          numero_telephone: newUser.numero_telephone,
          role: newUser.role,
          tempPassword: newUser.tempPassword
        },
        errors: null
      });
    } catch (error) {
      if (error instanceof ProvisioningError) {
        // Handle typed provisioning errors
        if (error.code === 'EMAIL_EXISTS') {
          return res.status(409).json({
            success: false,
            message: 'Un compte avec cet email existe déjà.',
            data: null,
            errors: { field: 'email', code: error.code }
          });
        }
        if (error.code === 'INVALID_ROLE') {
          return res.status(400).json({
            success: false,
            message: error.message,
            data: null,
            errors: { code: error.code, details: error.details }
          });
        }
        if (error.code === 'KEYCLOAK_ERROR') {
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du compte dans Keycloak.',
            data: null,
            errors: { code: error.code, originalError: error.details.originalError }
          });
        }
        if (error.code === 'ROLLBACK_FAILED') {
          return res.status(500).json({
            success: false,
            message: 'Erreur critique: veuillez contacter l\'administrateur.',
            data: null,
            errors: { code: error.code, details: error.details }
          });
        }
        // Generic provisioning error
        return res.status(500).json({
          success: false,
          message: error.message,
          data: null,
          errors: { code: error.code, details: error.details }
        });
      }

      console.error('[utilisateur.create]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création de l\'utilisateur.',
        data: null,
        errors: error.message
      });
    }
  },

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/users/sync
  // Synchronise les données utilisateur après Keycloak
  // Transforme utilisateur_role en roles pour Flutter
  // Auth: Bearer token requis
  // ──────────────────────────────────────────────────────────
  async syncUser(req, res) {
    try {
      const userId = req.user.id_utilisateur;

      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: userId },
        select: {
          id_utilisateur: true,
          email: true,
          nom: true,
          prenom: true,
          numero_telephone: true,
          statut_compte: true,
          deux_fa_activee: true,
          supprime_le: true,
          utilisateur_role: { where: { actif: true }, select: { role: true } },
        }
      });

      if (!utilisateur || utilisateur.supprime_le) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable.',
          data: null,
          errors: { code: 'USER_NOT_FOUND' }
        });
      }

      // Transformer utilisateur_role en roles (array de strings)
      const roles = utilisateur.utilisateur_role.map(ur => ur.role);

      // Si pas de rôle, assigner passager par défaut
      if (roles.length === 0) {
        roles.push('passager');
      }

      const data = {
        id_utilisateur: utilisateur.id_utilisateur,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        numero_telephone: utilisateur.numero_telephone,
        statut_compte: utilisateur.statut_compte,
        deux_fa_activee: utilisateur.deux_fa_activee,
        roles: roles,
      };

      return res.status(200).json({
        success: true,
        message: 'Synchronisation réussie.',
        data: data,
        errors: null
      });
    } catch (error) {
      console.error('[utilisateur.syncUser]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  },
};

module.exports = UtilisateurController;