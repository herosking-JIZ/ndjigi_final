/**
 * CONTROLLERS/DEMANDEEXTENSION.CONTROLLER.JS
 * Endpoints for extension requests
 */

const demandeExtensionService = require('../services/demandeExtension.service');
const MissingDocumentsError = require('../errors/MissingDocumentsError');

const demandeExtensionController = {
  /**
   * POST /demandes-extension
   * Create a new extension request
   */
  async create(req, res) {
    try {
      const idUtilisateur = req.user.id_utilisateur;
      const { extension_type } = req.body;

      const demande = await demandeExtensionService.createDemandeExtension(
        idUtilisateur,
        extension_type
      );

      return res.status(201).json({
        success: true,
        message: 'Demande d\'extension créée avec succès',
        data: demande
      });
    } catch (error) {
      console.error('[demandeExtensionController.create]', error);

      if (error instanceof MissingDocumentsError) {
        return res.status(400).json({
          success: false,
          message: 'Documents obligatoires manquants',
          missingDocuments: error.missingDocuments
        });
      }

      if (error.code === 'EXISTING_REQUEST') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * PATCH /demandes-extension/:id/statut
   * Update extension request status (admin only)
   */
  async updateStatut(req, res) {
    try {
      const idDemande = req.params.id;
      const adminId = req.user.id_utilisateur;
      const { statut, motif_rejet } = req.body;

      const demande = await demandeExtensionService.updateStatutDemande(
        idDemande,
        statut,
        motif_rejet,
        adminId
      );

      return res.status(200).json({
        success: true,
        message: 'Statut de la demande mis à jour',
        data: demande
      });
    } catch (error) {
      console.error('[demandeExtensionController.updateStatut]', error);

      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'ALREADY_PROCESSED') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'MISSING_REJECTION_REASON') {
        return res.status(422).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * GET /demandes-extension/mes-demandes
   * Get user's own extension requests
   */
  async getMesDemandes(req, res) {
    try {
      const idUtilisateur = req.user.id_utilisateur;

      const demandes = await demandeExtensionService.getDemandesByUtilisateur(
        idUtilisateur
      );

      return res.status(200).json({
        success: true,
        data: demandes
      });
    } catch (error) {
      console.error('[demandeExtensionController.getMesDemandes]', error);

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * GET /demandes-extension/admin
   * Get all extension requests (admin only)
   */
  async getAllDemandes(req, res) {
    try {
      const { statut, extension_type, page, limit } = req.query;

      const filtres = {
        statut: statut || null,
        extension_type: extension_type || null,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20
      };

      // Remove null values
      Object.keys(filtres).forEach(
        k => filtres[k] === null && delete filtres[k]
      );

      const result = await demandeExtensionService.getAllDemandes(filtres);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[demandeExtensionController.getAllDemandes]', error);

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  }
};

module.exports = demandeExtensionController;
